import {
  Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn, Unique,
} from "typeorm";

/** A directed "follower follows following" social-graph edge. */
@Entity("follows")
@Unique(["followerId", "followingId"])
@Index(["followingId"])
@Index(["followerId"])
export class FollowEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "follower_id" })
  followerId!: string;

  @Column({ name: "following_id" })
  followingId!: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}
