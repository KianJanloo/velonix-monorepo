import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PlansController } from "./plans.controller";
import { PlansService } from "./plans.service";
import { PlanConfigEntity } from "./plan.entity";

@Module({
  imports: [TypeOrmModule.forFeature([PlanConfigEntity])],
  controllers: [PlansController],
  providers: [PlansService],
  exports: [PlansService],
})
export class PlansModule {}
