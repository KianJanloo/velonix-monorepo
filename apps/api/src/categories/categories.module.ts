import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CategoriesController } from "./categories.controller";
import { CategoriesService } from "./categories.service";
import { CategoryEntity } from "./category.entity";
import { GameEntity } from "../games/game.entity";

@Module({
  imports: [TypeOrmModule.forFeature([CategoryEntity, GameEntity])],
  controllers: [CategoriesController],
  providers: [CategoriesService],
  exports: [CategoriesService],
})
export class CategoriesModule {}
