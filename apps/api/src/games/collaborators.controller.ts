import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, UseGuards, Request, Version, BadRequestException,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam } from "@nestjs/swagger";
import { CollaboratorsService } from "./collaborators.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import type { CollaboratorRole } from "@velonix/types";

const ROLES: CollaboratorRole[] = ["editor", "viewer"];

@ApiTags("games")
@Controller("games/:gameId/collaborators")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth("JWT")
export class CollaboratorsController {
  constructor(private readonly collaborators: CollaboratorsService) {}

  @Get()
  @Version("1")
  @ApiOperation({ summary: "List collaborators on a game" })
  @ApiParam({ name: "gameId", format: "uuid" })
  list(@Param("gameId") gameId: string, @Request() req: { user: { id: string } }) {
    return this.collaborators.list(gameId, req.user.id);
  }

  @Get("me")
  @Version("1")
  @ApiOperation({ summary: "Get the current user's role on a game (owner/editor/viewer/none)" })
  @ApiParam({ name: "gameId", format: "uuid" })
  myMembership(@Param("gameId") gameId: string, @Request() req: { user: { id: string } }) {
    return this.collaborators.getMembership(gameId, req.user.id);
  }

  @Post()
  @Version("1")
  @ApiOperation({ summary: "Invite a collaborator by email or username (owner only, plan-gated)" })
  @ApiParam({ name: "gameId", format: "uuid" })
  invite(
    @Param("gameId") gameId: string,
    @Request() req: { user: { id: string } },
    @Body() body: { identifier?: string; role?: CollaboratorRole }
  ) {
    const identifier = body.identifier?.trim();
    if (!identifier) throw new BadRequestException("An email or username is required.");
    const role: CollaboratorRole = ROLES.includes(body.role as CollaboratorRole) ? body.role! : "editor";
    return this.collaborators.invite(gameId, req.user.id, identifier, role);
  }

  @Patch(":userId")
  @Version("1")
  @ApiOperation({ summary: "Change a collaborator's role (owner only)" })
  @ApiParam({ name: "gameId", format: "uuid" })
  @ApiParam({ name: "userId", format: "uuid" })
  updateRole(
    @Param("gameId") gameId: string,
    @Param("userId") userId: string,
    @Request() req: { user: { id: string } },
    @Body() body: { role?: CollaboratorRole }
  ) {
    if (!ROLES.includes(body.role as CollaboratorRole))
      throw new BadRequestException("Role must be 'editor' or 'viewer'.");
    return this.collaborators.updateRole(gameId, req.user.id, userId, body.role!);
  }

  @Delete(":userId")
  @Version("1")
  @ApiOperation({ summary: "Remove a collaborator (owner) or leave a game (self)" })
  @ApiParam({ name: "gameId", format: "uuid" })
  @ApiParam({ name: "userId", format: "uuid" })
  remove(
    @Param("gameId") gameId: string,
    @Param("userId") userId: string,
    @Request() req: { user: { id: string } }
  ) {
    return this.collaborators.remove(gameId, req.user.id, userId);
  }
}
