import {
  Controller, Get, Post, Body, UseGuards, Request, Version
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { SubscriptionsService } from "./subscriptions.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { z } from "zod";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";

const CreateCheckoutSchema = z.object({
  tier: z.enum(["creator", "pro", "studio"]),
  interval: z.enum(["monthly", "yearly"]).default("monthly"),
});

@ApiTags("subscriptions")
@Controller("subscriptions")
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get("tiers")
  @Version("1")
  @ApiOperation({ summary: "Get all subscription tier details and pricing" })
  getTiers() {
    return this.subscriptionsService.getTiers();
  }

  @Post("checkout")
  @Version("1")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT")
  @ApiOperation({ summary: "Create Stripe Checkout session for subscription upgrade" })
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
  createPortal(@Request() req: { user: { id: string } }) {
    return this.subscriptionsService.createPortalSession(req.user.id);
  }

  @Post("cancel")
  @Version("1")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT")
  @ApiOperation({ summary: "Cancel current subscription (downgrade to free)" })
  cancel(@Request() req: { user: { id: string } }) {
    return this.subscriptionsService.cancelSubscription(req.user.id);
  }
}
