import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn,
  CreateDateColumn, UpdateDateColumn, Index,
} from "typeorm";
import { UserEntity } from "../users/user.entity";

@Entity("blog_posts")
export class BlogPostEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index({ unique: true })
  @Column({ length: 200 })
  slug!: string;

  @Column({ length: 200 })
  title!: string;

  @Column({ type: "text" })
  excerpt!: string;

  @Column({ type: "text" })
  content!: string;

  @Column({ name: "cover_image_url", type: "varchar", length: 512, nullable: true })
  coverImageUrl!: string | null;

  @Column({ type: "jsonb", default: [] })
  tags!: string[];

  @Column({ name: "read_time_minutes", type: "int", default: 5 })
  readTimeMinutes!: number;

  @Column({ default: false })
  published!: boolean;

  @Column({ name: "published_at", type: "timestamptz", nullable: true })
  publishedAt!: Date | null;

  @Column({ name: "author_id" })
  authorId!: string;

  @ManyToOne(() => UserEntity, { onDelete: "SET NULL", nullable: true })
  @JoinColumn({ name: "author_id" })
  author!: UserEntity;

  @Column({ name: "view_count", type: "int", default: 0 })
  viewCount!: number;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
