import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { NotificationEntity, type NotificationType } from "./notification.entity";

interface CreateNotification {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  linkUrl?: string;
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(NotificationEntity)
    private readonly repo: Repository<NotificationEntity>,
  ) {}

  /** Internal — called by other services to emit a notification. */
  async create(dto: CreateNotification) {
    const n = this.repo.create({ ...dto, linkUrl: dto.linkUrl ?? null });
    return this.repo.save(n);
  }

  async list(userId: string, page = 1, perPage = 20) {
    const [data, total] = await this.repo.findAndCount({
      where: { userId },
      order: { createdAt: "DESC" },
      take: perPage,
      skip: (page - 1) * perPage,
    });
    const unread = await this.repo.count({ where: { userId, isRead: false } });
    return { data, total, unread, page, perPage, totalPages: Math.ceil(total / perPage) };
  }

  async unreadCount(userId: string) {
    const unread = await this.repo.count({ where: { userId, isRead: false } });
    return { unread };
  }

  async markRead(userId: string, id: string) {
    const n = await this.repo.findOne({ where: { id } });
    if (!n) throw new NotFoundException("Notification not found.");
    if (n.userId !== userId) throw new ForbiddenException();
    n.isRead = true;
    return this.repo.save(n);
  }

  async markAllRead(userId: string) {
    await this.repo.update({ userId, isRead: false }, { isRead: true });
    return { message: "All notifications marked as read." };
  }

  async remove(userId: string, id: string) {
    const n = await this.repo.findOne({ where: { id } });
    if (!n) throw new NotFoundException("Notification not found.");
    if (n.userId !== userId) throw new ForbiddenException();
    await this.repo.remove(n);
    return { message: "Deleted." };
  }
}
