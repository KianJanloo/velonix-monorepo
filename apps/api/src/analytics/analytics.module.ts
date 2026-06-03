import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AnalyticsController } from "./analytics.controller";
import { AnalyticsService } from "./analytics.service";
import { GameEntity } from "../games/game.entity";
import { PurchaseEntity } from "../marketplace/purchase.entity";
import { AssetEntity } from "../assets/asset.entity";
import { AssetPurchaseEntity } from "../assets/asset-purchase.entity";

@Module({
  imports: [TypeOrmModule.forFeature([GameEntity, PurchaseEntity, AssetEntity, AssetPurchaseEntity])],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
