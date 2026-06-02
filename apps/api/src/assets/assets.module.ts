import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AssetEntity } from "./asset.entity";
import { AssetPurchaseEntity } from "./asset-purchase.entity";
import { AssetsService } from "./assets.service";
import { AssetsController } from "./assets.controller";

@Module({
  imports: [TypeOrmModule.forFeature([AssetEntity, AssetPurchaseEntity])],
  controllers: [AssetsController],
  providers: [AssetsService],
  exports: [AssetsService],
})
export class AssetsModule {}
