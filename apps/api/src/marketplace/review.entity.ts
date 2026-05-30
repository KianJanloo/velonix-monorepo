import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne,
  JoinColumn, CreateDateColumn, UpdateDateColumn, Index, Unique
} from "typeorm";
import { UserEntity } from "../users/user.entity";
import { GameEntity } from "../games/game.entity";

@Entity("reviews")
@Unique(["gameId", "authorId"]) // One review per user per game
@Index(["gameId", "createdAt"])
export class ReviewEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ name: "game_id" })
  gameId!: string;

  @ManyToOne(() => GameEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "game_id" })
  game!: GameEntity;

  @Column({ name: "author_id" })
  authorId!: string;

  @ManyToOne(() => UserEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "author_id" })
  author!: UserEntity;

  @Column({ type: "smallint" })
  rating!: 1 | 2 | 3 | 4 | 5;

  @Column({ type: "varchar", length: 120, nullable: true })
  title!: string | null;

  @Column({ type: "text", nullable: true })
  body!: string | null;

  @Column({ name: "is_verified_purchase", default: false })
  isVerifiedPurchase!: boolean;

  @Column({ type: "int", default: 0 })
  helpful!: number;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
