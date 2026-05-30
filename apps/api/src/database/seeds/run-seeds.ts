/**
 * Velonix Database Seeds
 * Run: pnpm db:seed
 *
 * Creates sample users, games, reviews, and purchases for local development.
 */

import "reflect-metadata";
import { AppDataSource } from "../data-source";
import { UserEntity } from "../../users/user.entity";
import { GameEntity } from "../../games/game.entity";
import { ReviewEntity } from "../../marketplace/review.entity";
import * as bcrypt from "bcryptjs";

async function seed() {
  await AppDataSource.initialize();
  console.log("Connected to database. Seeding...");

  const userRepo = AppDataSource.getRepository(UserEntity);
  const gameRepo = AppDataSource.getRepository(GameEntity);
  const reviewRepo = AppDataSource.getRepository(ReviewEntity);

  // ── Clear existing seed data ──────────────────────────────────────────────
  await reviewRepo.delete({});
  await gameRepo.delete({});
  await userRepo.delete({});
  console.log("Cleared existing data.");

  // ── Users ─────────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash("Password1", 12);

  const users = await userRepo.save([
    userRepo.create({
      email: "admin@velonix.gg",
      username: "velonix_admin",
      displayName: "Velonix Team",
      passwordHash,
      role: "admin",
      subscriptionTier: "studio",
      isEmailVerified: true,
      bio: "The official Velonix team account.",
    }),
    userRepo.create({
      email: "stormrider@example.com",
      username: "stormrider",
      displayName: "Storm Rider",
      passwordHash,
      role: "creator",
      subscriptionTier: "pro",
      isEmailVerified: true,
      bio: "Strategy game designer. 10+ published titles. I build games that reward clever thinking.",
      totalSales: 142,
      totalEarnings: 746_58,
    }),
    userRepo.create({
      email: "darkweave@example.com",
      username: "darkweave",
      displayName: "Dark Weave",
      passwordHash,
      role: "creator",
      subscriptionTier: "creator",
      isEmailVerified: true,
      bio: "Hidden role and deduction games are my craft.",
      totalSales: 87,
      totalEarnings: 981_13,
    }),
    userRepo.create({
      email: "aurumcraft@example.com",
      username: "aurumcraft",
      displayName: "Aurum Craft",
      passwordHash,
      role: "creator",
      subscriptionTier: "pro",
      isEmailVerified: true,
      bio: "Epic cooperative adventures. Free games for the community.",
      totalSales: 156,
      totalEarnings: 0,
    }),
    userRepo.create({
      email: "player@example.com",
      username: "boardlover",
      displayName: "Board Lover",
      passwordHash,
      role: "user",
      subscriptionTier: "free",
      isEmailVerified: true,
      bio: "Just here to play great games.",
    }),
  ]);

  const [, stormrider, darkweave, aurumcraft] = users as [
    UserEntity, UserEntity, UserEntity, UserEntity, UserEntity
  ];

  console.log(`Created ${users.length} users.`);

  // ── Games ─────────────────────────────────────────────────────────────────
  const games = await gameRepo.save([
    gameRepo.create({
      creatorId: stormrider!.id,
      title: "Verdant Conquest",
      description: `A deep strategic territory-control game set in the mythical world of Verdania.
Players command unique factions — each with asymmetric abilities — competing to dominate
six ancient provinces. Balance resource management, military expansion, and diplomatic
alliances in this Euro-style masterpiece for 2-4 players.

The board changes every game thanks to a modular tile system, ensuring no two sessions
play alike. Combat uses elegant dice-mitigation mechanics that reward careful positioning
over luck. The rulebook is fully illustrated and takes 15 minutes to learn.`,
      shortDescription: "Asymmetric territory control for 2-4 players. Six factions, modular board, zero luck.",
      category: "strategy",
      tags: ["territory-control", "asymmetric", "euro", "2-4-players", "modular"],
      playerCountMin: 2,
      playerCountMax: 4,
      playtimeMin: 60,
      playtimeMax: 120,
      complexity: "medium_heavy",
      minAge: 12,
      language: "en",
      isFree: false,
      priceUsd: 899,
      status: "published",
      publishedAt: new Date("2024-10-01"),
      totalPurchases: 142,
      totalViews: 3820,
      averageRating: 4.8,
      totalRatings: 142,
      version: "1.2.0",
      studioData: { version: "1.2.0", components: [] },
    }),
    gameRepo.create({
      creatorId: darkweave!.id,
      title: "Shadow Tribunal",
      description: `Shadow Tribunal is a hidden-role social deduction game for 4-8 players.
One player is secretly the Traitor, working to sabotage the council's decisions while
avoiding detection. The Inquisitor has one accusation per round. The Envoy can protect
one player per night. The Merchant controls resources that could tip the balance.

With 6 fully asymmetric roles and 3 distinct game phases (Discovery, Trial, Verdict),
every session tells a different story. Includes 180 Event cards and 3 board variants.`,
      shortDescription: "Hidden role deduction for 4-8 players. Asymmetric powers, three phases, one traitor.",
      category: "strategy",
      tags: ["hidden-role", "deduction", "social", "4-8-players", "asymmetric"],
      playerCountMin: 4,
      playerCountMax: 8,
      playtimeMin: 45,
      playtimeMax: 90,
      complexity: "medium",
      minAge: 14,
      language: "en",
      isFree: false,
      priceUsd: 1499,
      status: "published",
      publishedAt: new Date("2024-11-15"),
      totalPurchases: 87,
      totalViews: 2140,
      averageRating: 4.4,
      totalRatings: 87,
      version: "2.0.1",
    }),
    gameRepo.create({
      creatorId: aurumcraft!.id,
      title: "Gilded Realm",
      description: `An epic cooperative RPG board game for 1-5 players. Build your kingdom,
recruit heroes, explore dungeons, and face the Dragon Council before the final eclipse.

Gilded Realm features a full campaign mode spanning 12 connected scenarios, plus a
standalone Skirmish mode for quick sessions. Fully illustrated 60-page rulebook,
200+ illustrated cards, 40 custom tokens, and a gorgeous modular board.

This game is completely free. Forever. Created for the love of the craft.`,
      shortDescription: "Epic cooperative RPG campaign for 1-5 players. 12 scenarios. 200+ cards. Completely free.",
      category: "cooperative",
      tags: ["cooperative", "rpg", "campaign", "1-5-players", "free"],
      playerCountMin: 1,
      playerCountMax: 5,
      playtimeMin: 90,
      playtimeMax: 180,
      complexity: "heavy",
      minAge: 14,
      language: "en",
      isFree: true,
      priceUsd: null,
      status: "published",
      publishedAt: new Date("2025-01-05"),
      totalPurchases: 156,
      totalViews: 4210,
      averageRating: 4.9,
      totalRatings: 23,
      version: "1.0.0",
    }),
    gameRepo.create({
      creatorId: stormrider!.id,
      title: "Quantum Tiles",
      description: `An elegant abstract strategy game for exactly 2 players. Place hexagonal
tiles on a 9x9 grid, activate their quantum effects, and force your opponent into an
impossible position. Inspired by Go and Blokus but with a unique energy-chain mechanic.

Each tile has a quantum value (1-9) that affects adjacent tiles when placed.
Chains can cascade across the board in spectacular fashion. Learn in 5 minutes,
master in a lifetime.`,
      shortDescription: "Elegant abstract strategy for 2 players. Quantum tile chains on a 9x9 grid.",
      category: "abstract",
      tags: ["abstract", "2-player", "strategy", "tiles", "quick"],
      playerCountMin: 2,
      playerCountMax: 2,
      playtimeMin: 15,
      playtimeMax: 45,
      complexity: "light",
      minAge: 8,
      language: "en",
      isFree: false,
      priceUsd: 499,
      status: "published",
      publishedAt: new Date("2024-09-20"),
      totalPurchases: 61,
      totalViews: 1890,
      averageRating: 4.2,
      totalRatings: 61,
      version: "1.1.0",
    }),
    gameRepo.create({
      creatorId: darkweave!.id,
      title: "The Fog Between",
      description: `A cooperative horror adventure for 2-5 players. Explore a shifting Victorian
mansion before the Fog consumes you. Each room is drawn from a shuffled deck — the
mansion is never the same twice. Manage your Sanity, find the Ritual Components,
and escape before the clock reaches midnight.

Features 80 room tiles, 12 horror events, 5 unique investigators with
special abilities, and a tension track that escalates the threat as the game progresses.`,
      shortDescription: "Cooperative horror exploration for 2-5 players. Shifting mansion, Sanity system, escape before midnight.",
      category: "cooperative",
      tags: ["cooperative", "horror", "exploration", "2-5-players", "campaign"],
      playerCountMin: 2,
      playerCountMax: 5,
      playtimeMin: 60,
      playtimeMax: 120,
      complexity: "medium",
      minAge: 16,
      language: "en",
      isFree: false,
      priceUsd: 999,
      status: "published",
      publishedAt: new Date("2024-12-01"),
      totalPurchases: 115,
      totalViews: 3010,
      averageRating: 4.7,
      totalRatings: 115,
      version: "1.0.3",
    }),
    // Draft game — visible only to creator
    gameRepo.create({
      creatorId: stormrider!.id,
      title: "Iron Dominion",
      description: "Work in progress — a worker placement economic game set in a steampunk empire.",
      shortDescription: "WIP steampunk worker placement.",
      category: "worker_placement",
      tags: ["worker-placement", "steampunk", "economic"],
      playerCountMin: 2,
      playerCountMax: 4,
      playtimeMin: 90,
      playtimeMax: 150,
      complexity: "heavy",
      minAge: 14,
      language: "en",
      isFree: false,
      priceUsd: 1299,
      status: "draft",
      version: "0.3.0",
    }),
  ]);

  console.log(`Created ${games.length} games.`);

  // ── Reviews ───────────────────────────────────────────────────────────────
  const [verdantConquest, shadowTribunal, gildedRealm] = games as GameEntity[];

  await reviewRepo.save([
    reviewRepo.create({
      gameId: verdantConquest!.id,
      authorId: darkweave!.id,
      rating: 5,
      title: "Best strategy game on the platform",
      body: "The asymmetric factions are perfectly balanced. My group has played 20+ sessions and we're still discovering new strategies. The modular board keeps things fresh every game. Highly recommended.",
      isVerifiedPurchase: true,
      helpful: 34,
    }),
    reviewRepo.create({
      gameId: verdantConquest!.id,
      authorId: aurumcraft!.id,
      rating: 5,
      title: "Elegant design, deep gameplay",
      body: "Storm Rider has a gift for making complex systems feel intuitive. The rulebook alone is a masterpiece of clarity. Bought this on day one and have not regretted it.",
      isVerifiedPurchase: true,
      helpful: 28,
    }),
    reviewRepo.create({
      gameId: shadowTribunal!.id,
      authorId: stormrider!.id,
      rating: 4,
      title: "Excellent hidden-role game with some rough edges",
      body: "The three-phase structure is genius — it adds tension that most hidden-role games lack. The Traitor mechanics are well designed. Docking one star because the rulebook for the Envoy role is a bit ambiguous on edge cases.",
      isVerifiedPurchase: true,
      helpful: 19,
    }),
    reviewRepo.create({
      gameId: gildedRealm!.id,
      authorId: stormrider!.id,
      rating: 5,
      title: "Unbelievable that this is free",
      body: "This is professional-quality design released for free. The campaign system is better than many paid games. Aurum Craft deserves every donation and follow you can give.",
      isVerifiedPurchase: false,
      helpful: 52,
    }),
  ]);

  console.log("Created reviews.");
  console.log("\nSeed complete. Test credentials:");
  console.log("  Admin:    admin@velonix.gg     / Password1");
  console.log("  Creator:  stormrider@example.com / Password1");
  console.log("  Player:   player@example.com    / Password1");

  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
