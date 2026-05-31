import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { UserEntity } from "../users/user.entity";
import { GameEntity } from "../games/game.entity";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, GameEntity]), NotificationsModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
