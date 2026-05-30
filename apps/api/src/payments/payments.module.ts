import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PaymentsController } from "./payments.controller";
import { PaymentsService } from "./payments.service";
import { PurchaseEntity } from "../marketplace/purchase.entity";
import { GameEntity } from "../games/game.entity";
import { UserEntity } from "../users/user.entity";
import { SubscriptionsService } from "../subscriptions/subscriptions.service";

@Module({
  imports: [TypeOrmModule.forFeature([PurchaseEntity, GameEntity, UserEntity])],
  controllers: [PaymentsController],
  providers: [PaymentsService, SubscriptionsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
