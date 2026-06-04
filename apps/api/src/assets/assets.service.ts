import {
  Injectable, NotFoundException, ForbiddenException, BadRequestException, ConflictException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, FindOptionsWhere, ILike, In } from "typeorm";
import { AssetEntity } from "./asset.entity";
import { AssetPurchaseEntity } from "./asset-purchase.entity";
import type { AssetKind } from "@velonix/types/src";
import { ASSET_KINDS } from "@velonix/types/src";

export interface BrowseAssetsQuery {
  kind?: AssetKind;
  search?: string;
  isFree?: boolean;
  sort?: "newest" | "popular" | "price_asc" | "price_desc";
  page?: number;
  perPage?: number;
}

export interface CreateAssetDto {
  title: string;
  description?: string;
  kind?: AssetKind;
  thumbnailUrl?: string | null;
  payload: unknown[];
  isFree?: boolean;
  priceUsd?: number | null;
}

@Injectable()
export class AssetsService {
  constructor(
    @InjectRepository(AssetEntity) private readonly assetRepo: Repository<AssetEntity>,
    @InjectRepository(AssetPurchaseEntity) private readonly purchaseRepo: Repository<AssetPurchaseEntity>,
  ) {}

  // ── Ownership ────────────────────────────────────────────────────────────
  async owns(userId: string, assetId: string): Promise<boolean> {
    if (!userId) return false;
    const p = await this.purchaseRepo.findOne({ where: { buyerId: userId, assetId } });
    return !!p;
  }

  private async ownedIds(userId: string, assetIds: string[]): Promise<Set<string>> {
    if (!userId || assetIds.length === 0) return new Set();
    const rows = await this.purchaseRepo.find({ where: { buyerId: userId, assetId: In(assetIds) }, select: ["assetId"] });
    return new Set(rows.map(r => r.assetId));
  }

  // ── Browse / detail ───────────────────────────────────────────────────────
  async browse(query: BrowseAssetsQuery, userId?: string) {
    const page = Math.max(1, query.page ?? 1);
    const perPage = Math.min(48, Math.max(1, query.perPage ?? 24));

    const where: FindOptionsWhere<AssetEntity> = { isPublished: true };
    if (query.kind) where.kind = query.kind;
    if (typeof query.isFree === "boolean") where.isFree = query.isFree;
    if (query.search) where.title = ILike(`%${query.search}%`);

    const orderMap: Record<string, object> = {
      newest: { createdAt: "DESC" },
      popular: { totalPurchases: "DESC" },
      price_asc: { priceUsd: "ASC" },
      price_desc: { priceUsd: "DESC" },
    };

    const [rows, total] = await this.assetRepo.findAndCount({
      where,
      order: orderMap[query.sort ?? "newest"] ?? { createdAt: "DESC" },
      take: perPage,
      skip: (page - 1) * perPage,
      relations: ["author"],
    });

    const owned = userId ? await this.ownedIds(userId, rows.map(r => r.id)) : new Set<string>();
    return {
      data: rows.map(r => r.toSummary(userId ? (owned.has(r.id) || r.authorId === userId) : undefined)),
      total, page, perPage,
      totalPages: Math.ceil(total / perPage),
      hasNextPage: page * perPage < total,
      hasPreviousPage: page > 1,
    };
  }

  /** Returns full asset (with payload) only if free/owned/author; otherwise summary. */
  async findOne(id: string, userId?: string) {
    const asset = await this.assetRepo.findOne({ where: { id }, relations: ["author"] });
    if (!asset) throw new NotFoundException("Asset not found.");
    const isAuthor = !!userId && asset.authorId === userId;
    const owned = isAuthor || asset.isFree || (!!userId && await this.owns(userId, id));
    return owned ? asset.toFull(owned) : asset.toSummary(false);
  }

  async findMine(authorId: string) {
    const rows = await this.assetRepo.find({ where: { authorId }, relations: ["author"], order: { updatedAt: "DESC" } });
    return rows.map(r => r.toFull(true));
  }

