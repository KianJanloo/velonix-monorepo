import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Raw } from "typeorm";
import { CategoryEntity } from "./category.entity";
import { GameEntity } from "../games/game.entity";

export interface CreateCategoryDto {
  slug: string;
  label: string;
  description?: string | null;
  icon?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

export interface UpdateCategoryDto {
  label?: string;
  description?: string | null;
  icon?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(CategoryEntity)
    private readonly categoryRepo: Repository<CategoryEntity>,
    @InjectRepository(GameEntity)
    private readonly gameRepo: Repository<GameEntity>,
  ) {}

  // ── Public ────────────────────────────────────────────────────────────────

  async listPublic() {
    return this.categoryRepo.find({
      where: { isActive: true },
      order: { sortOrder: "ASC", label: "ASC" },
    });
  }

  // ── Admin ─────────────────────────────────────────────────────────────────

  async listAll(page = 1, perPage = 50) {
    const [categories, total] = await this.categoryRepo.findAndCount({
      order: { sortOrder: "ASC", label: "ASC" },
      skip: (page - 1) * perPage,
      take: perPage,
    });
    return {
      data: categories,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  async findOne(id: string): Promise<CategoryEntity> {
    const cat = await this.categoryRepo.findOne({ where: { id } });
    if (!cat) throw new NotFoundException("Category not found.");
    return cat;
  }

  async create(dto: CreateCategoryDto): Promise<CategoryEntity> {
    const existing = await this.categoryRepo.findOne({
      where: { slug: dto.slug },
    });
    if (existing)
      throw new ConflictException(`Slug "${dto.slug}" is already in use.`);

    const cat = this.categoryRepo.create({
      slug: dto.slug.toLowerCase().replace(/[^a-z0-9_]/g, "_"),
      label: dto.label,
      description: dto.description ?? null,
      icon: dto.icon ?? null,
      sortOrder: dto.sortOrder ?? 0,
      isActive: dto.isActive ?? true,
      gameCount: 0,
    });
    const saved = await this.categoryRepo.save(cat);
    await this.refreshCount(saved.slug);
    return saved;
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<CategoryEntity> {
    const cat = await this.findOne(id);
    Object.assign(cat, {
      ...(dto.label !== undefined && { label: dto.label }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.icon !== undefined && { icon: dto.icon }),
      ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
    });
    return this.categoryRepo.save(cat);
  }

  async delete(id: string) {
    const cat = await this.findOne(id);
    await this.categoryRepo.remove(cat);
    return { message: "Category deleted." };
  }

  /** Recompute the gameCount from current DB state for a given slug. */
  async refreshCount(slug: string) {
    const count = await this.gameRepo.count({
      where: { categories: Raw((alias) => `${alias} @> :slug::jsonb`, { slug: JSON.stringify([slug]) }) },
    });
    await this.categoryRepo.update({ slug }, { gameCount: count });
  }

  /** Bulk-refresh all category counts — useful after mass imports. */
  async refreshAllCounts() {
    const cats = await this.categoryRepo.find();
    await Promise.all(cats.map((c) => this.refreshCount(c.slug)));
    return { refreshed: cats.length };
  }
}
