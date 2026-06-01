import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards, Version,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation, ApiProperty, ApiParam } from "@nestjs/swagger";
import {
  IsString, IsOptional, IsIn, IsBoolean, IsInt, MaxLength, IsDateString,
} from "class-validator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { AdminGuard } from "../auth/guards/admin.guard";
import { EventsService } from "./events.service";
import type { PromoEventVariant, PromoEventPlacement } from "@velonix/types";

const VARIANTS: PromoEventVariant[] = ["promo", "sale", "info", "warning"];
const PLACEMENTS: PromoEventPlacement[] = ["global", "landing", "marketplace"];

class CreateEventDto {
  @ApiProperty({ example: "Launch Sale" }) @IsString() @MaxLength(120) title!: string;
  @ApiProperty({ example: "70% off all paid games this week!" }) @IsString() @MaxLength(500) message!: string;
  @ApiProperty({ required: false, example: "Shop now" }) @IsOptional() @IsString() @MaxLength(60) ctaLabel?: string | null;
  @ApiProperty({ required: false, example: "/marketplace" }) @IsOptional() @IsString() @MaxLength(512) ctaUrl?: string | null;
  @ApiProperty({ required: false, enum: VARIANTS }) @IsOptional() @IsIn(VARIANTS) variant?: PromoEventVariant;
  @ApiProperty({ required: false, enum: PLACEMENTS }) @IsOptional() @IsIn(PLACEMENTS) placement?: PromoEventPlacement;
  @ApiProperty({ required: false }) @IsOptional() @IsBoolean() isActive?: boolean;
  @ApiProperty({ required: false }) @IsOptional() @IsBoolean() dismissible?: boolean;
  @ApiProperty({ required: false }) @IsOptional() @IsInt() priority?: number;
  @ApiProperty({ required: false }) @IsOptional() @IsDateString() startsAt?: string | null;
  @ApiProperty({ required: false }) @IsOptional() @IsDateString() endsAt?: string | null;
}

class UpdateEventDto {
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(120) title?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(500) message?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(60) ctaLabel?: string | null;
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(512) ctaUrl?: string | null;
  @ApiProperty({ required: false, enum: VARIANTS }) @IsOptional() @IsIn(VARIANTS) variant?: PromoEventVariant;
  @ApiProperty({ required: false, enum: PLACEMENTS }) @IsOptional() @IsIn(PLACEMENTS) placement?: PromoEventPlacement;
  @ApiProperty({ required: false }) @IsOptional() @IsBoolean() isActive?: boolean;
  @ApiProperty({ required: false }) @IsOptional() @IsBoolean() dismissible?: boolean;
  @ApiProperty({ required: false }) @IsOptional() @IsInt() priority?: number;
  @ApiProperty({ required: false }) @IsOptional() @IsDateString() startsAt?: string | null;
  @ApiProperty({ required: false }) @IsOptional() @IsDateString() endsAt?: string | null;
}

// ── Public ────────────────────────────────────────────────────────────────────

@ApiTags("events")
@Controller("events")
export class EventsController {
  constructor(private readonly events: EventsService) {}

  @Get("active")
  @Version("1")
  @ApiOperation({ summary: "Currently active promotional events (banners)" })
  active(@Query("placement") placement?: PromoEventPlacement) {
    return this.events.findActive(placement);
  }
}

// ── Admin ─────────────────────────────────────────────────────────────────────

@ApiTags("admin")
@Controller({ path: "admin/events", version: "1" })
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth("JWT")
export class AdminEventsController {
  constructor(private readonly events: EventsService) {}

  @Get()
  @ApiOperation({ summary: "List all promotional events" })
  list() { return this.events.findAll(); }

  @Post()
  @ApiOperation({ summary: "Create a promotional event" })
  create(@Body() dto: CreateEventDto) { return this.events.create(dto); }

  @Patch(":id")
  @ApiOperation({ summary: "Update / toggle a promotional event" })
  @ApiParam({ name: "id", format: "uuid" })
  update(@Param("id") id: string, @Body() dto: UpdateEventDto) { return this.events.update(id, dto); }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a promotional event" })
  @ApiParam({ name: "id", format: "uuid" })
  remove(@Param("id") id: string) { return this.events.remove(id); }
}
