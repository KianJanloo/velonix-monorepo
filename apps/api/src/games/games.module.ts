import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { JwtModule } from "@nestjs/jwt";
import { GamesController } from "./games.controller";
import { GamesService } from "./games.service";
import { GameEntity } from "./game.entity";
import { GameCollaboratorEntity } from "./collaborator.entity";
import { UserEntity } from "../users/entities/user.entity";
import { CollaboratorsService } from "./collaborators.service";
import { CollaboratorsController } from "./collaborators.controller";
import { StudioGateway } from "./studio.gateway";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([GameEntity, GameCollaboratorEntity, UserEntity]),
    NotificationsModule,
    JwtModule.register({}),
  ],
  controllers: [GamesController, CollaboratorsController],
  providers: [GamesService, CollaboratorsService, StudioGateway],
  exports: [GamesService, CollaboratorsService],
})
export class GamesModule {}
