"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { CanvasComp, GameRule, GameGuide, StudioPage } from "../core";

// ── Types ─────────────────────────────────────────────────────────────────────

export type AIStrategy = "random" | "aggressive" | "defensive" | "balanced";

export interface PlayerInventoryItem {
  compId: string;
  label: string;
  quantity: number;
}

export interface Player {
  id: string;
  name: string;
  color: string;
  score: number;
  isAI: boolean;
  aiStrategy: AIStrategy;
  inventory: PlayerInventoryItem[];
  /** Custom per-player counters keyed by label */
  counters: Record<string, number>;
  isEliminated: boolean;
}

export interface GameEvent {
  id: string;
  timestamp: string;
  kind: "roll" | "move" | "score" | "turn" | "round" | "rule" | "ai" | "card" | "link" | "info" | "reset";
  message: string;
  playerId?: string;
  playerColor?: string;
}

export interface CustomCounter {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
}

export interface PlaytestState {
  pieces: CanvasComp[];
  players: Player[];
  turnIdx: number;
  round: number;
  phase: "setup" | "playing" | "ended";
  log: GameEvent[];
  activePageIdx: number;
  timer: { running: boolean; seconds: number };
  lastRoll: { value: number; sides: number } | null;
  customCounters: CustomCounter[];
  selectedPieceId: string | null;
  flippedPieceIds: Set<string>;
}

// ── AI strategy descriptions ──────────────────────────────────────────────────

