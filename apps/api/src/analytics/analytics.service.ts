import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { GameEntity } from "../games/game.entity";
import { PurchaseEntity } from "../marketplace/purchase.entity";
import { AssetEntity } from "../assets/asset.entity";
import { AssetPurchaseEntity } from "../assets/asset-purchase.entity";

const DAY_MS = 86_400_000;
const SERIES_DAYS = 90;
const isoDay = (d: Date) => d.toISOString().slice(0, 10);

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(GameEntity) private readonly gameRepo: Repository<GameEntity>,
    @InjectRepository(PurchaseEntity) private readonly purchaseRepo: Repository<PurchaseEntity>,
    @InjectRepository(AssetEntity) private readonly assetRepo: Repository<AssetEntity>,
    @InjectRepository(AssetPurchaseEntity) private readonly assetPurchaseRepo: Repository<AssetPurchaseEntity>,
  ) {}

  /** Aggregated, creator-scoped sales analytics over the creator's own games + components. */
  async creatorOverview(userId: string) {
    const [games, assets] = await Promise.all([
      this.gameRepo.find({ where: { creatorId: userId }, select: { id: true, title: true, totalPurchases: true } }),
      this.assetRepo.find({ where: { authorId: userId }, select: { id: true, title: true, totalPurchases: true } }),
    ]);
    const gameIds = games.map((g) => g.id);
    const assetIds = assets.map((a) => a.id);

    const [gamePurchases, assetPurchases] = await Promise.all([
      gameIds.length ? this.purchaseRepo.find({ where: { gameId: In(gameIds) } }) : Promise.resolve([]),
      assetIds.length ? this.assetPurchaseRepo.find({ where: { assetId: In(assetIds) } }) : Promise.resolve([]),
    ]);

    // Normalise both purchase kinds into one stream (skip free asset acquisitions).
    type Row = { refId: string; earnings: number; amount: number; buyerId: string; country: string | null; createdAt: Date };
    const rows: Row[] = [
      ...gamePurchases.map((p) => ({ refId: p.gameId, earnings: p.creatorEarningsUsd, amount: p.amountPaidUsd, buyerId: p.buyerId, country: p.country, createdAt: p.createdAt })),
      ...assetPurchases.filter((p) => p.amountPaidUsd > 0).map((p) => ({ refId: p.assetId, earnings: p.creatorEarningsUsd, amount: p.amountPaidUsd, buyerId: p.buyerId, country: p.country, createdAt: p.createdAt })),
    ];

    // KPI totals.
    const totalRevenue = rows.reduce((s, r) => s + r.earnings, 0);
    const totalSales = rows.length;
    const uniqueBuyers = new Set(rows.map((r) => r.buyerId)).size;
    const cutoff = Date.now() - 30 * DAY_MS;
    const revenue30d = rows.filter((r) => r.createdAt.getTime() >= cutoff).reduce((s, r) => s + r.earnings, 0);

    // 90-day daily revenue/sales series (zero-filled).
    const byDay = new Map<string, { revenue: number; sales: number }>();
    for (let i = SERIES_DAYS - 1; i >= 0; i--) byDay.set(isoDay(new Date(Date.now() - i * DAY_MS)), { revenue: 0, sales: 0 });
    for (const r of rows) {
      const k = isoDay(r.createdAt);
      const cell = byDay.get(k);
      if (cell) { cell.revenue += r.earnings; cell.sales += 1; }
    }
    const series = [...byDay.entries()].map(([date, v]) => ({ date, ...v }));

    // Revenue per item.
    const sumByRef = (refId: string) => rows.filter((r) => r.refId === refId).reduce((s, r) => s + r.earnings, 0);
    const topGames = games
      .map((g) => ({ id: g.id, title: g.title, sales: g.totalPurchases, revenue: sumByRef(g.id) }))
      .sort((a, b) => b.revenue - a.revenue || b.sales - a.sales)
      .slice(0, 8);
    const topComponents = assets
      .map((a) => ({ id: a.id, title: a.title, sales: a.totalPurchases, revenue: sumByRef(a.id) }))
      .sort((a, b) => b.revenue - a.revenue || b.sales - a.sales)
      .slice(0, 8);

    // Regional breakdown.
    const countryMap = new Map<string, { revenue: number; sales: number }>();
    for (const r of rows) {
      const key = r.country ?? "??";
      const cell = countryMap.get(key) ?? { revenue: 0, sales: 0 };
      cell.revenue += r.earnings; cell.sales += 1;
      countryMap.set(key, cell);
    }
    const byCountry = [...countryMap.entries()]
      .map(([country, v]) => ({ country, ...v }))
      .sort((a, b) => b.revenue - a.revenue);

    return {
      totals: { totalRevenue, revenue30d, totalSales, uniqueBuyers, gameCount: games.length, componentCount: assets.length },
      series,
      topGames,
      topComponents,
      byCountry,
    };
  }
}
