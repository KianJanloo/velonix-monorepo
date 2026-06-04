import {
  Injectable, NotFoundException, ForbiddenException,
  BadRequestException, ConflictException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, ILike } from "typeorm";
import { GameEntity } from "./game.entity";
import { GameCollaboratorEntity } from "./collaborator.entity";
import { UserEntity } from "../users/user.entity";
import { NotificationsService } from "../notifications/notifications.service";
import { SUBSCRIPTION_LIMITS } from "@velonix/types/src";
import type { CollaboratorRole, SubscriptionTier } from "@velonix/types/src";

export type StudioMembership =
  | { kind: "owner" }
  | { kind: "collaborator"; role: CollaboratorRole }
  | { kind: "none" };

@Injectable()
export class CollaboratorsService {
  constructor(
    @InjectRepository(GameEntity) private readonly gameRepo: Repository<GameEntity>,
    @InjectRepository(GameCollaboratorEntity) private readonly collabRepo: Repository<GameCollaboratorEntity>,
    @InjectRepository(UserEntity) private readonly userRepo: Repository<UserEntity>,
    private readonly notifications: NotificationsService,
  ) {}

  /** Resolve a user's relationship to a game. */
  async getMembership(gameId: string, userId: string): Promise<StudioMembership> {
    const game = await this.gameRepo.findOne({ where: { id: gameId }, select: ["id", "creatorId"] });
    if (!game) return { kind: "none" };
    if (game.creatorId === userId) return { kind: "owner" };
    const collab = await this.collabRepo.findOne({ where: { gameId, userId } });
    return collab ? { kind: "collaborator", role: collab.role } : { kind: "none" };
  }

  /** True if the user may modify the design (owner or editor collaborator). */
  async canEdit(gameId: string, userId: string): Promise<boolean> {
    const m = await this.getMembership(gameId, userId);
    return m.kind === "owner" || (m.kind === "collaborator" && m.role === "editor");
  }

  /** True if the user can at least view the studio (owner or any collaborator). */
  async canView(gameId: string, userId: string): Promise<boolean> {
    return (await this.getMembership(gameId, userId)).kind !== "none";
  }

  /** Game ids the user collaborates on (not owns). */
  async gameIdsForUser(userId: string): Promise<string[]> {
    const rows = await this.collabRepo.find({ where: { userId }, select: ["gameId"] });
    return rows.map((r) => r.gameId);
  }

  async list(gameId: string, requesterId: string) {
    if (!(await this.canView(gameId, requesterId)))
      throw new ForbiddenException("You don't have access to this game.");
    const collabs = await this.collabRepo.find({
      where: { gameId },
      relations: ["user"],
      order: { createdAt: "ASC" },
    });
    return collabs.map((c) => this.toDto(c));
  }

  private async ownerGuard(gameId: string, requesterId: string): Promise<GameEntity> {
    const game = await this.gameRepo.findOne({ where: { id: gameId }, relations: ["creator"] });
    if (!game) throw new NotFoundException("Game not found.");
    if (game.creatorId !== requesterId)
      throw new ForbiddenException("Only the game owner can manage collaborators.");
    return game;
  }

  async invite(gameId: string, ownerId: string, identifier: string, role: CollaboratorRole) {
    const game = await this.ownerGuard(gameId, ownerId);

    const tier = (game.creator?.subscriptionTier ?? "free") as SubscriptionTier;
    const limits = SUBSCRIPTION_LIMITS[tier];
    if (!limits.hasTeamCollaboration)
      throw new ForbiddenException("Team collaboration is available on Pro and Studio plans.");

    const current = await this.collabRepo.count({ where: { gameId } });
    if (current >= limits.maxCollaborators)
      throw new BadRequestException(
        `Your ${tier} plan allows up to ${limits.maxCollaborators} collaborator${limits.maxCollaborators === 1 ? "" : "s"} per game.`
      );

    const id = identifier.trim();
    const invitee = await this.userRepo.findOne({
      where: id.includes("@") ? { email: ILike(id) } : { username: ILike(id) },
    });
    if (!invitee) throw new NotFoundException(`No user found for "${identifier}".`);
    if (invitee.id === ownerId) throw new BadRequestException("You already own this game.");

    const existing = await this.collabRepo.findOne({ where: { gameId, userId: invitee.id } });
    if (existing) throw new ConflictException("That user is already a collaborator.");

    const saved = await this.collabRepo.save(
      this.collabRepo.create({ gameId, userId: invitee.id, role, invitedById: ownerId })
    );

    await this.notifications.create({
      userId: invitee.id,
      type: "collab_invite",
      title: `You've been added to "${game.title}"`,
      body: `${game.creator?.displayName ?? "A creator"} invited you to collaborate as ${role}.`,
      linkUrl: `/studio/${gameId}`,
    });

    const withUser = await this.collabRepo.findOne({ where: { id: saved.id }, relations: ["user"] });
    return this.toDto(withUser!);
  }

  async updateRole(gameId: string, ownerId: string, userId: string, role: CollaboratorRole) {
    await this.ownerGuard(gameId, ownerId);
    const collab = await this.collabRepo.findOne({ where: { gameId, userId }, relations: ["user"] });
    if (!collab) throw new NotFoundException("Collaborator not found.");
    collab.role = role;
    await this.collabRepo.save(collab);
    return this.toDto(collab);
  }

  /** Owner can remove anyone; a collaborator may remove themselves (leave). */
  async remove(gameId: string, requesterId: string, userId: string) {
    const game = await this.gameRepo.findOne({ where: { id: gameId }, select: ["id", "creatorId"] });
    if (!game) throw new NotFoundException("Game not found.");
    if (game.creatorId !== requesterId && requesterId !== userId)
      throw new ForbiddenException("You can't remove this collaborator.");
    await this.collabRepo.delete({ gameId, userId });
    return { removed: true };
  }

  private toDto(c: GameCollaboratorEntity) {
    return {
      id: c.id,
      gameId: c.gameId,
      userId: c.userId,
      role: c.role,
      invitedById: c.invitedById,
      createdAt: c.createdAt,
      user: c.user
        ? {
            id: c.user.id,
            username: c.user.username,
            displayName: c.user.displayName,
            avatarUrl: c.user.avatarUrl,
          }
        : undefined,
    };
  }
}
