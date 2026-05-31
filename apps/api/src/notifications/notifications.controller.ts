import {
  Controller, Get, Patch, Delete, Param, Query, UseGuards, Request, Version,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { NotificationsService } from "./notifications.service";

@ApiTags("notifications")
@Controller({ path: "notifications", version: "1" })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth("JWT")
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: "List the current user's notifications" })
  list(
    @Request() req: { user: { id: string } },
    @Query("page") page?: string,
    @Query("perPage") perPage?: string,
  ) {
    return this.service.list(req.user.id, page ? parseInt(page, 10) : 1, perPage ? parseInt(perPage, 10) : 20);
  }

  @Get("unread-count")
  @ApiOperation({ summary: "Unread notification count" })
  unread(@Request() req: { user: { id: string } }) {
    return this.service.unreadCount(req.user.id);
  }

  @Patch("read-all")
  @ApiOperation({ summary: "Mark all notifications as read" })
  readAll(@Request() req: { user: { id: string } }) {
    return this.service.markAllRead(req.user.id);
  }

  @Patch(":id/read")
  @ApiOperation({ summary: "Mark a notification as read" })
  read(@Request() req: { user: { id: string } }, @Param("id") id: string) {
    return this.service.markRead(req.user.id, id);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a notification" })
  remove(@Request() req: { user: { id: string } }, @Param("id") id: string) {
    return this.service.remove(req.user.id, id);
  }
}
