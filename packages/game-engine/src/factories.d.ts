/**
 * @velonix/game-engine — Factories
 * Pure factory functions to create default objects for new games/components.
 */
import type { GameComponent, BoardConfiguration, ComponentType } from "@velonix/types";
/**
 * Creates a blank game component with sensible defaults.
 * The `id` and `gameId` should be provided by the calling context.
 */
export declare function createDefaultComponent(type: ComponentType, overrides?: Partial<Omit<GameComponent, "id" | "gameId" | "createdAt" | "updatedAt">>): Omit<GameComponent, "id" | "gameId">;
export declare function createDefaultBoard(gameId: string, overrides?: Partial<Omit<BoardConfiguration, "id" | "gameId">>): Omit<BoardConfiguration, "id">;
/**
 * Returns the initial studio data structure for a brand-new game.
 * This is stored in GameEntity.studioData.
 */
export declare function createStarterGameData(gameId: string): {
    version: string;
    board: ReturnType<typeof createDefaultBoard>;
    components: Array<ReturnType<typeof createDefaultComponent>>;
};
//# sourceMappingURL=factories.d.ts.map