import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PaymentsController } from "./payments.controller";
import { PaymentsService } from "./payments.service";
import { PurchaseEntity } from "../marketplace/purchase.entity";
import { GameEntity } from "../games/game.entity";
import { UserEntity } from "../users/entities/user.entity";
import { AssetEntity } from "../assets/asset.entity";
import { AssetPurchaseEntity } from "../assets/asset-purchase.entity";
import { AssetBundleEntity } from "./asset-bundle.entity";
import { SubscriptionsService } from "../subscriptions/subscriptions.service";

@Module({
  imports: [TypeOrmModule.forFeature([PurchaseEntity, GameEntity, UserEntity, AssetEntity, AssetPurchaseEntity, AssetBundleEntity])],
  controllers: [PaymentsController],
  providers: [PaymentsService, SubscriptionsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
