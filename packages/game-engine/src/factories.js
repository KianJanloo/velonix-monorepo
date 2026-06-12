"use strict";
/**
 * @velonix/game-engine — Factories
 * Pure factory functions to create default objects for new games/components.
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDefaultComponent = createDefaultComponent;
exports.createDefaultBoard = createDefaultBoard;
exports.createStarterGameData = createStarterGameData;
// ---------------------------------------------------------------------------
// GAME COMPONENT FACTORY
// ---------------------------------------------------------------------------
/**
 * Default dimensions (mm) per component type — based on standard tabletop sizes.
 */
var DEFAULT_DIMENSIONS = {
    board: { width: 600, height: 600 },
    card: { width: 63, height: 88 }, // Poker card
    token: { width: 30, height: 30 }, // 30mm round token
    tile: { width: 44, height: 44 }, // Square tile
    die: { width: 16, height: 16 }, // Standard d6
    pawn: { width: 20, height: 40 }, // Meeple-ish
    rulebook: { width: 210, height: 148 }, // A5 folded booklet
    custom: { width: 50, height: 50 },
};
/**
 * Creates a blank game component with sensible defaults.
 * The `id` and `gameId` should be provided by the calling context.
 */
function createDefaultComponent(type, overrides) {
    if (overrides === void 0) { overrides = {}; }
    var dims = DEFAULT_DIMENSIONS[type];
    return __assign({ name: "New ".concat(type.charAt(0).toUpperCase() + type.slice(1)), type: type, width: dims.width, height: dims.height, quantity: type === "card" ? 52 : 1, layers: [
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
        ], thumbnailUrl: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, overrides);
}
// ---------------------------------------------------------------------------
// BOARD CONFIGURATION FACTORY
// ---------------------------------------------------------------------------
function createDefaultBoard(gameId, overrides) {
    if (overrides === void 0) { overrides = {}; }
    return __assign({ gameId: gameId, width: 600, height: 600, gridType: "square", gridSize: 50, backgroundImageUrl: null, layers: [
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
        ] }, overrides);
}
// ---------------------------------------------------------------------------
// STARTER GAME FACTORY
// ---------------------------------------------------------------------------
/**
 * Returns the initial studio data structure for a brand-new game.
 * This is stored in GameEntity.studioData.
 */
function createStarterGameData(gameId) {
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
