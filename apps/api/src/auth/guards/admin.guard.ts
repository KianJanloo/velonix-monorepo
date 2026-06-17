import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from "@nestjs/common";
import type { UserEntity } from "../../users/entities/user.entity";

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<{ user?: UserEntity }>();
    if (!req.user || req.user.role !== "admin") {
      throw new ForbiddenException("Admin access required.");
    }
    return true;
  }
}
