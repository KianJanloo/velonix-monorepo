import { Controller, Get, Patch, Body, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation, ApiProperty } from "@nestjs/swagger";
import {
  IsOptional, IsBoolean, IsString, IsEmail, MaxLength, ValidateIf, Matches,
} from "class-validator";
import { SettingsService } from "./settings.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { AdminGuard } from "../auth/guards/admin.guard";

class UpdateSettingsDto {
  @ApiProperty({ required: false }) @IsOptional() @IsBoolean() signupsEnabled?: boolean;
  @ApiProperty({ required: false }) @IsOptional() @IsBoolean() marketplaceEnabled?: boolean;
  @ApiProperty({ required: false }) @IsOptional() @IsBoolean() maintenanceMode?: boolean;
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(500) maintenanceMessage?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(500) announcement?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(255) siteName?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(1000) siteDescription?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(512) logoUrl?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(512) faviconUrl?: string;
  @ApiProperty({ required: false }) @IsOptional() @ValidateIf((_, v) => v !== "") @IsEmail() @MaxLength(255) supportEmail?: string;
  @ApiProperty({ required: false }) @IsOptional() @ValidateIf((_, v) => v !== "") @IsEmail() @MaxLength(255) contactEmail?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(50) phone?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(500) address?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(512) discordUrl?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(512) twitterUrl?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(512) facebookUrl?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(512) instagramUrl?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(512) youtubeUrl?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(512) githubUrl?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(512) linkedinUrl?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(500) metaDescription?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(500) metaKeywords?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() @Matches(/^#[0-9a-fA-F]{6}$/) primaryColor?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() @Matches(/^#[0-9a-fA-F]{6}$/) accentColor?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(500) footerText?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(5000) aboutContent?: string;
}

@ApiTags("settings")
@Controller({ path: "settings", version: "1" })
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @ApiOperation({ summary: "Public site settings (banner, social links, flags)" })
  getPublic() {
    return this.settingsService.getPublic();
  }

  @Get("admin")
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth("JWT")
  @ApiOperation({ summary: "Full site settings (admin only)" })
  getAll() {
    return this.settingsService.get();
  }

  @Patch()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth("JWT")
  @ApiOperation({ summary: "Update site settings (admin only)" })
  update(@Body() patch: UpdateSettingsDto) {
    return this.settingsService.update(patch);
  }
}
