/**
 * Game Collaborator Entity — TypeORM
 * apps/api/src/games/collaborator.entity.ts
 *
 * Links a user to a game they've been invited to co-edit. The game's
 * `creatorId` is always the owner and is NOT represented here.
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from "typeorm";
import type { CollaboratorRole } from "@velonix/types";
import { UserEntity } from "../users/entities/user.entity";
import { GameEntity } from "./game.entity";

@Entity("game_collaborators")
@Unique(["gameId", "userId"])
@Index(["userId"])
export class GameCollaboratorEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "game_id" })
  gameId!: string;

  @ManyToOne(() => GameEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "game_id" })
  game!: GameEntity;

  @Column({ name: "user_id" })
  userId!: string;

  @ManyToOne(() => UserEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: UserEntity;

  @Column({ type: "varchar", default: "editor" })
  role!: CollaboratorRole;

  @Column({ name: "invited_by_id" })
  invitedById!: string;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
