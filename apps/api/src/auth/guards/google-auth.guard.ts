import { Injectable, ExecutionContext, ServiceUnavailableException } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class GoogleAuthGuard extends AuthGuard("google") {
  constructor(private readonly config: ConfigService) {
    super();
  }

  override canActivate(context: ExecutionContext) {
    if (!this.config.get<boolean>("oauth.google.enabled")) {
      throw new ServiceUnavailableException(
        "Google sign-in is not configured on this server."
      );
    }
    return super.canActivate(context);
  }
}
