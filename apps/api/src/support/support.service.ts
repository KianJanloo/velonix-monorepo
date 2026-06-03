import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { SupportTicketEntity, type TicketCategory, type TicketStatus } from "./support-ticket.entity";
import { SupportMessageEntity } from "./support-message.entity";
import { UserEntity } from "../users/user.entity";
import { NotificationsService } from "../notifications/notifications.service";

interface CreateTicketInput {
  userId: string | null;
  name: string;
  email: string;
  subject: string;
  category: TicketCategory;
  body: string;
}

@Injectable()
export class SupportService {
  constructor(
    @InjectRepository(SupportTicketEntity)
    private readonly ticketRepo: Repository<SupportTicketEntity>,
    @InjectRepository(SupportMessageEntity)
    private readonly messageRepo: Repository<SupportMessageEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly notifications: NotificationsService,
  ) {}

  /** Opens a ticket with its first message. */
  async createTicket(input: CreateTicketInput) {
    const now = new Date();
    const ticket = await this.ticketRepo.save(this.ticketRepo.create({
      userId: input.userId,
      name: input.name,
      email: input.email,
      subject: input.subject,
      category: input.category,
      status: "open",
      lastMessageAt: now,
    }));
    await this.messageRepo.save(this.messageRepo.create({
      ticketId: ticket.id,
      senderId: input.userId,
      senderRole: "user",
      body: input.body,
    }));
    return ticket;
  }

  /** A user's own tickets, newest activity first, with full threads. */
  async myTickets(userId: string) {
    return this.ticketRepo.find({
      where: { userId },
      order: { lastMessageAt: "DESC" },
      relations: ["messages"],
    });
  }

  /** User reply on their own ticket. */
  async userReply(userId: string, ticketId: string, body: string) {
    const ticket = await this.ticketRepo.findOne({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundException("Ticket not found.");
    if (ticket.userId !== userId) throw new ForbiddenException("Not your ticket.");
    await this.addMessage(ticket, userId, "user", body);
    ticket.status = "open"; // reopens for the team
    return this.ticketRepo.save(ticket);
  }

  // ── Admin ──────────────────────────────────────────────────────────────────

  async list(status?: TicketStatus, page = 1, perPage = 20) {
    const where = status ? { status } : {};
    const [data, total] = await this.ticketRepo.findAndCount({
      where,
      order: { lastMessageAt: "DESC" },
      skip: (page - 1) * perPage,
      take: perPage,
    });
    return { data, total, page, perPage, totalPages: Math.max(1, Math.ceil(total / perPage)) };
  }

  async detail(ticketId: string) {
    const ticket = await this.ticketRepo.findOne({ where: { id: ticketId }, relations: ["messages"] });
    if (!ticket) throw new NotFoundException("Ticket not found.");
    ticket.messages.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    return ticket;
  }

  async adminReply(adminId: string, ticketId: string, body: string) {
    const ticket = await this.ticketRepo.findOne({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundException("Ticket not found.");
    await this.addMessage(ticket, adminId, "admin", body);
    ticket.status = "pending"; // awaiting the user
    const saved = await this.ticketRepo.save(ticket);

    // Notify the user (in-app) if it's a registered account.
    if (ticket.userId) {
      await this.notifications.create({
        userId: ticket.userId,
        type: "support_reply",
        title: "Support replied to your ticket",
        body: `Re: ${ticket.subject}`,
        linkUrl: "/support",
      });
    }
    return saved;
  }

  async setStatus(ticketId: string, status: TicketStatus) {
    const ticket = await this.ticketRepo.findOne({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundException("Ticket not found.");
    ticket.status = status;
    return this.ticketRepo.save(ticket);
  }

  private async addMessage(ticket: SupportTicketEntity, senderId: string | null, senderRole: "user" | "admin", body: string) {
    await this.messageRepo.save(this.messageRepo.create({ ticketId: ticket.id, senderId, senderRole, body }));
    ticket.lastMessageAt = new Date();
  }

  /** Resolves display name/email for a logged-in ticket opener. */
  async contactFor(userId: string): Promise<{ name: string; email: string } | null> {
    const user = await this.userRepo.findOne({ where: { id: userId }, select: { displayName: true, email: true } });
    return user ? { name: user.displayName, email: user.email } : null;
  }
}
