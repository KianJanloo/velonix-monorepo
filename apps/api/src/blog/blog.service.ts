import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, ILike } from "typeorm";
import { BlogPostEntity } from "./blog.entity";

interface CreatePostDto {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  coverImageUrl?: string;
  tags?: string[];
  readTimeMinutes?: number;
  published?: boolean;
}

@Injectable()
export class BlogService {
  constructor(
    @InjectRepository(BlogPostEntity)
    private readonly postRepo: Repository<BlogPostEntity>,
  ) {}

  async findAll(page = 1, perPage = 12, tag?: string, search?: string, includeUnpublished = false) {
    const qb = this.postRepo.createQueryBuilder("p")
      .leftJoinAndSelect("p.author", "author")
      .orderBy("p.publishedAt", "DESC")
      .take(perPage)
      .skip((page - 1) * perPage);

    if (!includeUnpublished) qb.where("p.published = :pub", { pub: true });
    if (tag) qb.andWhere(":tag = ANY(p.tags)", { tag });
    if (search) qb.andWhere("p.title ILIKE :search", { search: `%${search}%` });

    const [posts, total] = await qb.getManyAndCount();

    return {
      data: posts.map(p => this.toSummary(p)),
      total, page, perPage, totalPages: Math.ceil(total / perPage),
    };
  }

  async findBySlug(slug: string, trackView = true) {
    const post = await this.postRepo.findOne({ where: { slug }, relations: ["author"] });
    if (!post || (!post.published)) throw new NotFoundException("Post not found.");
    if (trackView) await this.postRepo.increment({ id: post.id }, "viewCount", 1);
    return this.toDetail(post);
  }

  async create(authorId: string, dto: CreatePostDto) {
    const exists = await this.postRepo.findOne({ where: { slug: dto.slug } });
    if (exists) throw new ConflictException("A post with this slug already exists.");

    const post = this.postRepo.create({
      ...dto,
      authorId,
      publishedAt: dto.published ? new Date() : null,
      tags: dto.tags ?? [],
      readTimeMinutes: dto.readTimeMinutes ?? Math.max(1, Math.ceil((dto.content.split(" ").length) / 200)),
    });
    const saved = await this.postRepo.save(post);
    return this.toDetail(saved);
  }

  async update(id: string, dto: Partial<CreatePostDto>) {
    const post = await this.postRepo.findOne({ where: { id } });
    if (!post) throw new NotFoundException("Post not found.");

    if (dto.published && !post.published) {
      post.publishedAt = new Date();
    }

    Object.assign(post, dto);
    const saved = await this.postRepo.save(post);
    return this.toDetail(saved);
  }

  async delete(id: string) {
    const post = await this.postRepo.findOne({ where: { id } });
    if (!post) throw new NotFoundException("Post not found.");
    await this.postRepo.remove(post);
    return { message: "Post deleted." };
  }

  async adminList(page = 1, perPage = 20) {
    const [posts, total] = await this.postRepo.findAndCount({
      order: { createdAt: "DESC" },
      relations: ["author"],
      skip: (page - 1) * perPage,
      take: perPage,
    });
    return {
      data: posts.map(p => ({ ...this.toSummary(p), published: p.published, viewCount: p.viewCount })),
      total, page, perPage, totalPages: Math.ceil(total / perPage),
    };
  }

  private toSummary(p: BlogPostEntity) {
    return {
      id: p.id, slug: p.slug, title: p.title, excerpt: p.excerpt,
      coverImageUrl: p.coverImageUrl, tags: p.tags,
      readTimeMinutes: p.readTimeMinutes, viewCount: p.viewCount,
      publishedAt: p.publishedAt?.toISOString() ?? null,
      author: p.author ? { id: p.author.id, username: p.author.username, displayName: p.author.displayName } : null,
    };
  }

  private toDetail(p: BlogPostEntity) {
    return { ...this.toSummary(p), content: p.content };
  }
}
