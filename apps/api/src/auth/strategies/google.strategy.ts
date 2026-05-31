import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ConfigService } from "@nestjs/config";
import { Strategy, type VerifyCallback } from "passport-google-oauth20";
import type { GoogleProfile } from "../auth.service";

/** Subset of the Google profile fields we consume. */
interface GoogleRawProfile {
  id: string;
  displayName?: string;
  emails?: { value: string }[];
  photos?: { value: string }[];
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, "google") {
  constructor(config: ConfigService) {
    super({
      // Fall back to placeholders so the app still boots when Google isn't configured.
      // The /auth/google route guards against this via oauth.google.enabled.
      clientID: config.get<string>("oauth.google.clientId") || "not-configured",
      clientSecret: config.get<string>("oauth.google.clientSecret") || "not-configured",
      callbackURL: config.get<string>("oauth.google.callbackUrl") || "http://localhost:3001/api/v1/auth/google/callback",
      scope: ["email", "profile"],
    });
  }

  validate(_accessToken: string, _refreshToken: string, rawProfile: GoogleRawProfile, done: VerifyCallback): void {
    const email = rawProfile.emails?.[0]?.value;
    if (!email) {
      done(new Error("Google account has no email."), undefined);
      return;
    }
    const user: GoogleProfile = {
      email,
      displayName: rawProfile.displayName || email.split("@")[0]!,
      avatarUrl: rawProfile.photos?.[0]?.value,
      googleId: rawProfile.id,
    };
    done(null, user);
  }
}
