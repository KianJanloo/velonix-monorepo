import {
  Controller, Post, Body, Param, UseGuards,
  Request, Version, Headers, RawBodyRequest, Req
} from "@nestjs/common";
import type { Request as ExpressRequest } from "express";
import {
  ApiTags, ApiBearerAuth, ApiOperation,
  ApiParam, ApiResponse, ApiHeader,
} from "@nestjs/swagger";
import { PaymentsService } from "./payments.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@ApiTags("payments")
@Controller("payments")
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post("game/:gameId/intent")
  @Version("1")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT")
  @ApiOperation({ summary: "Create a PaymentIntent for purchasing a game" })
  @ApiParam({ name: "gameId", format: "uuid", description: "ID of the game to purchase" })
  @ApiResponse({ status: 201, description: "PaymentIntent client secret returned", schema: { example: { clientSecret: "pi_xxx_secret_yyy" } } })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Game not found" })
  @ApiResponse({ status: 409, description: "Game already purchased" })
  createPurchaseIntent(
    @Param("gameId") gameId: string,
    @Request() req: { user: { id: string } }
  ) {
    return this.paymentsService.createGamePurchaseIntent(req.user.id, gameId);
  }

  @Post("connect/onboard")
  @Version("1")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT")
  @ApiOperation({ summary: "Start Stripe Connect onboarding for a creator" })
  @ApiResponse({ status: 201, description: "Stripe Connect onboarding URL", schema: { example: { url: "https://connect.stripe.com/setup/..." } } })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  connectOnboard(@Request() req: { user: { id: string } }) {
    return this.paymentsService.createConnectOnboardingLink(req.user.id);
  }

  /**
   * Stripe webhook endpoint.
   * Must be registered BEFORE the global ValidationPipe so the raw body
   * is preserved for signature verification.
   * Point your Stripe dashboard to: POST /api/v1/payments/webhook
   */
  @Post("webhook")
  @Version("1")
  @ApiOperation({ summary: "Stripe webhook receiver (internal — do not call manually)" })
  @ApiHeader({ name: "stripe-signature", required: true, description: "Stripe webhook signature" })
  @ApiResponse({ status: 200, description: "Webhook processed" })
  @ApiResponse({ status: 400, description: "Invalid signature or unrecognised event" })
  handleWebhook(
    @Req() req: RawBodyRequest<ExpressRequest>,
    @Headers("stripe-signature") signature: string
  ) {
    const rawBody = req.rawBody ?? Buffer.from("");
    return this.paymentsService.handleWebhook(rawBody, signature);
  }
}
