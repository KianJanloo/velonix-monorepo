import {
  WebSocketGateway, WebSocketServer,
  OnGatewayConnection, OnGatewayDisconnect,
  SubscribeMessage, MessageBody, ConnectedSocket,
} from "@nestjs/websockets";
import { Logger } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import type { Server, Socket } from "socket.io";
import { UserEntity } from "../users/user.entity";
import { CollaboratorsService } from "./collaborators.service";
import type { CollaboratorRole } from "@velonix/types";

type StudioRole = "owner" | CollaboratorRole;

interface Presence {
  socketId: string;
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  role: StudioRole;
}

interface SocketData {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
}

const roomOf = (gameId: string) => `game:${gameId}`;

/**
 * Real-time studio collaboration gateway.
 *
 * Clients connect with a JWT (handshake.auth.token), then `join` a game room.
 * Editors broadcast `studio:update` snapshots which are relayed to everyone
 * else in the room; presence is tracked so each client sees who's editing.
 */
@WebSocketGateway({
  namespace: "/studio",
  cors: { origin: true, credentials: true },
})
export class StudioGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;
  private readonly logger = new Logger(StudioGateway.name);

  /** gameId -> (socketId -> presence) */
  private readonly rooms = new Map<string, Map<string, Presence>>();

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly collaborators: CollaboratorsService,
    @InjectRepository(UserEntity) private readonly userRepo: Repository<UserEntity>,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token =
        (client.handshake.auth?.["token"] as string | undefined) ??
        (client.handshake.query?.["token"] as string | undefined);
      if (!token) throw new Error("missing token");

      const payload = await this.jwt.verifyAsync<{ sub: string }>(token, {
        secret: this.config.get<string>("jwt.accessSecret") ?? "fallback",
      });
      const user = await this.userRepo.findOne({
        where: { id: payload.sub },
        select: ["id", "username", "displayName", "avatarUrl"],
      });
      if (!user) throw new Error("user not found");

      const data: SocketData = {
        userId: user.id, username: user.username,
        displayName: user.displayName, avatarUrl: user.avatarUrl,
      };
      Object.assign(client.data, data);
    } catch {
      client.emit("studio:error", { message: "Unauthorized" });
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    for (const [gameId, members] of this.rooms) {
      if (members.delete(client.id)) {
        if (members.size === 0) this.rooms.delete(gameId);
        this.broadcastPresence(gameId);
      }
    }
  }

  @SubscribeMessage("studio:join")
  async onJoin(@ConnectedSocket() client: Socket, @MessageBody() body: { gameId: string }) {
    const d = client.data as SocketData;
    const gameId = body?.gameId;
    if (!gameId || !d?.userId) return { ok: false };

    const membership = await this.collaborators.getMembership(gameId, d.userId);
    if (membership.kind === "none") {
      client.emit("studio:error", { message: "You don't have access to this studio." });
      return { ok: false };
    }
    const role: StudioRole = membership.kind === "owner" ? "owner" : membership.role;

    await client.join(roomOf(gameId));
    const members = this.rooms.get(gameId) ?? new Map<string, Presence>();
    members.set(client.id, {
      socketId: client.id, userId: d.userId, username: d.username,
      displayName: d.displayName, avatarUrl: d.avatarUrl, role,
    });
    this.rooms.set(gameId, members);
    this.broadcastPresence(gameId);

    // Ask existing editors to share their in-progress snapshot with the room.
    client.to(roomOf(gameId)).emit("studio:sync-request", { byUserId: d.userId });
    return { ok: true, role };
  }

  @SubscribeMessage("studio:leave")
  onLeave(@ConnectedSocket() client: Socket, @MessageBody() body: { gameId: string }) {
    const gameId = body?.gameId;
    if (!gameId) return;
    void client.leave(roomOf(gameId));
    const members = this.rooms.get(gameId);
    if (members?.delete(client.id)) {
      if (members.size === 0) this.rooms.delete(gameId);
      this.broadcastPresence(gameId);
    }
  }

  @SubscribeMessage("studio:update")
  async onUpdate(@ConnectedSocket() client: Socket, @MessageBody() body: { gameId: string; snapshot: unknown }) {
    const d = client.data as SocketData;
    if (!body?.gameId || !d?.userId) return;
    if (!(await this.collaborators.canEdit(body.gameId, d.userId))) return; // viewers can't push
    client.to(roomOf(body.gameId)).emit("studio:update", {
      snapshot: body.snapshot,
      author: { userId: d.userId, displayName: d.displayName },
      at: Date.now(),
    });
  }

  /** Relay a single freehand drawing stroke to all peers. */
  @SubscribeMessage("studio:draw")
  async onDraw(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { gameId: string; stroke: unknown },
  ) {
    const d = client.data as SocketData;
    if (!body?.gameId || !d?.userId) return;
    if (!(await this.collaborators.canEdit(body.gameId, d.userId))) return;
    client.to(roomOf(body.gameId)).emit("studio:draw", {
      stroke: body.stroke,
      authorId: d.userId,
    });
  }

  /** Relay a clear-all-strokes event for a given page. */
  @SubscribeMessage("studio:draw-clear")
  async onDrawClear(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { gameId: string; pageId: string },
  ) {
    const d = client.data as SocketData;
    if (!body?.gameId || !d?.userId) return;
    if (!(await this.collaborators.canEdit(body.gameId, d.userId))) return;
    client.to(roomOf(body.gameId)).emit("studio:draw-clear", {
      pageId: body.pageId,
      authorId: d.userId,
    });
  }

  private broadcastPresence(gameId: string) {
    const members = this.rooms.get(gameId);
    const list = members ? Array.from(members.values()) : [];
    this.server.to(roomOf(gameId)).emit("studio:presence", { members: list });
  }
}
