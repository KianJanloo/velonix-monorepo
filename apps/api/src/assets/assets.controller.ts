import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, UseGuards, Request, Version, HttpCode, HttpStatus,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam } from "@nestjs/swagger";
import {
  IsString, IsOptional, IsIn, IsBoolean, IsInt, IsArray, MaxLength, Min,
} from "class-validator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { AssetsService } from "./assets.service";
import type { AssetKind } from "@velonix/types/src";
import { ASSET_KINDS } from "@velonix/types/src";

class CreateAssetBody {
  @IsString() @MaxLength(120) title!: string;
  @IsOptional() @IsString() @MaxLength(2000) description?: string;
  @IsOptional() @IsIn(ASSET_KINDS) kind?: AssetKind;
  @IsOptional() @IsString() @MaxLength(512) thumbnailUrl?: string | null;
  @IsArray() payload!: unknown[];
  @IsOptional() @IsBoolean() isFree?: boolean;
  @IsOptional() @IsInt() @Min(0) priceUsd?: number | null;
}

class UpdateAssetBody {
  @IsOptional() @IsString() @MaxLength(120) title?: string;
  @IsOptional() @IsString() @MaxLength(2000) description?: string;
  @IsOptional() @IsIn(ASSET_KINDS) kind?: AssetKind;
  @IsOptional() @IsString() @MaxLength(512) thumbnailUrl?: string | null;
  @IsOptional() @IsBoolean() isFree?: boolean;
  @IsOptional() @IsInt() @Min(0) priceUsd?: number | null;
  @IsOptional() @IsBoolean() isPublished?: boolean;
}

@ApiTags("assets")
@Controller("assets")
export class AssetsController {
  constructor(private readonly assets: AssetsService) {}

  @Get()
  @Version("1")
  @ApiOperation({ summary: "Browse the component marketplace" })
  browse(
    @Query("kind") kind?: AssetKind,
    @Query("search") search?: string,
    @Query("isFree") isFree?: string,
    @Query("sort") sort?: "newest" | "popular" | "price_asc" | "price_desc",
    @Query("page") page?: string,
    @Query("perPage") perPage?: string,
  ) {
    return this.assets.browse({
      kind, search, sort,
      isFree: isFree === undefined ? undefined : isFree === "true",
      page: page ? parseInt(page, 10) : 1,
      perPage: perPage ? parseInt(perPage, 10) : 24,
    });
  }

  @Get("mine")
  @Version("1")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT")
  @ApiOperation({ summary: "Assets I have authored" })
  mine(@Request() req: { user: { id: string } }) {
    return this.assets.findMine(req.user.id);
  }

  @Get("library")
  @Version("1")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT")
  @ApiOperation({ summary: "Assets I own / have acquired (with component payload)" })
  library(@Request() req: { user: { id: string } }) {
    return this.assets.library(req.user.id);
  }

  @Get(":id")
  @Version("1")
  @ApiOperation({ summary: "Get an asset (component payload only if free/owned/author)" })
  @ApiParam({ name: "id", format: "uuid" })
  findOne(@Param("id") id: string) {
    return this.assets.findOne(id);
  }

  @Post()
  @Version("1")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT")
  @ApiOperation({ summary: "Publish a reusable component asset to the marketplace" })
  create(@Request() req: { user: { id: string } }, @Body() dto: CreateAssetBody) {
    return this.assets.create(req.user.id, dto);
  }

  @Patch(":id")
  @Version("1")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT")
  @ApiOperation({ summary: "Update an asset I authored" })
  @ApiParam({ name: "id", format: "uuid" })
  update(@Param("id") id: string, @Request() req: { user: { id: string } }, @Body() dto: UpdateAssetBody) {
    return this.assets.update(id, req.user.id, dto);
  }

  @Delete(":id")
  @Version("1")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Delete an asset I authored" })
  @ApiParam({ name: "id", format: "uuid" })
  remove(@Param("id") id: string, @Request() req: { user: { id: string } }) {
    return this.assets.remove(id, req.user.id);
  }

  @Post(":id/acquire")
  @Version("1")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Acquire a free asset into my library" })
  @ApiParam({ name: "id", format: "uuid" })
  acquire(@Param("id") id: string, @Request() req: { user: { id: string } }) {
    return this.assets.acquireFree(req.user.id, id);
  }
}
