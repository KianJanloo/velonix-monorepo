import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";
import { UserEntity } from "./user.entity";
import { GameEntity } from "../games/game.entity";

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, GameEntity])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
