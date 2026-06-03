import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

/**
 * Like JwtAuthGuard, but never rejects: if a valid token is present the user is
 * attached to the request; otherwise the request proceeds anonymously. Used for
 * endpoints that work for both logged-in users and guests (e.g. contact form).
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard("jwt") {
  // Swallow the "no auth" error and return whatever user (or undefined) we have.
  override handleRequest<TUser = unknown>(_err: unknown, user: TUser): TUser {
    return user;
  }
}
