/**
 * User Entity — TypeORM
 * apps/api/src/users/user.entity.ts
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
  BeforeInsert,
  BeforeUpdate,
} from "typeorm";
import * as bcrypt from "bcryptjs";
import type { UserRole, SubscriptionTier } from "@velonix/types";

@Entity("users")
export class UserEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index({ unique: true })
  @Column({ length: 255 })
  email!: string;

  @Index({ unique: true })
  @Column({ length: 32 })
  username!: string;

  @Column({ name: "display_name", length: 64 })
  displayName!: string;

  /** Never select this by default — password is excluded via @Column select: false */
  @Column({ name: "password_hash", select: false })
  passwordHash!: string;

  @Column({ name: "avatar_url", length: 512, nullable: true })
  avatarUrl!: string | null;

  @Column({ type: "text", nullable: true })
  bio!: string | null;

  @Column({ type: "varchar", default: "user" })
  role!: UserRole;

  @Column({
    name: "subscription_tier",
    type: "varchar",
    default: "free",
  })
  subscriptionTier!: SubscriptionTier;

  @Column({ name: "subscription_expires_at", type: "timestamptz", nullable: true })
  subscriptionExpiresAt!: Date | null;

  @Column({ name: "stripe_customer_id", length: 64, nullable: true })
  stripeCustomerId!: string | null;

  @Column({ name: "stripe_connect_account_id", length: 64, nullable: true })
  stripeConnectAccountId!: string | null;

  @Column({ name: "is_email_verified", default: false })
  isEmailVerified!: boolean;

  @Column({ name: "email_verification_token", length: 128, nullable: true, select: false })
  emailVerificationToken!: string | null;

  @Column({ name: "password_reset_token", length: 128, nullable: true, select: false })
  passwordResetToken!: string | null;

  @Column({ name: "password_reset_expires_at", type: "timestamptz", nullable: true, select: false })
  passwordResetExpiresAt!: Date | null;

  @Column({ name: "refresh_token_hash", length: 255, nullable: true, select: false })
  refreshTokenHash!: string | null;

  /** Total earnings in cents (USD) */
  @Column({ name: "total_earnings", type: "bigint", default: 0 })
  totalEarnings!: number;

  @Column({ name: "total_sales", type: "int", default: 0 })
  totalSales!: number;

  @Column({ name: "last_login_at", type: "timestamptz", nullable: true })
  lastLoginAt!: Date | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  // ---------------------------------------------------------------------------
  // HOOKS
  // ---------------------------------------------------------------------------

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword(): Promise<void> {
    // Only hash if the passwordHash field was explicitly set to a plain value
    // This is managed by the auth service — not called automatically here
  }

  // ---------------------------------------------------------------------------
  // INSTANCE METHODS
  // ---------------------------------------------------------------------------

  async verifyPassword(plaintext: string): Promise<boolean> {
    return bcrypt.compare(plaintext, this.passwordHash);
  }

  isSubscriptionActive(): boolean {
    if (this.subscriptionTier === "free") return true;
    if (!this.subscriptionExpiresAt) return false;
    return this.subscriptionExpiresAt > new Date();
  }

  /**
   * Returns a safe public representation of the user.
   * Never include passwordHash, tokens, etc.
   */
  toPublicProfile() {
    return {
      id: this.id,
      username: this.username,
      displayName: this.displayName,
      avatarUrl: this.avatarUrl,
      bio: this.bio,
      subscriptionTier: this.subscriptionTier,
      totalSales: this.totalSales,
      createdAt: this.createdAt.toISOString(),
    };
  }
}
