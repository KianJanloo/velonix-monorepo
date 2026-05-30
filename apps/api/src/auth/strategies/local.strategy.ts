import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-local";
import { AuthService } from "../auth.service";

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({ usernameField: "email" });
  }

  async validate(email: string, password: string) {
    try {
      const result = await this.authService.login({ email, password, rememberMe: false });
      return result.user;
    } catch {
      throw new UnauthorizedException("Invalid credentials");
    }
  }
}
