import {
  Controller, Get, Post, Body, UseGuards, Request, Version
} from "@nestjs/common";
import {
  ApiTags, ApiBearerAuth, ApiOperation,
  ApiBody, ApiResponse, ApiProperty,
} from "@nestjs/swagger";
import { SubscriptionsService } from "./subscriptions.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { z } from "zod";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";

const CreateCheckoutSchema = z.object({
  tier: z.enum(["creator", "pro", "studio"]),
  interval: z.enum(["monthly", "yearly"]).default("monthly"),
});

// ── Swagger DTO shapes ────────────────────────────────────────────────────────

class CreateCheckoutBodyDto {
  @ApiProperty({ enum: ["creator", "pro", "studio"], example: "pro" })
  tier!: "creator" | "pro" | "studio";

  @ApiProperty({ enum: ["monthly", "yearly"], default: "monthly", example: "monthly" })
  interval!: "monthly" | "yearly";
}

class TierDto {
  @ApiProperty() id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() monthlyPriceUsd!: number;
  @ApiProperty() yearlyPriceUsd!: number;
  @ApiProperty({ type: [String] }) features!: string[];
  @ApiProperty() commissionRate!: number;
}

// ── Controller ────────────────────────────────────────────────────────────────

@ApiTags("subscriptions")
@Controller("subscriptions")
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get("tiers")
  @Version("1")
  @ApiOperation({ summary: "Get all subscription tier details and pricing" })
  @ApiResponse({ status: 200, description: "Available subscription tiers", type: [TierDto] })
  getTiers() {
    return this.subscriptionsService.getTiers();
  }

  @Post("checkout")
  @Version("1")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT")
  @ApiOperation({ summary: "Create Stripe Checkout session for subscription upgrade" })
  @ApiBody({ type: CreateCheckoutBodyDto })
  @ApiResponse({ status: 201, description: "Stripe Checkout session URL", schema: { example: { url: "https://checkout.stripe.com/pay/cs_xxx" } } })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  createCheckout(
    @Request() req: { user: { id: string } },
    @Body(new ZodValidationPipe(CreateCheckoutSchema))
    dto: { tier: "creator" | "pro" | "studio"; interval: "monthly" | "yearly" }
  ) {
    return this.subscriptionsService.createCheckoutSession(req.user.id, dto.tier, dto.interval);
  }

  @Post("portal")
  @Version("1")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT")
  @ApiOperation({ summary: "Create Stripe Billing Portal session" })
  @ApiResponse({ status: 201, description: "Stripe Billing Portal session URL", schema: { example: { url: "https://billing.stripe.com/session/xxx" } } })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  createPortal(@Request() req: { user: { id: string } }) {
    return this.subscriptionsService.createPortalSession(req.user.id);
  }

  @Post("cancel")
  @Version("1")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT")
  @ApiOperation({ summary: "Cancel current subscription (downgrade to free)" })
  @ApiResponse({ status: 201, description: "Subscription cancelled" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  cancel(@Request() req: { user: { id: string } }) {
    return this.subscriptionsService.cancelSubscription(req.user.id);
  }
}