export const AI_STRATEGY_LABELS: Record<AIStrategy, { label: string; desc: string; color: string }> = {
  random:     { label: "Random",    desc: "Makes random moves each turn",            color: "#8899bb" },
  aggressive: { label: "Aggressive",desc: "Maximises score, takes risks",            color: "#ff3b5c" },
  defensive:  { label: "Defensive", desc: "Protects position, avoids losses",        color: "#3ddc97" },
  balanced:   { label: "Balanced",  desc: "Weighs score vs safety each turn",        color: "#f5c451" },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const COLORS = ["#34d399","#f5c451","#22d3ee","#f87171","#a78bff","#fb923c","#f472b6","#4ade80"];
const stamp  = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
let _eid = 0;
const eid = () => `ev-${++_eid}-${Date.now()}`;

function makeEvent(
  kind: GameEvent["kind"],
  message: string,
  player?: Player,
): GameEvent {
  return {
    id: eid(),
    timestamp: stamp(),
    kind,
    message,
    playerId: player?.id!,
    playerColor: player?.color!,
  };
}

function makePlayer(i: number, isAI = false): Player {
  return {
    id: `p-${i}-${Math.random().toString(36).slice(2, 6)}`,
    name: isAI ? `AI ${i + 1}` : `Player ${i + 1}`,
    color: COLORS[i % COLORS.length]!,
    score: 0,
    isAI,
    aiStrategy: "balanced",
    inventory: [],
    counters: {},
    isEliminated: false,
  };
}

// ── AI move logic ─────────────────────────────────────────────────────────────

function runAITurn(
  player: Player,
  pieces: CanvasComp[],
  rules: GameRule[],
): { scoreDelta: number; logMsg: string; movePiece?: { id: string; dx: number; dy: number } } {
  console.log(rules);
  const strategy = player.aiStrategy;
  // const enabled = rules.filter((r) => r.enabled !== false);

  // Roll a virtual die
  const roll = 1 + Math.floor(Math.random() * 6);

  // Pick a random visible, unlocked piece to "move"
  const movable = pieces.filter((c) => c.visible && !c.locked);
  const target = movable.length ? movable[Math.floor(Math.random() * movable.length)] : null;

  let scoreDelta = 0;
  const reasons: string[] = [`rolled ${roll}`];

  if (strategy === "aggressive") {
    scoreDelta = roll > 3 ? roll : Math.max(0, roll - 2);
    reasons.push(scoreDelta > 0 ? `scored ${scoreDelta} (aggressive)` : "no score (cautious)");
  } else if (strategy === "defensive") {
    scoreDelta = roll >= 4 ? 1 : 0;
    reasons.push(scoreDelta ? "scored 1 (safe play)" : "held position");
  } else if (strategy === "balanced") {
    scoreDelta = Math.round(roll / 2);
    reasons.push(`scored ${scoreDelta} (balanced)`);
  } else {
    // random
    scoreDelta = Math.random() > 0.5 ? roll : 0;
    reasons.push(scoreDelta ? `scored ${scoreDelta}` : "no score");
  }

  const movePiece = target
    ? {
        id: target.id,
        dx: (Math.random() - 0.5) * 20,
        dy: (Math.random() - 0.5) * 20,
      }
    : undefined;

  return {
    scoreDelta,
    logMsg: `${player.name} (${AI_STRATEGY_LABELS[strategy].label}): ${reasons.join(", ")}`,
    movePiece: movePiece!,
  };
}

// ── Main hook ─────────────────────────────────────────────────────────────────

export function usePlaytestEngine(
  pages: StudioPage[],
  rules: GameRule[],
  guide: GameGuide,
) {
  console.log(guide);
  const initialPage = pages[0];

  const [state, setState] = useState<PlaytestState>(() => ({
    pieces: initialPage?.components.map((c) => ({ ...c })) ?? [],
    players: [makePlayer(0, false), makePlayer(1, false)],
    turnIdx: 0,
    round: 1,
    phase: "setup",
    log: [makeEvent("info", "Playtest started. Configure players and press Start.")],
    activePageIdx: 0,
    timer: { running: false, seconds: 0 },
    lastRoll: null,
    customCounters: [],
    selectedPieceId: null,
    flippedPieceIds: new Set(),
  }));

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const aiTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Timer ──────────────────────────────────────────────────────────────────

  const startTimer = useCallback(() => {
    if (timerRef.current) return;
    timerRef.current = setInterval(() => {
      setState((s) => ({ ...s, timer: { ...s.timer, seconds: s.timer.seconds + 1 } }));
    }, 1000);
    setState((s) => ({ ...s, timer: { ...s.timer, running: true } }));
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setState((s) => ({ ...s, timer: { ...s.timer, running: false } }));
  }, []);

  const resetTimer = useCallback(() => {
    stopTimer();
    setState((s) => ({ ...s, timer: { running: false, seconds: 0 } }));
  }, [stopTimer]);

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
  }, []);

  // ── Log helper ─────────────────────────────────────────────────────────────

  const addLog = useCallback((ev: GameEvent) => {
    setState((s) => ({ ...s, log: [ev, ...s.log].slice(0, 200) }));
  }, []);

  // ── Players ────────────────────────────────────────────────────────────────

  const addPlayer = useCallback((isAI = false) => {
    setState((s) => {
      const i = s.players.length;
      const p = makePlayer(i, isAI);
      addLog(makeEvent("info", `${p.name} joined`));
      return { ...s, players: [...s.players, p] };
    });
  }, [addLog]);

  const removePlayer = useCallback((id: string) => {
    setState((s) => {
      const p = s.players.find((p) => p.id === id);
      if (p) addLog(makeEvent("info", `${p.name} removed`));
      return {
        ...s,
        players: s.players.filter((p) => p.id !== id),
        turnIdx: Math.max(0, s.turnIdx - (s.players.findIndex((p) => p.id === id) <= s.turnIdx ? 1 : 0)),
      };
    });
  }, [addLog]);

  const updatePlayer = useCallback((id: string, patch: Partial<Player>) => {
    setState((s) => ({ ...s, players: s.players.map((p) => p.id === id ? { ...p, ...patch } : p) }));
  }, []);

  const bumpScore = useCallback((id: string, delta: number) => {
    setState((s) => {
      const p = s.players.find((p) => p.id === id);
      if (!p) return s;
      const score = p.score + delta;
      addLog(makeEvent("score", `${p.name} ${delta > 0 ? "+" : ""}${delta} → ${score}`, p));
      return { ...s, players: s.players.map((pl) => pl.id === id ? { ...pl, score } : pl) };
    });
  }, [addLog]);

  const bumpCounter = useCallback((playerId: string, key: string, delta: number) => {
    setState((s) => ({
      ...s,
      players: s.players.map((p) => p.id === playerId
        ? { ...p, counters: { ...p.counters, [key]: (p.counters[key] ?? 0) + delta } }
        : p
      ),
    }));
  }, []);

  // ── Turn / round ───────────────────────────────────────────────────────────

  const nextTurn = useCallback(() => {
    setState((s) => {
      const active = s.players.filter((p) => !p.isEliminated);
      if (active.length === 0) return s;

      let next = (s.turnIdx + 1) % s.players.length;
      // Skip eliminated
      let guard = 0;
      while (s.players[next]?.isEliminated && guard++ < s.players.length) {
        next = (next + 1) % s.players.length;
      }

      let round = s.round;
      if (next <= s.turnIdx && active.length > 1) round = s.round + 1;

      const nextPlayer = s.players[next];
      const events: GameEvent[] = [];
      if (round > s.round) events.push(makeEvent("round", `— Round ${round} begins —`));
      if (nextPlayer) events.push(makeEvent("turn", `${nextPlayer.name}'s turn`, nextPlayer));

      const newState: PlaytestState = {
        ...s,
        turnIdx: next,
        round,
        log: [...events, ...s.log].slice(0, 200),
      };

      // Check rules
      const triggered = rules.filter((r) => r.trigger === "turn_start" && r.enabled !== false);
      if (triggered.length > 0 && nextPlayer) {
        triggered.forEach((r) => {
          newState.log = [makeEvent("rule", `Rule: ${r.description}`, nextPlayer), ...newState.log];
        });
      }

      return newState;
    });
  }, [rules]);

  const prevTurn = useCallback(() => {
    setState((s) => {
      const prev = (s.turnIdx - 1 + s.players.length) % s.players.length;
      return { ...s, turnIdx: prev };
    });
  }, []);

  const startGame = useCallback(() => {
    setState((s) => ({
      ...s,
      phase: "playing",
      log: [makeEvent("info", "Game started! Good luck."), ...s.log],
    }));
    startTimer();
  }, [startTimer]);

  const endGame = useCallback(() => {
    stopTimer();
    setState((s) => {
      const sorted = [...s.players].sort((a, b) => b.score - a.score);
      const winner = sorted[0];
      return {
        ...s,
        phase: "ended",
        log: [
          makeEvent("info", winner ? `🏆 ${winner.name} wins with ${winner.score} points!` : "Game ended."),
          ...s.log,
        ],
      };
    });
  }, [stopTimer]);

  // ── Dice ───────────────────────────────────────────────────────────────────

  const roll = useCallback((sides: number, playerId?: string) => {
    const value = 1 + Math.floor(Math.random() * sides);
    setState((s) => {
      const player = playerId ? s.players.find((p) => p.id === playerId) : s.players[s.turnIdx];
      addLog(makeEvent("roll", `${player?.name ?? "?"} rolled d${sides} → ${value}`, player));

      // Check card_played rules (reuse for roll triggers)
      const ruleTriggers = rules.filter((r) => r.trigger === "card_played" && r.enabled !== false);
      const ruleEvents = ruleTriggers.map((r) =>
        makeEvent("rule", `Rule triggered: ${r.description}`, player)
      );

      return {
        ...s,
        lastRoll: { value, sides },
        log: [...ruleEvents, ...s.log].slice(0, 200),
      };
    });
    return value;
  }, [addLog, rules]);

  // ── Pieces ─────────────────────────────────────────────────────────────────

  const movePiece = useCallback((id: string, x: number, y: number) => {
    setState((s) => ({ ...s, pieces: s.pieces.map((p) => p.id === id ? { ...p, x, y } : p) }));
  }, []);

  const rotatePiece = useCallback((id: string, delta = 90) => {
    setState((s) => ({
      ...s,
      pieces: s.pieces.map((p) =>
        p.id === id ? { ...p, rotation: Math.round(((p.rotation + delta) % 360 + 360) % 360) } : p
      ),
    }));
  }, []);

  const flipPiece = useCallback((id: string) => {
    setState((s) => {
      const next = new Set(s.flippedPieceIds);
      if (next.has(id)) next.delete(id); else next.add(id);
      const piece = s.pieces.find((p) => p.id === id);
      addLog(makeEvent("card", `${piece?.name ?? "Piece"} flipped ${next.has(id) ? "face-down" : "face-up"}`));
      return { ...s, flippedPieceIds: next };
    });
  }, [addLog]);

  const bringToFront = useCallback((id: string) => {
    setState((s) => {
      const i = s.pieces.findIndex((p) => p.id === id);
      if (i < 0) return s;
      const next = [...s.pieces];
      const [p] = next.splice(i, 1);
      next.push(p!);
      return { ...s, pieces: next };
    });
  }, []);

  const selectPiece = useCallback((id: string | null) => {
    setState((s) => ({ ...s, selectedPieceId: id }));
  }, []);

  // ── Page navigation (page-link) ────────────────────────────────────────────

  const goToPage = useCallback((pageId: string) => {
    const idx = pages.findIndex((p) => p.id === pageId);
    if (idx < 0) return;
    setState((s) => {
      const page = pages[idx]!;
      addLog(makeEvent("link", `Navigated to "${page.name}"`));
      return {
        ...s,
        activePageIdx: idx,
        pieces: page.components.map((c) => ({ ...c })),
        selectedPieceId: null,
      };
    });
  }, [pages, addLog]);

  const goToPageByIdx = useCallback((idx: number) => {
    if (idx < 0 || idx >= pages.length) return;
    const page = pages[idx]!;
    setState((s) => ({
      ...s,
      activePageIdx: idx,
      pieces: page.components.map((c) => ({ ...c })),
      selectedPieceId: null,
    }));
    addLog(makeEvent("link", `Switched to "${page.name}"`));
  }, [pages, addLog]);

  // ── AI turn ────────────────────────────────────────────────────────────────

  const triggerAITurn = useCallback(() => {
    setState((s) => {
      const player = s.players[s.turnIdx];
      if (!player?.isAI) return s;

      const result = runAITurn(player, s.pieces, rules);
      const ev = makeEvent("ai", result.logMsg, player);

      let pieces = s.pieces;
      if (result.movePiece) {
        const { id, dx, dy } = result.movePiece;
        pieces = pieces.map((p) => p.id === id ? { ...p, x: Math.max(0, p.x + dx), y: Math.max(0, p.y + dy) } : p);
      }

      const players = result.scoreDelta !== 0
        ? s.players.map((p) => p.id === player.id ? { ...p, score: p.score + result.scoreDelta } : p)
        : s.players;

      return { ...s, pieces, players, log: [ev, ...s.log].slice(0, 200) };
    });
  }, [rules]);

  // ── Custom counters ────────────────────────────────────────────────────────

  const addCounter = useCallback((label: string, min = 0, max = 99) => {
    setState((s) => ({
      ...s,
      customCounters: [...s.customCounters, {
        id: `ctr-${Date.now()}`, label, value: min, min, max,
      }],
    }));
  }, []);

  const bumpCustomCounter = useCallback((id: string, delta: number) => {
    setState((s) => ({
      ...s,
      customCounters: s.customCounters.map((c) =>
        c.id === id ? { ...c, value: Math.max(c.min, Math.min(c.max, c.value + delta)) } : c
      ),
    }));
  }, []);

  const removeCounter = useCallback((id: string) => {
    setState((s) => ({ ...s, customCounters: s.customCounters.filter((c) => c.id !== id) }));
  }, []);

  // ── Reset ──────────────────────────────────────────────────────────────────

  const resetGame = useCallback(() => {
    stopTimer();
    const page = pages[0];
    setState((s) => ({
      ...s,
      pieces: page?.components.map((c) => ({ ...c })) ?? [],
      players: s.players.map((p) => ({ ...p, score: 0, inventory: [], counters: {} })),
      turnIdx: 0,
      round: 1,
      phase: "setup",
      log: [makeEvent("reset", "Game reset.")],
      activePageIdx: 0,
      timer: { running: false, seconds: 0 },
      lastRoll: null,
      selectedPieceId: null,
      flippedPieceIds: new Set(),
    }));
  }, [stopTimer, pages]);

  return {
    state,
    addPlayer,
    removePlayer,
    updatePlayer,
    bumpScore,
    bumpCounter,
    nextTurn,
    prevTurn,
    startGame,
    endGame,
    roll,
    movePiece,
    rotatePiece,
    flipPiece,
    bringToFront,
    selectPiece,
    goToPage,
    goToPageByIdx,
    triggerAITurn,
    startTimer,
    stopTimer,
    resetTimer,
    addCounter,
    bumpCustomCounter,
    removeCounter,
    resetGame,
  };
}
