import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { AuthService } from "../auth.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly authService: AuthService,
    config: ConfigService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>("jwt.accessSecret") ?? "fallback",
    });
  }

  async validate(payload: { sub: string }) {
    const user = await this.authService.validateJwtPayload(payload);
    if (!user) throw new UnauthorizedException();
    return user;
  }
}
