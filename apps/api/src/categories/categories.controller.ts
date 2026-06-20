import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
} from "@nestjs/common";
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiProperty,
  ApiBody,
  ApiParam,
  ApiQuery,
} from "@nestjs/swagger";
import {
  IsString,
  IsBoolean,
  IsNumber,
  IsOptional,
  MaxLength,
  MinLength,
  Min,
  IsIn,
} from "class-validator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { AdminGuard } from "../auth/guards/admin.guard";
import { CategoriesService } from "./categories.service";

// ── DTOs ─────────────────────────────────────────────────────────────────────

class CreateCategoryDto {
  @ApiProperty({ example: "deck_building" })
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  slug!: string;

  @ApiProperty({ example: "Deck Building" })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  label!: string;

  @ApiProperty({
    required: false,
    example: "Games centred on constructing a card deck.",
  })
  @IsOptional()
  @IsString()
  @MaxLength(280)
  description?: string | null;

  @ApiProperty({ required: false, example: "🃏" })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  icon?: string | null;

  @ApiProperty({ required: false, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  sortOrder?: number;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

class UpdateCategoryDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  label?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(280)
  description?: string | null;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  icon?: string | null;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  sortOrder?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// ── Controller ────────────────────────────────────────────────────────────────

@ApiTags("categories")
@Controller({ path: "categories", version: "1" })
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  /** Public — used by marketplace filter dropdowns. */
  @Get()
  @ApiOperation({ summary: "List active categories (public)" })
  listPublic() {
    return this.categoriesService.listPublic();
  }

  // ── Admin endpoints ────────────────────────────────────────────────────────

  @Get("admin/all")
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth("JWT")
  @ApiOperation({ summary: "List all categories incl. inactive (admin)" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "perPage", required: false, type: Number })
  listAll(
    @Query("page") page?: string,
    @Query("perPage") perPage?: string,
  ) {
    return this.categoriesService.listAll(
      page ? parseInt(page, 10) : 1,
      perPage ? parseInt(perPage, 10) : 50,
    );
  }

  @Post("admin")
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth("JWT")
  @ApiOperation({ summary: "Create a category (admin)" })
  @ApiBody({ type: CreateCategoryDto })
  create(@Body() body: CreateCategoryDto) {
    return this.categoriesService.create(body);
  }

  @Patch("admin/:id")
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth("JWT")
  @ApiOperation({ summary: "Update a category (admin)" })
  @ApiParam({ name: "id", format: "uuid" })
  @ApiBody({ type: UpdateCategoryDto })
  update(@Param("id") id: string, @Body() body: UpdateCategoryDto) {
    return this.categoriesService.update(id, body);
  }

  @Delete("admin/:id")
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth("JWT")
  @ApiOperation({ summary: "Delete a category (admin)" })
  @ApiParam({ name: "id", format: "uuid" })
  @HttpCode(200)
  delete(@Param("id") id: string) {
    return this.categoriesService.delete(id);
  }

  @Post("admin/refresh-counts")
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth("JWT")
  @ApiOperation({ summary: "Recompute all game counts (admin)" })
  refreshCounts() {
    return this.categoriesService.refreshAllCounts();
  }
}
