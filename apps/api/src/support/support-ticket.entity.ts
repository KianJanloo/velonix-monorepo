import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  OneToMany, Index,
} from "typeorm";
import { SupportMessageEntity } from "./support-message.entity";

export type TicketStatus = "open" | "pending" | "resolved";
export type TicketCategory = "general" | "billing" | "technical" | "report" | "feature";

/** A support conversation between a user (or guest) and the admin team. */
@Entity("support_tickets")
export class SupportTicketEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  /** Null for guest (logged-out) contact submissions. */
  @Index()
  @Column({ name: "user_id", type: "uuid", nullable: true })
  userId!: string | null;

  /** Contact details captured at submission (denormalised for guests). */
  @Column({ length: 120 })
  name!: string;

  @Column({ length: 255 })
  email!: string;

  @Column({ length: 200 })
  subject!: string;

  @Column({ type: "varchar", length: 16, default: "general" })
  category!: TicketCategory;

  @Index()
  @Column({ type: "varchar", length: 16, default: "open" })
  status!: TicketStatus;

  /** Bumped on every new message so admins can sort by activity. */
  @Column({ name: "last_message_at", type: "timestamptz" })
  lastMessageAt!: Date;

  @OneToMany(() => SupportMessageEntity, (m) => m.ticket)
  messages!: SupportMessageEntity[];

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
