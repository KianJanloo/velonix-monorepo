import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne,
  JoinColumn, CreateDateColumn, Index
} from "typeorm";
import { UserEntity } from "../users/entities/user.entity";
import { GameEntity } from "../games/game.entity";

@Entity("purchases")
@Index(["buyerId", "gameId"], { unique: true }) // Can only buy once
@Index(["gameId", "createdAt"])
export class PurchaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ name: "buyer_id" })
  buyerId!: string;

  @ManyToOne(() => UserEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "buyer_id" })
  buyer!: UserEntity;

  @Column({ name: "game_id" })
  gameId!: string;

  @ManyToOne(() => GameEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "game_id" })
  game!: GameEntity;

  /** Amount paid in USD cents */
  @Column({ name: "amount_paid_usd", type: "int" })
  amountPaidUsd!: number;

  /** Velonix platform fee in USD cents */
  @Column({ name: "platform_fee_usd", type: "int" })
  platformFeeUsd!: number;

  /** Creator net earnings in USD cents */
  @Column({ name: "creator_earnings_usd", type: "int" })
  creatorEarningsUsd!: number;

  @Column({ name: "stripe_payment_intent_id", length: 128 })
  stripePaymentIntentId!: string;

  /** ISO 3166-1 alpha-2 country of the buyer's payment method (for regional sales). */
  @Column({ name: "country", type: "varchar", length: 2, nullable: true })
  country!: string | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
