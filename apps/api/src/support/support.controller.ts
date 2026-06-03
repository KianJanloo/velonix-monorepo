import {
  Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Req, Version,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation, ApiProperty } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import {
  IsString, IsEmail, IsIn, IsOptional, MaxLength, MinLength,
} from "class-validator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { OptionalJwtAuthGuard } from "../auth/guards/optional-jwt-auth.guard";
import { AdminGuard } from "../auth/guards/admin.guard";
import { SupportService } from "./support.service";
import type { TicketCategory, TicketStatus } from "./support-ticket.entity";

const CATEGORIES = ["general", "billing", "technical", "report", "feature"] as const;
const STATUSES = ["open", "pending", "resolved"] as const;

class CreateTicketDto {
  @ApiProperty() @IsString() @MaxLength(200) @MinLength(3) subject!: string;
  @ApiProperty() @IsString() @MaxLength(5000) @MinLength(5) body!: string;
  @ApiProperty({ enum: CATEGORIES, required: false }) @IsOptional() @IsIn(CATEGORIES) category?: TicketCategory;
  // Guests must supply contact details; ignored for authenticated users.
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(120) name?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsEmail() @MaxLength(255) email?: string;
}

class ReplyDto {
  @ApiProperty() @IsString() @MaxLength(5000) @MinLength(1) body!: string;
}

class StatusDto {
  @ApiProperty({ enum: STATUSES }) @IsIn(STATUSES) status!: TicketStatus;
}

@ApiTags("support")
@Controller({ path: "support", version: "1" })
export class SupportController {
  constructor(private readonly support: SupportService) {}

  // ── Public / user ──────────────────────────────────────────────────────────

  @Post("tickets")
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: "Open a support ticket (works logged-in or as a guest)" })
  async create(@Body() dto: CreateTicketDto, @Req() req: { user?: { id: string } }) {
    const userId = req.user?.id ?? null;
    let name = dto.name ?? "Guest";
    let email = dto.email ?? "";
    if (userId) {
      const contact = await this.support.contactFor(userId);
      if (contact) { name = contact.name; email = contact.email; }
    }
    return this.support.createTicket({
      userId, name, email,
      subject: dto.subject,
      category: dto.category ?? "general",
      body: dto.body,
    });
  }

  @Get("tickets/mine")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT")
  @ApiOperation({ summary: "My support tickets with full threads" })
  mine(@Req() req: { user: { id: string } }) {
    return this.support.myTickets(req.user.id);
  }

  @Post("tickets/:id/reply")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT")
  @ApiOperation({ summary: "Reply to my own ticket" })
  reply(@Param("id") id: string, @Body() dto: ReplyDto, @Req() req: { user: { id: string } }) {
    return this.support.userReply(req.user.id, id, dto.body);
  }

  // ── Admin ────────────────────────────────────────────────────────────────────

  @Get("admin/tickets")
  @Version("1")
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth("JWT")
  @ApiOperation({ summary: "List all support tickets (admin)" })
  adminList(
    @Query("status") status?: TicketStatus,
    @Query("page") page?: string,
    @Query("perPage") perPage?: string,
  ) {
    const valid = status && STATUSES.includes(status) ? status : undefined;
    return this.support.list(valid, page ? parseInt(page, 10) : 1, perPage ? parseInt(perPage, 10) : 20);
  }

  @Get("admin/tickets/:id")
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth("JWT")
  @ApiOperation({ summary: "Ticket detail + thread (admin)" })
  adminDetail(@Param("id") id: string) {
    return this.support.detail(id);
  }

  @Post("admin/tickets/:id/reply")
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth("JWT")
  @ApiOperation({ summary: "Reply to a ticket as support (admin)" })
  adminReply(@Param("id") id: string, @Body() dto: ReplyDto, @Req() req: { user: { id: string } }) {
    return this.support.adminReply(req.user.id, id, dto.body);
  }

  @Patch("admin/tickets/:id/status")
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth("JWT")
  @ApiOperation({ summary: "Change ticket status (admin)" })
  adminStatus(@Param("id") id: string, @Body() dto: StatusDto) {
    return this.support.setStatus(id, dto.status);
  }
}
