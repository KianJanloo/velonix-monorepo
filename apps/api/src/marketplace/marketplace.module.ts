import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MarketplaceController } from "./marketplace.controller";
import { MarketplaceService } from "./marketplace.service";
import { GameEntity } from "../games/game.entity";
import { ReviewEntity } from "./review.entity";
import { PurchaseEntity } from "./purchase.entity";

@Module({
  imports: [TypeOrmModule.forFeature([GameEntity, ReviewEntity, PurchaseEntity])],
  controllers: [MarketplaceController],
  providers: [MarketplaceService],
  exports: [MarketplaceService],
})
export class MarketplaceModule {}
