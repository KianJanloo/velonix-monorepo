import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn,
  CreateDateColumn, Index,
} from "typeorm";
import { SupportTicketEntity } from "./support-ticket.entity";

/** A single message in a support ticket thread. */
@Entity("support_messages")
export class SupportMessageEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ name: "ticket_id" })
  ticketId!: string;

  @ManyToOne(() => SupportTicketEntity, (t) => t.messages, { onDelete: "CASCADE" })
  @JoinColumn({ name: "ticket_id" })
  ticket!: SupportTicketEntity;

  /** Null for guest authors. */
  @Column({ name: "sender_id", type: "uuid", nullable: true })
  senderId!: string | null;

  /** Who wrote it — drives left/right bubble + "Support" label. */
  @Column({ name: "sender_role", type: "varchar", length: 8, default: "user" })
  senderRole!: "user" | "admin";

  @Column({ type: "text" })
  body!: string;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
