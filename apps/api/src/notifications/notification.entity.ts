import {
  Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn,
} from "typeorm";

export type NotificationType =
  | "game_approved" | "game_rejected" | "game_published"
  | "new_review" | "new_sale" | "subscription" | "system"
  | "collab_invite" | "support_reply" | "new_follower";

@Entity("notifications")
@Index(["userId", "createdAt"])
export class NotificationEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ name: "user_id" })
  userId!: string;

  @Column({ type: "varchar", length: 32 })
  type!: NotificationType;

  @Column({ length: 160 })
  title!: string;

  @Column({ type: "text" })
  body!: string;

  @Column({ name: "link_url", type: "varchar", length: 512, nullable: true })
  linkUrl!: string | null;

  @Column({ name: "is_read", default: false })
  isRead!: boolean;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
