import {
  Controller, Get, Post, Patch, Delete, Param, Query, Body,
  UseGuards, Request,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { BlogService } from "./blog.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { AdminGuard } from "../auth/guards/admin.guard";

@ApiTags("blog")
@Controller({ path: "blog", version: "1" })
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  // ── Public ────────────────────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: "List published blog posts" })
  list(
    @Query("page") page?: string,
    @Query("perPage") perPage?: string,
    @Query("tag") tag?: string,
    @Query("search") search?: string,
  ) {
    return this.blogService.findAll(
      page ? parseInt(page, 10) : 1,
      perPage ? parseInt(perPage, 10) : 12,
      tag, search,
    );
  }

  @Get(":slug")
  @ApiOperation({ summary: "Get a single post by slug" })
  getPost(@Param("slug") slug: string) {
    return this.blogService.findBySlug(slug);
  }

  // ── Admin ─────────────────────────────────────────────────────────────────

  @Get("admin/all")
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth("JWT")
  @ApiOperation({ summary: "List all posts (admin)" })
  adminList(@Query("page") page?: string, @Query("perPage") perPage?: string) {
    return this.blogService.adminList(
      page ? parseInt(page, 10) : 1,
      perPage ? parseInt(perPage, 10) : 20,
    );
  }

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth("JWT")
  @ApiOperation({ summary: "Create blog post (admin)" })
  create(@Request() req: { user: { id: string } }, @Body() body: {
    slug: string; title: string; excerpt: string; content: string;
    coverImageUrl?: string; tags?: string[]; readTimeMinutes?: number; published?: boolean;
  }) {
    return this.blogService.create(req.user.id, body);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth("JWT")
  @ApiOperation({ summary: "Update blog post (admin)" })
  update(@Param("id") id: string, @Body() body: Partial<{
    slug: string; title: string; excerpt: string; content: string;
    coverImageUrl: string; tags: string[]; readTimeMinutes: number; published: boolean;
  }>) {
    return this.blogService.update(id, body);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth("JWT")
  @ApiOperation({ summary: "Delete blog post (admin)" })
  delete(@Param("id") id: string) {
    return this.blogService.delete(id);
  }
}
