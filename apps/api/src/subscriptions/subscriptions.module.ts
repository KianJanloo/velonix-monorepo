import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SubscriptionsController } from "./subscriptions.controller";
import { SubscriptionsService } from "./subscriptions.service";
import { UserEntity } from "../users/user.entity";

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
