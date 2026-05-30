import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { GamesController } from "./games.controller";
import { GamesService } from "./games.service";
import { GameEntity } from "./game.entity";
import { UserEntity } from "../users/user.entity";

@Module({
  imports: [TypeOrmModule.forFeature([GameEntity, UserEntity])],
  controllers: [GamesController],
  providers: [GamesService],
  exports: [GamesService],
})
export class GamesModule {}
