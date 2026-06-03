import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index,
} from "typeorm";

export interface BundleItem {
  assetId: string;
  authorId: string;
  /** Author's Stripe Connect account, if onboarded (null = platform keeps funds). */
  authorConnectId: string | null;
  /** The asset's list price in USD cents. */
  listUsd: number;
  /** This item's share of the discounted bundle total (USD cents). */
  allocatedUsd: number;
  platformFeeUsd: number;
  creatorEarningsUsd: number;
}

/**
 * A buyer-assembled bundle of paid component assets, checked out as one payment.
 * Because items can span multiple authors (each a separate Connect account), the
 * charge goes to the platform and earnings are paid out via separate transfers
 * once the PaymentIntent succeeds (see PaymentsService.handleBundlePaymentSucceeded).
 */
@Entity("asset_bundles")
export class AssetBundleEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ name: "buyer_id" })
  buyerId!: string;

  @Column({ name: "stripe_payment_intent_id", type: "varchar", length: 128, unique: true, nullable: true })
  stripePaymentIntentId!: string | null;

  @Column({ type: "varchar", length: 16, default: "pending" })
  status!: "pending" | "paid" | "failed";

  /** Sum of list prices before the bundle discount (USD cents). */
  @Column({ name: "subtotal_usd", type: "int" })
  subtotalUsd!: number;

  @Column({ name: "discount_usd", type: "int" })
  discountUsd!: number;

  /** Amount actually charged (subtotal − discount). */
  @Column({ name: "total_usd", type: "int" })
  totalUsd!: number;

  @Column({ type: "jsonb", default: [] })
  items!: BundleItem[];

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
