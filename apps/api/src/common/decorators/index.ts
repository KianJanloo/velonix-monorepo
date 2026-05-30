import { createParamDecorator, ExecutionContext, SetMetadata } from "@nestjs/common";
import type { UserEntity } from "../../users/user.entity";

/**
 * Extracts the authenticated user from the request.
 * Requires JwtAuthGuard to be active on the route.
 *
 * @example
 * @Get("me")
 * @UseGuards(JwtAuthGuard)
 * getMe(@CurrentUser() user: UserEntity) { ... }
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UserEntity => {
    const request = ctx.switchToHttp().getRequest<{ user: UserEntity }>();
    return request.user;
  }
);

/**
 * Marks a route as public — bypasses the global JwtAuthGuard
 * if one is configured globally.
 *
 * @example
 * @Public()
 * @Get("featured")
 * getFeatured() { ... }
 */
export const IS_PUBLIC_KEY = "isPublic";
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/**
 * Requires the user to have a specific subscription tier or higher.
 * Use in combination with a SubscriptionGuard (implement separately).
 */
export const REQUIRED_TIER_KEY = "requiredTier";
export const RequiresTier = (tier: string) => SetMetadata(REQUIRED_TIER_KEY, tier);
