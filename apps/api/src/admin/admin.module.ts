import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { AdminSeedService } from "./admin-seed.service";
import { UserEntity } from "../users/entities/user.entity";
import { GameEntity } from "../games/game.entity";
import { PurchaseEntity } from "../marketplace/purchase.entity";
import { AssetPurchaseEntity } from "../assets/asset-purchase.entity";
import { AssetEntity } from "../assets/asset.entity";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, GameEntity, PurchaseEntity, AssetPurchaseEntity, AssetEntity]),
    NotificationsModule,
  ],
  controllers: [AdminController],
  providers: [AdminService, AdminSeedService],
})
export class AdminModule {}
