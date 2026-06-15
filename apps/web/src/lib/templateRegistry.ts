/**
 * Studio template registry — curated starter kits that designers can remix.
 * Each template provides a ready-to-run set of CanvasComp objects + GameRules
 * that merges into the active page on apply.
 */

import type { CanvasComp, GameRule } from "@/components/templates/studio/core";

export interface StudioTemplate {
  id: string;
  name: string;
  description: string;
  category:
    | "strategy"
    | "party"
    | "deck-building"
    | "cooperative"
    | "abstract"
    | "adventure";
  playerCount: string;
  estimatedTime: string;
  tags: string[];
  /** Emoji icon shown on the card */
  icon: string;
  /** Accent colour for the card */
  color: string;
  components: Omit<CanvasComp, "id">[];
  rules: Omit<GameRule, "id">[];
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const C = (
  type: CanvasComp["type"],
  name: string,
  x: number,
  y: number,
  opts: Partial<CanvasComp> = {},
): Omit<CanvasComp, "id"> => ({
  type,
  name,
  x,
  y,
  width: opts.width ?? 30,
  height: opts.height ?? 30,
  rotation: 0,
  fill: opts.fill ?? "#1a2535",
  stroke: opts.stroke ?? "#f5c451",
  strokeWidth: opts.strokeWidth ?? 1,
  opacity: 100,
  visible: true,
  locked: false,
  quantity: opts.quantity ?? 1,
  cornerRadius: opts.cornerRadius ?? 4,
  text: opts.text!,
  fontSize: opts.fontSize!,
  textColor: opts.textColor!,
  innerColor: opts.innerColor!,
  segments: opts.segments!,
  customLabel: opts.customLabel!,
});

const R = (
  trigger: GameRule["trigger"],
  description: string,
  action: GameRule["action"],
  params: GameRule["params"] = {},
): Omit<GameRule, "id"> => ({
  trigger,
  description,
  action: action!,
  params,
  priority: 50,
  conditions: [],
  actions: [],
  enabled: true,
});

// ── Registry ──────────────────────────────────────────────────────────────────

export const TEMPLATE_REGISTRY: StudioTemplate[] = [
  // ── 1. Classic Roll & Move ─────────────────────────────────────────────────
  {
    id: "roll-and-move",
    name: "Roll & Move",
    description:
      "The classic family board game template. A track, four player pawns, one die, and a finish line. Everything you need to get rolling immediately.",
    category: "party",
    playerCount: "2–4",
    estimatedTime: "20–45 min",
    tags: ["classic", "family", "dice", "track"],
    icon: "🎲",
    color: "#f5c451",
    components: [
      // Board
      C("board", "Main Board", 10, 10, {
        width: 400,
        height: 300,
        fill: "#0f1a2e",
        stroke: "#f5c451",
        strokeWidth: 2,
      }),
      // Track
      C("track", "Score Track", 20, 260, {
        width: 380,
        height: 24,
        fill: "#1a2535",
        stroke: "#f5c451",
        innerColor: "#3ddc97",
        segments: 20,
      }),
      // Die
      C("die", "Main Die", 190, 140, {
        width: 36,
        height: 36,
        fill: "#e8d5b8",
        stroke: "#2a1f12",
        innerColor: "#2a1f12",
      }),
      // 4 pawns
      C("pawn", "Red Pawn", 20, 220, {
        width: 18,
        height: 28,
        fill: "#ff3b5c",
        stroke: "#0a0a0a",
      }),
      C("pawn", "Blue Pawn", 50, 220, {
        width: 18,
        height: 28,
        fill: "#22d3ee",
        stroke: "#0a0a0a",
      }),
      C("pawn", "Green Pawn", 80, 220, {
        width: 18,
        height: 28,
        fill: "#3ddc97",
        stroke: "#0a0a0a",
      }),
      C("pawn", "Yellow Pawn", 110, 220, {
        width: 18,
        height: 28,
        fill: "#f5c451",
        stroke: "#0a0a0a",
      }),
      // Title
      C("text", "Game Title", 160, 20, {
        width: 100,
        height: 20,
        text: "Roll & Move",
        fontSize: 16,
        textColor: "#f5c451",
      }),
    ],
    rules: [
      R(
        "turn_start",
        "Roll the die to determine movement spaces",
        "roll_dice",
        { amount: 6, target: "current" },
      ),
      R("turn_start", "Current player moves their pawn", "move_spaces", {
        amount: 1,
        target: "current",
      }),
      R("game_end", "First player to reach space 20 wins", "end_game", {
        value: "a player reaches space 20",
      }),
    ],
  },

  // ── 2. Deck Builder ────────────────────────────────────────────────────────
  {
    id: "deck-builder",
    name: "Deck Builder",
    description:
      "Start with a thin starter deck, buy cards from a shared market row, build an engine. Core deck-building loop with market, hand, and discard mechanics.",
    category: "deck-building",
    playerCount: "2–4",
    estimatedTime: "45–90 min",
    tags: ["cards", "engine", "market", "hand"],
    icon: "🃏",
    color: "#7c5cff",
    components: [
      // Play area / board
      C("board", "Play Area", 5, 5, {
        width: 440,
        height: 320,
        fill: "#0d1520",
        stroke: "#7c5cff",
        strokeWidth: 2,
      }),
      // Market row label
      C("text", "Market", 15, 15, {
        width: 60,
        height: 14,
        text: "MARKET",
        fontSize: 10,
        textColor: "#f5c451",
      }),
      // Market cards (6 slots)
      ...Array.from({ length: 6 }, (_, i) =>
        C("card", `Market Card ${i + 1}`, 15 + i * 68, 32, {
          width: 63,
          height: 88,
          fill: "#1a2535",
          stroke: "#7c5cff",
        }),
      ),
      // Deck zones
      C("deck", "Main Deck", 15, 140, {
        width: 55,
        height: 80,
        fill: "#3a2a1f",
        stroke: "#f5c451",
      }),
      C("deck", "Discard Pile", 80, 140, {
        width: 55,
        height: 80,
        fill: "#1a1f2e",
        stroke: "#3ddc97",
      }),
      // Hand zone label
      C("text", "Hand Zone", 155, 140, {
        width: 60,
        height: 14,
        text: "HAND",
        fontSize: 10,
        textColor: "#a78bff",
      }),
      // Hand cards (5 slots)
      ...Array.from({ length: 5 }, (_, i) =>
        C("card", `Hand Slot ${i + 1}`, 155 + i * 52, 158, {
          width: 48,
          height: 68,
          fill: "#1c1a2e",
          stroke: "#7c5cff",
          strokeWidth: 1,
        }),
      ),
      // Score tokens for each player
      C("token", "P1 Score", 380, 240, {
        width: 28,
        height: 28,
        fill: "#ff3b5c",
        stroke: "#0a0a0a",
      }),
      C("token", "P2 Score", 410, 240, {
        width: 28,
        height: 28,
        fill: "#22d3ee",
        stroke: "#0a0a0a",
      }),
      // VP pile
      C("coin", "VP Tokens", 380, 145, {
        width: 40,
        height: 40,
        fill: "#f5c451",
        stroke: "#2a1f12",
        quantity: 30,
      }),
    ],
    rules: [
      R("turn_start", "Draw 5 cards to your hand at turn start", "draw_cards", {
        amount: 5,
        target: "current",
      }),
      R(
        "turn_end",
        "Discard hand and draw 5 new cards at turn end",
        "draw_cards",
        { amount: 5, target: "current" },
      ),
      R("card_played", "Gain 1 VP when playing a card", "gain_points", {
        amount: 1,
        target: "current",
      }),
      R("game_end", "Game ends when the VP pile is exhausted", "end_game", {
        value: "VP pile is empty",
      }),
    ],
  },

  // ── 3. Worker Placement ────────────────────────────────────────────────────
  {
    id: "worker-placement",
    name: "Worker Placement",
    description:
      "Place your meeples on action spaces to gather resources, build structures, and score points. Classic euro-game engine with blocking mechanics.",
    category: "strategy",
    playerCount: "2–5",
    estimatedTime: "60–120 min",
    tags: ["euro", "meeple", "resources", "blocking"],
    icon: "🏗️",
    color: "#3ddc97",
    components: [
      C("board", "Main Board", 5, 5, {
        width: 450,
        height: 330,
        fill: "#0e1a0f",
        stroke: "#3ddc97",
        strokeWidth: 2,
      }),
      // Action spaces
      ...["Forest", "Quarry", "Farm", "Market", "Workshop", "Council"].map(
        (name, i) =>
          C(
            "tile",
            `${name} Action`,
            15 + (i % 3) * 140,
            25 + Math.floor(i / 3) * 90,
            {
              width: 120,
              height: 72,
              fill: "#0f1f10",
              stroke: "#3ddc97",
            },
          ),
      ),
      // Action space labels
      ...["Forest", "Quarry", "Farm", "Market", "Workshop", "Council"].map(
        (name, i) =>
          C(
            "text",
            `${name} Label`,
            25 + (i % 3) * 140,
            30 + Math.floor(i / 3) * 90,
            {
              width: 100,
              height: 14,
              text: name.toUpperCase(),
              fontSize: 9,
              textColor: "#3ddc97",
            },
          ),
      ),
      // Player meeples (4 players × 3 meeples)
      ...["#ff3b5c", "#22d3ee", "#f5c451", "#a78bff"].flatMap((color, pi) =>
        Array.from({ length: 3 }, (_, mi) =>
          C(
            "meeple",
            `P${pi + 1} Meeple ${mi + 1}`,
            15 + pi * 40,
            250 + mi * 24,
            {
              width: 16,
              height: 22,
              fill: color,
              stroke: "#0a0a0a",
            },
          ),
        ),
      ),
      // Resource tokens
      C("cube", "Wood", 330, 210, {
        width: 16,
        height: 16,
        fill: "#7a5c2e",
        stroke: "#0a0a0a",
        quantity: 20,
      }),
      C("cube", "Stone", 360, 210, {
        width: 16,
        height: 16,
        fill: "#888ea0",
        stroke: "#0a0a0a",
        quantity: 20,
      }),
      C("coin", "Gold", 390, 210, {
        width: 20,
        height: 20,
        fill: "#f5c451",
        stroke: "#2a1f12",
        quantity: 15,
      }),
      C("token", "Food", 420, 210, {
        width: 20,
        height: 20,
        fill: "#fb923c",
        stroke: "#2a1f12",
        quantity: 20,
      }),
    ],
    rules: [
      R(
        "turn_start",
        "Place one worker on an unoccupied action space",
        "move_spaces",
        { amount: 1, target: "current" },
      ),
      R(
        "turn_end",
        "Collect resources from all your placed workers",
        "gain_points",
        { amount: 1, target: "current" },
      ),
      R("round_end", "Return all workers to their owners", "extra_turn", {
        target: "all",
      }),
      R("game_end", "After 6 rounds, most points wins", "end_game", {
        value: "6 rounds completed",
      }),
    ],
  },

  // ── 4. Cooperative Dungeon ─────────────────────────────────────────────────
  {
    id: "coop-dungeon",
    name: "Co-op Dungeon Crawl",
    description:
      "All players vs the game. Explore rooms, fight monsters, collect loot, and reach the boss. Modular room tiles, hero cards, and a threat track.",
    category: "cooperative",
    playerCount: "1–4",
    estimatedTime: "60–90 min",
    tags: ["coop", "dungeon", "exploration", "tiles"],
    icon: "🐉",
    color: "#ff3b5c",
    components: [
      // Dungeon board border
      C("board", "Dungeon", 5, 5, {
        width: 350,
        height: 280,
        fill: "#080a0d",
        stroke: "#ff3b5c",
        strokeWidth: 2,
      }),
      // Room tiles (hex layout)
      ...Array.from({ length: 7 }, (_, i) =>
        C(
          "hex",
          `Room ${i + 1}`,
          30 + (i % 4) * 72,
          30 + Math.floor(i / 4) * 80,
          {
            width: 60,
            height: 70,
            fill: "#0f1012",
            stroke: "#3a2a1f",
          },
        ),
      ),
      // Hero cards (4 heroes)
      ...["Warrior", "Rogue", "Mage", "Cleric"].map((hero, i) =>
        C("card", `${hero} Hero`, 370 + 0, 5 + i * 68, {
          width: 58,
          height: 62,
          fill: "#1c1a2e",
          stroke: "#7c5cff",
        }),
      ),
      // Threat track
      C("track", "Threat Track", 5, 255, {
        width: 350,
        height: 18,
        fill: "#1a0808",
        stroke: "#ff3b5c",
        innerColor: "#ff3b5c",
        segments: 10,
      }),
      // Monster tokens
      C("token", "Goblin", 120, 120, {
        width: 22,
        height: 22,
        fill: "#3a6a1f",
        stroke: "#0a0a0a",
        quantity: 6,
      }),
      C("token", "Troll", 160, 120, {
        width: 28,
        height: 28,
        fill: "#6a3a1f",
        stroke: "#0a0a0a",
        quantity: 3,
      }),
      C("token", "Boss", 200, 120, {
        width: 36,
        height: 36,
        fill: "#ff3b5c",
        stroke: "#0a0a0a",
        quantity: 1,
      }),
      // Loot cards
      C("deck", "Loot Deck", 300, 50, {
        width: 48,
        height: 70,
        fill: "#2a1f0a",
        stroke: "#f5c451",
      }),
      // Sand timer for timed events
      C("sand_timer", "Event Timer", 310, 160, {
        width: 22,
        height: 38,
        fill: "#f5c451",
        stroke: "#0a0a0a",
      }),
    ],
    rules: [
      R(
        "turn_start",
        "Draw 1 event card — it may spawn enemies or give a boon",
        "draw_cards",
        { amount: 1, target: "all" },
      ),
      R(
        "card_played",
        "When a hero uses an ability, advance the threat track +1",
        "gain_points",
        { amount: 1, target: "all" },
      ),
      R(
        "player_eliminated",
        "When a hero falls, threat track advances +2",
        "gain_points",
        { amount: 2, target: "all" },
      ),
      R(
        "game_end",
        "Defeat the boss before threat reaches 10 to win",
        "end_game",
        { value: "Boss defeated or threat reaches 10" },
      ),
    ],
  },

  // ── 5. Abstract Strategy ──────────────────────────────────────────────────
  {
    id: "abstract-strategy",
    name: "Abstract Strategy",
    description:
      "Clean grid, two players, pure tactics. A chess-inspired template with a square board, two sets of pieces, and no luck. Pure skill.",
    category: "abstract",
    playerCount: "2",
    estimatedTime: "20–60 min",
    tags: ["2-player", "grid", "tactics", "no-luck"],
    icon: "♟️",
    color: "#8899bb",
    components: [
      // 8×8 board
      C("board", "Grid Board", 10, 10, {
        width: 280,
        height: 280,
        fill: "#101418",
        stroke: "#8899bb",
        strokeWidth: 2,
      }),
      // Grid lines (horizontal + vertical via track)
      ...Array.from({ length: 7 }, (_, i) =>
        C("line", `H-Line ${i + 1}`, 10, 45 + i * 35, {
          width: 280,
          height: 2,
          fill: "#2a3040",
          stroke: "transparent",
        }),
      ),
      ...Array.from({ length: 7 }, (_, i) =>
        C("line", `V-Line ${i + 1}`, 45 + i * 35, 10, {
          width: 2,
          height: 280,
          fill: "#2a3040",
          stroke: "transparent",
        }),
      ),
      // White pieces (8 pawns + 1 of each major piece)
      ...Array.from({ length: 8 }, (_, i) =>
        C("token", `W-Pawn ${i + 1}`, 15 + i * 35, 220, {
          width: 22,
          height: 22,
          fill: "#e8d5b8",
          stroke: "#2a1f12",
        }),
      ),
      C("cube", "W-Rook L", 15, 255, {
        width: 24,
        height: 24,
        fill: "#d0bc9a",
        stroke: "#2a1f12",
      }),
      C("pawn", "W-Knight L", 50, 250, {
        width: 18,
        height: 26,
        fill: "#d0bc9a",
        stroke: "#2a1f12",
      }),
      C("cube", "W-Bishop L", 85, 255, {
        width: 24,
        height: 24,
        fill: "#d0bc9a",
        stroke: "#2a1f12",
      }),
      C("meeple", "W-Queen", 120, 248, {
        width: 20,
        height: 28,
        fill: "#f5c451",
        stroke: "#2a1f12",
      }),
      C("meeple", "W-King", 155, 248, {
        width: 22,
        height: 30,
        fill: "#d0bc9a",
        stroke: "#2a1f12",
      }),
      // Black pieces
      ...Array.from({ length: 8 }, (_, i) =>
        C("token", `B-Pawn ${i + 1}`, 15 + i * 35, 45, {
          width: 22,
          height: 22,
          fill: "#2a2a3a",
          stroke: "#8899bb",
        }),
      ),
      C("cube", "B-Rook L", 15, 15, {
        width: 24,
        height: 24,
        fill: "#1a1a2a",
        stroke: "#8899bb",
      }),
      C("pawn", "B-Knight L", 50, 12, {
        width: 18,
        height: 26,
        fill: "#1a1a2a",
        stroke: "#8899bb",
      }),
      C("cube", "B-Bishop L", 85, 15, {
        width: 24,
        height: 24,
        fill: "#1a1a2a",
        stroke: "#8899bb",
      }),
      C("meeple", "B-Queen", 120, 10, {
        width: 20,
        height: 28,
        fill: "#7c5cff",
        stroke: "#0a0a0a",
      }),
      C("meeple", "B-King", 155, 10, {
        width: 22,
        height: 30,
        fill: "#1a1a2a",
        stroke: "#8899bb",
      }),
    ],
    rules: [
      R(
        "turn_start",
        "Move one of your pieces to a valid square",
        "move_spaces",
        { amount: 1, target: "current" },
      ),
      R(
        "turn_end",
        "If a piece is captured, remove it from play",
        "skip_turn",
        { target: "current" },
      ),
      R("game_end", "Checkmate the opponent king to win", "end_game", {
        value: "King is captured",
      }),
    ],
  },

  // ── 6. Social Deduction ───────────────────────────────────────────────────
  {
    id: "social-deduction",
    name: "Social Deduction",
    description:
      "Hidden roles, secret alliances, and table talk. A werewolf/mafia-style template with role cards, a town board, and a day/night cycle.",
    category: "party",
    playerCount: "5–12",
    estimatedTime: "30–60 min",
    tags: ["hidden-roles", "social", "bluffing", "night"],
    icon: "🐺",
    color: "#fb923c",
    components: [
      // Town board
      C("board", "Town Square", 5, 5, {
        width: 420,
        height: 260,
        fill: "#0d0f0a",
        stroke: "#fb923c",
        strokeWidth: 2,
      }),
      // Day/night tracker
      C("track", "Day/Night Track", 15, 230, {
        width: 390,
        height: 18,
        fill: "#1a1208",
        stroke: "#fb923c",
        innerColor: "#f5c451",
        segments: 7,
      }),
      // Role cards (10 roles)
      ...Array.from({ length: 10 }, (_, i) =>
        C(
          "card",
          `Role ${i + 1}`,
          15 + (i % 5) * 77,
          15 + Math.floor(i / 5) * 96,
          {
            width: 68,
            height: 88,
            fill: "#1a0d08",
            stroke: "#fb923c",
          },
        ),
      ),
      // Vote tokens
      C("token", "Village Vote", 355, 15, {
        width: 24,
        height: 24,
        fill: "#f5c451",
        stroke: "#0a0a0a",
        quantity: 12,
      }),
      C("token", "Eliminate", 355, 50, {
        width: 24,
        height: 24,
        fill: "#ff3b5c",
        stroke: "#0a0a0a",
        quantity: 5,
      }),
      // Night phase spinner
      C("spinner", "Phase Spinner", 368, 90, {
        width: 42,
        height: 42,
        fill: "#1a1208",
        stroke: "#fb923c",
        segments: 4,
      }),
    ],
    rules: [
      R(
        "round_start",
        "Night phase: special roles take secret actions",
        "skip_turn",
        { target: "all" },
      ),
      R("turn_start", "Day phase: all players discuss and vote", "extra_turn", {
        target: "all",
      }),
      R(
        "card_played",
        "Voting: majority vote eliminates one player",
        "eliminate_player",
        { target: "current" },
      ),
      R(
        "player_eliminated",
        "Reveal eliminated player's role card",
        "flip_component",
        { target: "all" },
      ),
      R(
        "game_end",
        "Villagers win if all wolves eliminated; wolves win if equal",
        "end_game",
        { value: "One faction remains" },
      ),
    ],
  },

  // ── 7. Adventure Card Game ─────────────────────────────────────────────────
  {
    id: "adventure-cards",
    name: "Adventure Card Game",
    description:
      "A lightweight RPG-style card game. Hero deck, encounter deck, loot system, and a level-up mechanic. Great foundation for a dungeon-delving card game.",
    category: "adventure",
    playerCount: "1–3",
    estimatedTime: "30–60 min",
    tags: ["rpg", "cards", "loot", "level-up"],
    icon: "⚔️",
    color: "#22d3ee",
    components: [
      C("board", "Adventure Map", 5, 5, {
        width: 280,
        height: 200,
        fill: "#0a0d10",
        stroke: "#22d3ee",
        strokeWidth: 2,
      }),
      // Hero card
      C("card", "Hero Card", 295, 5, {
        width: 70,
        height: 100,
        fill: "#1c1a2e",
        stroke: "#7c5cff",
      }),
      // Stats tokens
      C("token", "HP", 295, 115, {
        width: 28,
        height: 28,
        fill: "#ff3b5c",
        stroke: "#0a0a0a",
        quantity: 20,
      }),
      C("token", "MP", 335, 115, {
        width: 28,
        height: 28,
        fill: "#7c5cff",
        stroke: "#0a0a0a",
        quantity: 15,
      }),
      C("coin", "Gold", 295, 155, {
        width: 28,
        height: 28,
        fill: "#f5c451",
        stroke: "#2a1f12",
        quantity: 30,
      }),
      // Decks
      C("deck", "Ability Deck", 5, 215, {
        width: 55,
        height: 80,
        fill: "#1c1a2e",
        stroke: "#22d3ee",
      }),
      C("deck", "Encounter Deck", 75, 215, {
        width: 55,
        height: 80,
        fill: "#1a0808",
        stroke: "#ff3b5c",
      }),
      C("deck", "Loot Deck", 145, 215, {
        width: 55,
        height: 80,
        fill: "#1a1f0a",
        stroke: "#3ddc97",
      }),
      // Level tracker
      C("track", "Level Track", 5, 300, {
        width: 280,
        height: 18,
        fill: "#0d1018",
        stroke: "#22d3ee",
        innerColor: "#22d3ee",
        segments: 10,
      }),
      // Location tokens
      C("hex", "Cave", 50, 30, {
        width: 60,
        height: 70,
        fill: "#0f1012",
        stroke: "#3a2a1f",
      }),
      C("hex", "Forest", 130, 30, {
        width: 60,
        height: 70,
        fill: "#0a1208",
        stroke: "#2a4a20",
      }),
      C("hex", "Ruins", 210, 30, {
        width: 60,
        height: 70,
        fill: "#12100a",
        stroke: "#4a3a10",
      }),
      C("hex", "Dungeon", 90, 110, {
        width: 60,
        height: 70,
        fill: "#100a12",
        stroke: "#3a1a4a",
      }),
      C("hex", "Boss", 170, 110, {
        width: 60,
        height: 70,
        fill: "#150808",
        stroke: "#ff3b5c",
      }),
    ],
    rules: [
      R(
        "turn_start",
        "Draw 2 ability cards and 1 encounter card",
        "draw_cards",
        { amount: 2, target: "current" },
      ),
      R("card_played", "Playing an ability card costs 1 MP", "lose_points", {
        amount: 1,
        target: "current",
      }),
      R("turn_end", "Gain 1 XP; level up at 10 XP", "gain_points", {
        amount: 1,
        target: "current",
      }),
      R("round_end", "Reveal the next encounter from the deck", "draw_cards", {
        amount: 1,
        target: "all",
      }),
      R("game_end", "Defeat the boss hex to win", "end_game", {
        value: "Boss location cleared",
      }),
    ],
  },
];

/** Look up a template by id. */
export function getTemplate(id: string): StudioTemplate | undefined {
  return TEMPLATE_REGISTRY.find((t) => t.id === id);
}

/** Get all templates, optionally filtered by category. */
export function getTemplates(
  category?: StudioTemplate["category"],
): StudioTemplate[] {
  if (!category) return TEMPLATE_REGISTRY;
  return TEMPLATE_REGISTRY.filter((t) => t.category === category);
}

export const TEMPLATE_CATEGORIES: {
  value: StudioTemplate["category"] | "all";
  label: string;
  icon: string;
}[] = [
  { value: "all", label: "All", icon: "✦" },
  { value: "strategy", label: "Strategy", icon: "♟️" },
  { value: "party", label: "Party", icon: "🎉" },
  { value: "deck-building", label: "Deck Building", icon: "🃏" },
  { value: "cooperative", label: "Co-op", icon: "🤝" },
  { value: "abstract", label: "Abstract", icon: "◻️" },
  { value: "adventure", label: "Adventure", icon: "⚔️" },
];
