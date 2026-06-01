import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PromoEventEntity } from "./event.entity";
import { EventsService } from "./events.service";
import { EventsController, AdminEventsController } from "./events.controller";

@Module({
  imports: [TypeOrmModule.forFeature([PromoEventEntity])],
  controllers: [EventsController, AdminEventsController],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
