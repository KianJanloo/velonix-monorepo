import { Controller, Get, Patch, Param, Body, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiProperty } from "@nestjs/swagger";
import {
  IsOptional, IsString, IsInt, IsBoolean, IsArray, Min, MaxLength,
} from "class-validator";
import { PlansService } from "./plans.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { AdminGuard } from "../auth/guards/admin.guard";

// Validation decorators are mandatory — the global ValidationPipe (whitelist:true)
// strips any property without one.
class UpdatePlanDto {
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(64) name?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(500) description?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsInt() @Min(0) priceMonthly?: number;
  @ApiProperty({ required: false }) @IsOptional() @IsInt() @Min(0) priceYearly?: number;
  @ApiProperty({ required: false }) @IsOptional() @IsInt() @Min(0) commissionRate?: number;
  @ApiProperty({ required: false, nullable: true }) @IsOptional() @IsInt() maxProjects?: number | null;
  @ApiProperty({ required: false }) @IsOptional() @IsBoolean() has3DPreview?: boolean;
  @ApiProperty({ required: false }) @IsOptional() @IsBoolean() hasAnalytics?: boolean;
  @ApiProperty({ required: false }) @IsOptional() @IsBoolean() hasRuleEngine?: boolean;
  @ApiProperty({ required: false }) @IsOptional() @IsBoolean() hasPrioritySupport?: boolean;
  @ApiProperty({ required: false, type: [String] }) @IsOptional() @IsArray() @IsString({ each: true }) features?: string[];
  @ApiProperty({ required: false }) @IsOptional() @IsInt() sortOrder?: number;
}

@ApiTags("plans")
@Controller({ path: "plans", version: "1" })
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Get()
  @ApiOperation({ summary: "List all subscription plans (public)" })
  list() {
    return this.plansService.findAll();
  }

  @Patch(":tier")
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth("JWT")
  @ApiOperation({ summary: "Update a plan's pricing/access (admin only)" })
  update(@Param("tier") tier: string, @Body() patch: UpdatePlanDto) {
    return this.plansService.update(tier, patch);
  }
}
