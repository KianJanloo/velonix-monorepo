import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SupportController } from "./support.controller";
import { SupportService } from "./support.service";
import { SupportTicketEntity } from "./support-ticket.entity";
import { SupportMessageEntity } from "./support-message.entity";
import { UserEntity } from "../users/user.entity";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([SupportTicketEntity, SupportMessageEntity, UserEntity]),
    NotificationsModule,
  ],
  controllers: [SupportController],
  providers: [SupportService],
})
export class SupportModule {}