  /** Assets the user owns/acquired (incl. payload, for inserting into the studio). */
  async library(userId: string) {
    const purchases = await this.purchaseRepo.find({
      where: { buyerId: userId },
      relations: ["asset", "asset.author"],
      order: { createdAt: "DESC" },
    });
    return purchases.filter(p => p.asset).map(p => p.asset.toFull(true));
  }

  // ── Authoring ───────────────────────────────────────────────────────────
  async create(authorId: string, dto: CreateAssetDto) {
    if (!dto.title?.trim()) throw new BadRequestException("A title is required.");
    if (!Array.isArray(dto.payload) || dto.payload.length === 0)
      throw new BadRequestException("Select at least one component to publish.");

    const isFree = dto.isFree ?? true;
    const kind: AssetKind = ASSET_KINDS.includes(dto.kind as AssetKind) ? dto.kind! : "other";

    const asset = this.assetRepo.create({
      authorId,
      title: dto.title.trim(),
      description: dto.description?.trim() ?? "",
      kind,
      thumbnailUrl: dto.thumbnailUrl ?? null,
      payload: dto.payload,
      componentCount: dto.payload.length,
      isFree,
      priceUsd: isFree ? null : Math.max(99, Math.round(dto.priceUsd ?? 0)),
      isPublished: true,
    });
    const saved = await this.assetRepo.save(asset);
    // Author implicitly owns their own asset.
    return (await this.assetRepo.findOne({ where: { id: saved.id }, relations: ["author"] }))!.toFull(true);
  }

  async update(id: string, authorId: string, dto: Partial<CreateAssetDto> & { isPublished?: boolean }) {
    const asset = await this.assetRepo.findOne({ where: { id } });
    if (!asset) throw new NotFoundException("Asset not found.");
    if (asset.authorId !== authorId) throw new ForbiddenException("You don't own this asset.");

    if (dto.title !== undefined) asset.title = dto.title.trim();
    if (dto.description !== undefined) asset.description = dto.description.trim();
    if (dto.kind !== undefined && ASSET_KINDS.includes(dto.kind)) asset.kind = dto.kind;
    if (dto.thumbnailUrl !== undefined) asset.thumbnailUrl = dto.thumbnailUrl;
    if (dto.isPublished !== undefined) asset.isPublished = dto.isPublished;
    if (dto.isFree !== undefined) {
      asset.isFree = dto.isFree;
      asset.priceUsd = dto.isFree ? null : Math.max(99, Math.round(dto.priceUsd ?? asset.priceUsd ?? 99));
    } else if (dto.priceUsd !== undefined && !asset.isFree) {
      asset.priceUsd = Math.max(99, Math.round(dto.priceUsd ?? 99));
    }
    await this.assetRepo.save(asset);
    return (await this.assetRepo.findOne({ where: { id }, relations: ["author"] }))!.toFull(true);
  }

  async remove(id: string, authorId: string) {
    const asset = await this.assetRepo.findOne({ where: { id } });
    if (!asset) throw new NotFoundException("Asset not found.");
    if (asset.authorId !== authorId) throw new ForbiddenException("You don't own this asset.");
    await this.assetRepo.remove(asset);
    return { removed: true };
  }

  // ── Acquisition ───────────────────────────────────────────────────────────
  /** Acquire a FREE asset (paid assets go through the payments/Stripe flow). */
  async acquireFree(userId: string, assetId: string) {
    const asset = await this.assetRepo.findOne({ where: { id: assetId }, relations: ["author"] });
    if (!asset) throw new NotFoundException("Asset not found.");
    if (!asset.isFree) throw new BadRequestException("This asset is paid — purchase it instead.");
    if (asset.authorId === userId) return asset.toFull(true);

    const existing = await this.purchaseRepo.findOne({ where: { buyerId: userId, assetId } });
    if (!existing) {
      await this.purchaseRepo.save(this.purchaseRepo.create({ buyerId: userId, assetId, amountPaidUsd: 0 }));
      await this.assetRepo.increment({ id: assetId }, "totalPurchases", 1);
    }
    return asset.toFull(true);
  }
}
