import {
  Controller, Post, Body, Param, UseGuards,
  Request, Version, Headers, RawBodyRequest, Req
} from "@nestjs/common";
import type { Request as ExpressRequest } from "express";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
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
  connectOnboard(@Request() req: { user: { id: string } }) {
    return this.paymentsService.createConnectOnboardingLink(req.user.id);
  }

  /**
   * Stripe webhook endpoint.
   * Must be registered BEFORE the global ValidationPipe so the raw body
   * is preserved for signature verification.
   * In Next.js API or production, point your Stripe dashboard to:
   *   POST https://api.velonix.gg/api/v1/payments/webhook
   */
  @Post("webhook")
  @Version("1")
  @ApiOperation({ summary: "Stripe webhook receiver (internal)" })
  handleWebhook(
    @Req() req: RawBodyRequest<ExpressRequest>,
    @Headers("stripe-signature") signature: string
  ) {
    const rawBody = req.rawBody ?? Buffer.from("");
    return this.paymentsService.handleWebhook(rawBody, signature);
  }
}
