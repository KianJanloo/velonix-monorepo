import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { GamesController } from "./games.controller";
import { GamesService } from "./games.service";
import { GameEntity } from "./game.entity";

@Module({
  imports: [TypeOrmModule.forFeature([GameEntity])],
  controllers: [GamesController],
  providers: [GamesService],
  exports: [GamesService],
})
export class GamesModule {}
