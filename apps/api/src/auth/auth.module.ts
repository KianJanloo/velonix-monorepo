import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { LocalStrategy } from "./strategies/local.strategy";
import { GoogleStrategy } from "./strategies/google.strategy";
import { UserEntity } from "../users/entities/user.entity";
import { SettingsModule } from "../settings/settings.module";
import { MailModule } from "../mail/mail.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
    SettingsModule,
    PassportModule,
    MailModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>("jwt.accessSecret") ?? "CHANGE_ME_IN_PRODUCTION",
        signOptions: { expiresIn: config.get<string>("jwt.accessExpiresIn") ?? "15m" },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, LocalStrategy, GoogleStrategy],
  exports: [AuthService],
})
export class AuthModule {}
