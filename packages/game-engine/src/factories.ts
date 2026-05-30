/**
 * @velonix/game-engine — Factories
 * Pure factory functions to create default objects for new games/components.
 */

import type { GameComponent, BoardConfiguration, ComponentType } from "@velonix/types";

// ---------------------------------------------------------------------------
// GAME COMPONENT FACTORY
// ---------------------------------------------------------------------------

/**
 * Default dimensions (mm) per component type — based on standard tabletop sizes.
 */
const DEFAULT_DIMENSIONS: Record<ComponentType, { width: number; height: number }> = {
  board:    { width: 600, height: 600 },
  card:     { width: 63, height: 88 },    // Poker card
  token:    { width: 30, height: 30 },    // 30mm round token
  tile:     { width: 44, height: 44 },    // Square tile
  die:      { width: 16, height: 16 },    // Standard d6
  pawn:     { width: 20, height: 40 },    // Meeple-ish
  rulebook: { width: 210, height: 148 },  // A5 folded booklet
  custom:   { width: 50, height: 50 },
};

/**
 * Creates a blank game component with sensible defaults.
 * The `id` and `gameId` should be provided by the calling context.
 */
export function createDefaultComponent(
  type: ComponentType,
  overrides: Partial<Omit<GameComponent, "id" | "gameId" | "createdAt" | "updatedAt">> = {}
): Omit<GameComponent, "id" | "gameId"> {
  const dims = DEFAULT_DIMENSIONS[type];

  return {
    name: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
    type,
    width: dims.width,
    height: dims.height,
    quantity: type === "card" ? 52 : 1,
    layers: [
      {
        id: "background",
        name: "Background",
        type: "background",
        visible: true,
        locked: false,
        zIndex: 0,
        properties: {
          fill: "#1a2535",
          opacity: 1,
        },
      },
    ],
    thumbnailUrl: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// BOARD CONFIGURATION FACTORY
// ---------------------------------------------------------------------------

export function createDefaultBoard(
  gameId: string,
  overrides: Partial<Omit<BoardConfiguration, "id" | "gameId">> = {}
): Omit<BoardConfiguration, "id"> {
  return {
    gameId,
    width: 600,
    height: 600,
    gridType: "square",
    gridSize: 50,
    backgroundImageUrl: null,
    layers: [
      {
        id: "board-bg",
        name: "Board Background",
        type: "background",
        visible: true,
        locked: false,
        zIndex: 0,
        properties: {
          fill: "#1a2535",
        },
      },
    ],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// STARTER GAME FACTORY
// ---------------------------------------------------------------------------

/**
 * Returns the initial studio data structure for a brand-new game.
 * This is stored in GameEntity.studioData.
 */
export function createStarterGameData(gameId: string): {
  version: string;
  board: ReturnType<typeof createDefaultBoard>;
  components: Array<ReturnType<typeof createDefaultComponent>>;
} {
  return {
    version: "1.0.0",
    board: createDefaultBoard(gameId),
    components: [
      createDefaultComponent("card", {
        name: "Player Card",
        quantity: 60,
      }),
      createDefaultComponent("token", {
        name: "Resource Token",
        quantity: 30,
      }),
    ],
  };
}
