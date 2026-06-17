import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne,
  JoinColumn, CreateDateColumn, Index,
} from "typeorm";
import { UserEntity } from "../users/entities/user.entity";
import { AssetEntity } from "./asset.entity";

/** A creator's ownership of a marketplace asset (free acquisition or paid purchase). */
@Entity("asset_purchases")
@Index(["buyerId", "assetId"], { unique: true })
export class AssetPurchaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ name: "buyer_id" })
  buyerId!: string;

  @ManyToOne(() => UserEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "buyer_id" })
  buyer!: UserEntity;

  @Column({ name: "asset_id" })
  assetId!: string;

  @ManyToOne(() => AssetEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "asset_id" })
  asset!: AssetEntity;

  /** USD cents paid (0 for free acquisitions). */
  @Column({ name: "amount_paid_usd", type: "int", default: 0 })
  amountPaidUsd!: number;

  @Column({ name: "platform_fee_usd", type: "int", default: 0 })
  platformFeeUsd!: number;

  @Column({ name: "creator_earnings_usd", type: "int", default: 0 })
  creatorEarningsUsd!: number;

  @Column({ name: "stripe_payment_intent_id", type: "varchar", length: 128, nullable: true })
  stripePaymentIntentId!: string | null;

  /** ISO 3166-1 alpha-2 country of the buyer's payment method (for regional sales). */
  @Column({ name: "country", type: "varchar", length: 2, nullable: true })
  country!: string | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
