import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { GameEntity } from "../games/game.entity";
import { NotificationsModule } from "../notifications/notifications.module";
import { UserEntity } from "./entities/user.entity";
import { FollowEntity } from "./entities/follow.entity";
import { FollowsController } from "./controllers/follows.controller";
import { UsersController } from "./controllers/users.controller";
import { UsersService } from "./services/users.service";
import { FollowsService } from "./services/follows.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, GameEntity, FollowEntity]),
    NotificationsModule,
  ],
  controllers: [UsersController, FollowsController],
  providers: [UsersService, FollowsService],
  exports: [UsersService, FollowsService],
})
export class UsersModule {}
