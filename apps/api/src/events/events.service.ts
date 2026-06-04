import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, IsNull, LessThanOrEqual, MoreThanOrEqual } from "typeorm";
import { PromoEventEntity } from "./event.entity";
import type { PromoEventPlacement } from "@velonix/types/src";

export interface UpsertEventDto {
  title: string;
  message: string;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  variant?: PromoEventEntity["variant"];
  placement?: PromoEventPlacement;
  isActive?: boolean;
  dismissible?: boolean;
  priority?: number;
  startsAt?: string | null;
  endsAt?: string | null;
}

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(PromoEventEntity)
    private readonly repo: Repository<PromoEventEntity>,
  ) {}

  /** Public — currently-live events (active + within schedule window). */
  async findActive(placement?: PromoEventPlacement) {
    const now = new Date();
    // Schedule bounds: NULL means "no bound". Query both null and in-window rows.
    const events = await this.repo.find({
      where: [
        { isActive: true, startsAt: IsNull(), endsAt: IsNull() },
        { isActive: true, startsAt: LessThanOrEqual(now), endsAt: IsNull() },
        { isActive: true, startsAt: IsNull(), endsAt: MoreThanOrEqual(now) },
        { isActive: true, startsAt: LessThanOrEqual(now), endsAt: MoreThanOrEqual(now) },
      ],
      order: { priority: "DESC", createdAt: "DESC" },
    });
    return events.filter((e) =>
      e.placement === "global" || !placement || e.placement === placement
    );
  }

  /** Admin — everything, newest first. */
  findAll() {
    return this.repo.find({ order: { priority: "DESC", createdAt: "DESC" } });
  }

  async findOne(id: string) {
    const event = await this.repo.findOne({ where: { id } });
    if (!event) throw new NotFoundException("Event not found.");
    return event;
  }

  create(dto: UpsertEventDto) {
    const event = this.repo.create({
      ...dto,
      startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
      endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
    });
    return this.repo.save(event);
  }

  async update(id: string, dto: Partial<UpsertEventDto>) {
    const event = await this.findOne(id);
    Object.assign(event, dto);
    if (dto.startsAt !== undefined) event.startsAt = dto.startsAt ? new Date(dto.startsAt) : null;
    if (dto.endsAt !== undefined) event.endsAt = dto.endsAt ? new Date(dto.endsAt) : null;
    return this.repo.save(event);
  }

  async remove(id: string) {
    const event = await this.findOne(id);
    await this.repo.remove(event);
    return { removed: true };
  }
}
