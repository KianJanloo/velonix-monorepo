"use client";

import { useState } from "react";
import type { GameRule, GameGuide } from "../core";
import type {
  Player,
  GameEvent,
  CustomCounter,
  AIStrategy,
  PlaytestState,
} from "./usePlaytestEngine";
import { AI_STRATEGY_LABELS } from "./usePlaytestEngine";

// ── Re-export Player for PlaytestView ─────────────────────────────────────────
export type { Player } from "./usePlaytestEngine";

// ── Tab ───────────────────────────────────────────────────────────────────────

type Tab = "players" | "board" | "log" | "rules" | "ai";

const TABS: { id: Tab; label: string }[] = [
  { id: "players", label: "Players" },
  { id: "board", label: "Board" },
  { id: "log", label: "Log" },
  { id: "rules", label: "Rules" },
  { id: "ai", label: "AI" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const DICE = [4, 6, 8, 10, 12, 20];

function fmtTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-ui font-semibold text-soft-gray uppercase tracking-wider mb-2">
      {children}
    </p>
  );
}

// ── Event log item ────────────────────────────────────────────────────────────

const EVENT_ICONS: Record<GameEvent["kind"], string> = {
  roll: "🎲",
  move: "↔",
  score: "★",
  turn: "▶",
  round: "◎",
  rule: "⚡",
  ai: "🤖",
  card: "🃏",
  link: "⇢",
  info: "·",
  reset: "↺",
};

function EventRow({ ev }: { ev: GameEvent }) {
  return (
    <div className="flex gap-1.5 py-0.5 items-start">
      <span className="text-[10px] shrink-0 mt-0.5">
        {EVENT_ICONS[ev.kind]}
      </span>
      <div className="flex-1 min-w-0">
        <span
          className="text-[11px] font-ui"
          style={{ color: ev.playerColor ?? "#a8a090" }}
        >
          {ev.message}
        </span>
      </div>
      <span className="text-[10px] font-mono text-soft-gray-dark shrink-0">
        {ev.timestamp}
      </span>
    </div>
  );
}

// ── Players tab ───────────────────────────────────────────────────────────────

function PlayersTab({
  state,
  pages: _pages,
  onAddHuman,
  onAddAI,
  onRemove,
  onRename,
  onBumpScore,
  onBumpCounter,
  onNextTurn,
  onPrevTurn,
  onRoll,
  onStart,
  onEnd,
}: {
  state: PlaytestState;
  pages: { id: string; name: string }[];
  onAddHuman: () => void;
  onAddAI: () => void;
  onRemove: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onBumpScore: (id: string, d: number) => void;
  onBumpCounter: (pid: string, key: string, d: number) => void;
  onNextTurn: () => void;
  onPrevTurn: () => void;
  onRoll: (sides: number) => void;
  onStart: () => void;
  onEnd: () => void;
}) {
  const current = state.players[state.turnIdx];

  return (
    <div className="p-3 space-y-4 overflow-y-auto flex-1">
      {/* Phase / turn header */}
      <div className="rounded-xl bg-warm-wood/20 border border-warm-wood/40 p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-ui text-soft-gray uppercase tracking-wider">
            Round {state.round} ·{" "}
            {state.phase === "setup"
              ? "Setup"
              : state.phase === "ended"
                ? "Ended"
                : "Playing"}
          </span>
          {state.phase === "setup" && (
            <button
              onClick={onStart}
              className="px-3 py-1 rounded-lg bg-emerald-glow text-deep-void text-2xs font-ui font-bold hover:bg-emerald-bright transition-colors"
            >
              Start game
            </button>
          )}
          {state.phase === "playing" && (
            <button
              onClick={onEnd}
              className="px-2 py-1 rounded-lg border border-crimson-flame/40 text-crimson-flame text-2xs font-ui hover:bg-crimson-ghost transition-colors"
            >
              End game
            </button>
          )}
        </div>

        {/* Active player */}
        {current && state.phase !== "setup" && (
          <div
            className="rounded-lg px-3 py-2 mb-2"
            style={{
              background: current.color + "18",
              border: `1px solid ${current.color}44`,
            }}
          >
            <p
              className="text-2xs font-ui font-bold"
              style={{ color: current.color }}
            >
              {current.isAI ? "🤖 " : "▶ "}
              {current.name}'s turn
            </p>
          </div>
        )}

        {/* Turn navigation */}
        {state.phase === "playing" && (
          <div className="flex gap-1.5">
            <button
              onClick={onPrevTurn}
              className="flex-1 py-1.5 rounded-lg border border-warm-wood text-soft-gray text-2xs font-ui hover:text-parchment-light transition-colors"
            >
              ‹ Prev
            </button>
            <button
              onClick={onNextTurn}
              className="flex-2 px-4 py-1.5 rounded-lg bg-emerald-glow text-deep-void text-2xs font-ui font-bold hover:bg-emerald-bright transition-colors"
            >
              Next turn ›
            </button>
          </div>
        )}
      </div>

      {/* Player list */}
      <div>
        <SectionTitle>Players ({state.players.length})</SectionTitle>
        <div className="space-y-1.5">
          {state.players.map((p, i) => (
            <div
              key={p.id}
              className="rounded-lg border p-2 transition-colors"
              style={{
                borderColor:
                  i === state.turnIdx ? p.color + "60" : "rgba(58,42,31,0.4)",
                background:
                  i === state.turnIdx ? p.color + "0e" : "transparent",
              }}
            >
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: p.color }}
                />
                {p.isAI && (
                  <span className="text-[9px] font-ui text-soft-gray-dark">
                    AI
                  </span>
                )}
                <input
                  value={p.name}
                  onChange={(e) => onRename(p.id, e.target.value)}
                  className="flex-1 min-w-0 bg-transparent text-xs font-ui text-parchment-light outline-none"
                />
                {/* Score stepper */}
                <button
                  onClick={() => onBumpScore(p.id, -1)}
                  className="w-5 h-5 rounded bg-warm-wood/60 text-soft-gray text-xs hover:text-parchment-light"
                >
                  −
                </button>
                <span className="w-6 text-center text-xs font-mono font-bold text-parchment-light">
                  {p.score}
                </span>
                <button
                  onClick={() => onBumpScore(p.id, 1)}
                  className="w-5 h-5 rounded bg-warm-wood/60 text-soft-gray text-xs hover:text-parchment-light"
                >
                  +
                </button>
                {state.players.length > 1 && (
                  <button
                    onClick={() => onRemove(p.id)}
                    className="text-soft-gray-dark hover:text-crimson-flame text-xs px-0.5 transition-colors"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Custom counters */}
              {Object.entries(p.counters).map(([key, val]) => (
                <div key={key} className="flex items-center gap-1 mt-1 pl-3.5">
                  <span className="text-[10px] text-soft-gray-dark font-ui flex-1">
                    {key}
                  </span>
                  <button
                    onClick={() => onBumpCounter(p.id, key, -1)}
                    className="w-4 h-4 rounded bg-warm-wood/40 text-soft-gray-dark text-[10px] hover:text-parchment-light"
                  >
                    −
                  </button>
                  <span className="w-5 text-center text-[10px] font-mono text-parchment-mid">
                    {val}
                  </span>
                  <button
                    onClick={() => onBumpCounter(p.id, key, 1)}
                    className="w-4 h-4 rounded bg-warm-wood/40 text-soft-gray-dark text-[10px] hover:text-parchment-light"
                  >
                    +
                  </button>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="flex gap-1.5 mt-2">
          <button
            onClick={onAddHuman}
            className="flex-1 py-1.5 rounded-lg border border-dashed border-warm-wood text-soft-gray text-2xs font-ui hover:text-parchment-light hover:border-warm-wood-light transition-colors"
          >
            + Human
          </button>
          <button
            onClick={onAddAI}
            className="flex-1 py-1.5 rounded-lg border border-dashed border-[rgba(124,92,255,0.4)] text-[#a78bff] text-2xs font-ui hover:border-[rgba(124,92,255,0.7)] transition-colors"
          >
            + AI
          </button>
        </div>
      </div>

      {/* Dice */}
      <div>
        <SectionTitle>Dice</SectionTitle>
        <div className="grid grid-cols-3 gap-1">
          {DICE.map((d) => (
            <button
              key={d}
              onClick={() => onRoll(d)}
              className="py-1.5 rounded-lg bg-warm-wood/50 text-parchment-light text-2xs font-ui font-semibold hover:bg-warm-wood transition-colors"
            >
              d{d}
            </button>
          ))}
        </div>
        {state.lastRoll && (
          <div className="mt-1.5 flex items-center gap-2 px-2 py-1.5 rounded-lg bg-rich-wood-mid">
            <span className="text-xl">🎲</span>
            <div>
              <p className="text-sm font-display font-bold text-parchment-light">
                {state.lastRoll.value}
              </p>
              <p className="text-[10px] text-soft-gray-dark font-ui">
                d{state.lastRoll.sides}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Board tab ─────────────────────────────────────────────────────────────────

function BoardTab({
  state,
  pages,
  counters,
  onGoToPage,
  onAddCounter,
  onBumpCustomCounter,
  onRemoveCounter,
  onStartTimer,
  onStopTimer,
  onResetTimer,
}: {
  state: PlaytestState;
  pages: { id: string; name: string }[];
  counters: CustomCounter[];
  onGoToPage: (id: string) => void;
  onAddCounter: (label: string) => void;
  onBumpCustomCounter: (id: string, d: number) => void;
  onRemoveCounter: (id: string) => void;
  onStartTimer: () => void;
  onStopTimer: () => void;
  onResetTimer: () => void;
}) {
  const [newCtrLabel, setNewCtrLabel] = useState("");

  return (
    <div className="p-3 space-y-4 overflow-y-auto flex-1">
      {/* Timer */}
      <div>
        <SectionTitle>Turn timer</SectionTitle>
        <div className="flex items-center gap-2 bg-rich-wood-mid rounded-xl p-2.5">
          <span className="text-2xl font-mono font-bold text-parchment-light flex-1 text-center tabular-nums">
            {fmtTime(state.timer.seconds)}
          </span>
          <div className="flex gap-1">
            {state.timer.running ? (
              <button
                onClick={onStopTimer}
                className="px-2.5 py-1.5 rounded-lg bg-warm-wood text-parchment-light text-2xs font-ui hover:bg-warm-wood-light transition-colors"
              >
                Pause
              </button>
            ) : (
              <button
                onClick={onStartTimer}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-glow text-deep-void text-2xs font-ui font-bold hover:bg-emerald-bright transition-colors"
              >
                Start
              </button>
            )}
            <button
              onClick={onResetTimer}
              className="px-2 py-1.5 rounded-lg border border-warm-wood text-soft-gray text-2xs font-ui hover:text-parchment-light transition-colors"
            >
              ↺
            </button>
          </div>
        </div>
      </div>

      {/* Pages / boards */}
      {pages.length > 1 && (
        <div>
          <SectionTitle>Boards / pages</SectionTitle>
          <div className="space-y-1">
            {pages.map((p, i) => (
              <button
                key={p.id}
                onClick={() => onGoToPage(p.id)}
                className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-left transition-colors ${
                  i === state.activePageIdx
                    ? "bg-emerald-ghost text-emerald-glow ring-1 ring-emerald-glow/30"
                    : "hover:bg-warm-wood/40 text-soft-gray hover:text-parchment-light"
                }`}
              >
                <span className="text-[10px] font-mono text-soft-gray-dark w-4 shrink-0">
                  {i + 1}
                </span>
                <span className="text-2xs font-ui flex-1 truncate">
                  {p.name}
                </span>
                {i === state.activePageIdx && (
                  <span className="text-[10px] text-emerald-glow/70">
                    active
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Custom counters */}
      <div>
        <SectionTitle>Custom counters</SectionTitle>
        <div className="space-y-1.5 mb-2">
          {counters.length === 0 && (
            <p className="text-[10px] text-soft-gray-dark font-ui">
              No counters. Add one below.
            </p>
          )}
          {counters.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-rich-wood-mid"
            >
              <span className="text-2xs font-ui text-parchment-mid flex-1 truncate">
                {c.label}
              </span>
              <button
                onClick={() => onBumpCustomCounter(c.id, -1)}
                className="w-5 h-5 rounded bg-warm-wood text-soft-gray text-xs hover:text-parchment-light"
              >
                −
              </button>
              <span className="w-7 text-center text-xs font-mono font-bold text-parchment-light tabular-nums">
                {c.value}
              </span>
              <button
                onClick={() => onBumpCustomCounter(c.id, 1)}
                className="w-5 h-5 rounded bg-warm-wood text-soft-gray text-xs hover:text-parchment-light"
              >
                +
              </button>
              <button
                onClick={() => onRemoveCounter(c.id)}
                className="text-soft-gray-dark hover:text-crimson-flame text-xs px-0.5 transition-colors"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-1.5">
          <input
            value={newCtrLabel}
            onChange={(e) => setNewCtrLabel(e.target.value)}
            placeholder="Counter name…"
            className="flex-1 v-input text-xs py-1.5"
            onKeyDown={(e) => {
              if (e.key === "Enter" && newCtrLabel.trim()) {
                onAddCounter(newCtrLabel.trim());
                setNewCtrLabel("");
              }
            }}
          />
          <button
            onClick={() => {
              if (newCtrLabel.trim()) {
                onAddCounter(newCtrLabel.trim());
                setNewCtrLabel("");
              }
            }}
            className="px-3 py-1.5 rounded-lg bg-emerald-ghost text-emerald-glow text-2xs font-ui hover:bg-emerald-glow hover:text-deep-void transition-colors"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Log tab ───────────────────────────────────────────────────────────────────

function LogTab({ log }: { log: GameEvent[] }) {
  return (
    <div className="p-3 overflow-y-auto flex-1">
      {log.length === 0 ? (
        <p className="text-[11px] text-soft-gray-dark font-ui">
          No events yet.
        </p>
      ) : (
        <div className="divide-y divide-warm-wood/20">
          {log.map((ev) => (
            <EventRow key={ev.id} ev={ev} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Rules tab ─────────────────────────────────────────────────────────────────

function RulesTab({ rules, guide }: { rules: GameRule[]; guide: GameGuide }) {
  const enabled = rules.filter((r) => r.enabled !== false);
  return (
    <div className="p-3 overflow-y-auto flex-1 space-y-3">
      {guide.objective && (
        <div>
          <SectionTitle>Objective</SectionTitle>
          <p className="text-2xs font-ui text-parchment-mid leading-relaxed">
            {guide.objective}
          </p>
        </div>
      )}
      {enabled.length > 0 && (
        <div>
          <SectionTitle>Active rules ({enabled.length})</SectionTitle>
          <ul className="space-y-1.5">
            {enabled.map((r) => (
              <li
                key={r.id}
                className="flex gap-2 p-2 rounded-lg bg-rich-wood-mid"
              >
                <span className="text-emerald-glow text-[10px] mt-0.5 shrink-0">
                  ⚡
                </span>
                <div>
                  <p className="text-2xs font-ui text-parchment-light">
                    {r.description}
                  </p>
                  <p className="text-[10px] font-ui text-soft-gray-dark capitalize">
                    {r.trigger?.replace(/_/g, " ")}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      {guide.scenarios?.length > 0 && (
        <div>
          <SectionTitle>Scenarios</SectionTitle>
          <div className="space-y-1.5">
            {guide.scenarios.map((s) => (
              <div key={s.id} className="p-2 rounded-lg bg-rich-wood-mid">
                <p className="text-2xs font-ui font-semibold text-parchment-light">
                  {s.name}
                </p>
                <p className="text-[10px] text-soft-gray-dark">
                  {s.players}p · {s.difficulty}
                </p>
                {s.winCondition && (
                  <p className="text-[10px] text-soft-gray mt-0.5">
                    {s.winCondition}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      {!guide.objective && enabled.length === 0 && !guide.scenarios?.length && (
        <p className="text-soft-gray-dark text-2xs font-ui">
          No rules or guide configured. Add them in the Rules panel in the
          editor.
        </p>
      )}
    </div>
  );
}

// ── AI tab ────────────────────────────────────────────────────────────────────

function AITab({
  players,
  onUpdatePlayer,
  onTriggerAI,
}: {
  players: Player[];
  onUpdatePlayer: (id: string, patch: Partial<Player>) => void;
  onTriggerAI: () => void;
}) {
  const aiPlayers = players.filter((p) => p.isAI);

  return (
    <div className="p-3 space-y-4 overflow-y-auto flex-1">
      <div>
        <SectionTitle>AI players</SectionTitle>
        {aiPlayers.length === 0 ? (
          <p className="text-[11px] text-soft-gray-dark font-ui">
            No AI players. Add one in the Players tab.
          </p>
        ) : (
          <div className="space-y-3">
            {aiPlayers.map((p) => (
              <div
                key={p.id}
                className="rounded-xl border border-warm-wood/40 p-3 space-y-2"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: p.color }}
                  />
                  <span className="text-2xs font-ui font-semibold text-parchment-light flex-1">
                    {p.name}
                  </span>
                  <span className="text-[10px] font-ui text-soft-gray-dark">
                    Score: {p.score}
                  </span>
                </div>

                <div>
                  <p className="text-[10px] font-ui text-soft-gray-dark mb-1.5">
                    Strategy
                  </p>
                  <div className="grid grid-cols-2 gap-1">
                    {(
                      [
                        "random",
                        "aggressive",
                        "defensive",
                        "balanced",
                      ] as AIStrategy[]
                    ).map((s) => {
                      const meta = AI_STRATEGY_LABELS[s];
                      const active = p.aiStrategy === s;
                      return (
                        <button
                          key={s}
                          onClick={() =>
                            onUpdatePlayer(p.id, { aiStrategy: s })
                          }
                          className={`px-2 py-1.5 rounded-lg text-[10px] font-ui transition-colors text-left ${
                            active
                              ? "ring-1 font-semibold"
                              : "bg-rich-wood-mid text-soft-gray hover:text-parchment-light"
                          }`}
                          style={
                            active
                              ? {
                                  background: meta.color + "22",
                                  color: meta.color,
                                  // , ringColor: meta.color
                                }
                              : {}
                          }
                          title={meta.desc}
                        >
                          {meta.label}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-soft-gray-dark font-ui mt-1">
                    {AI_STRATEGY_LABELS[p.aiStrategy].desc}
                  </p>
                </div>
              </div>
            ))}

            <button
              onClick={onTriggerAI}
              className="w-full py-2 rounded-xl bg-[rgba(124,92,255,0.15)] text-[#a78bff] text-2xs font-ui font-semibold border border-[rgba(124,92,255,0.3)] hover:bg-[rgba(124,92,255,0.25)] transition-colors"
            >
              🤖 Run AI turn now
            </button>
          </div>
        )}
      </div>

      {/* Explanation */}
      <div className="rounded-xl bg-rich-wood-mid p-3 space-y-1.5">
        <p className="text-[10px] font-ui font-semibold text-parchment-mid">
          How AI players work
        </p>
        {(
          Object.entries(AI_STRATEGY_LABELS) as [
            AIStrategy,
            (typeof AI_STRATEGY_LABELS)[AIStrategy],
          ][]
        ).map(([k, v]) => (
          <div key={k} className="flex gap-2">
            <span
              className="text-[10px] font-ui font-semibold w-20 shrink-0"
              style={{ color: v.color }}
            >
              {v.label}
            </span>
            <span className="text-[10px] font-ui text-soft-gray-dark">
              {v.desc}
            </span>
          </div>
        ))}
        <p className="text-[10px] text-soft-gray-dark font-ui pt-1">
          AI turns run automatically when you press "Next turn" if the current
          player is an AI. You can also trigger manually above.
        </p>
      </div>
    </div>
  );
}

// ── Main HUD ──────────────────────────────────────────────────────────────────

interface PlaytestHudProps {
  state: PlaytestState;
  pages: { id: string; name: string }[];
  rules: GameRule[];
  guide: GameGuide;
  onAddHuman: () => void;
  onAddAI: () => void;
  onRemovePlayer: (id: string) => void;
  onRenamePlayer: (id: string, name: string) => void;
  onBumpScore: (id: string, d: number) => void;
  onBumpCounter: (pid: string, key: string, d: number) => void;
  onNextTurn: () => void;
  onPrevTurn: () => void;
  onRoll: (sides: number) => void;
  onStart: () => void;
  onEnd: () => void;
  onGoToPage: (id: string) => void;
  onAddCounter: (label: string) => void;
  onBumpCustomCounter: (id: string, d: number) => void;
  onRemoveCounter: (id: string) => void;
  onStartTimer: () => void;
  onStopTimer: () => void;
  onResetTimer: () => void;
  onUpdatePlayer: (id: string, patch: Partial<Player>) => void;
  onTriggerAI: () => void;
}

export function PlaytestHud({
  state,
  pages,
  rules,
  guide,
  onAddHuman,
  onAddAI,
  onRemovePlayer,
  onRenamePlayer,
  onBumpScore,
  onBumpCounter,
  onNextTurn,
  onPrevTurn,
  onRoll,
  onStart,
  onEnd,
  onGoToPage,
  onAddCounter,
  onBumpCustomCounter,
  onRemoveCounter,
  onStartTimer,
  onStopTimer,
  onResetTimer,
  onUpdatePlayer,
  onTriggerAI,
}: PlaytestHudProps) {
  const [activeTab, setActiveTab] = useState<Tab>("players");
  // const newLogCount = state.log.filter((e) => e.kind !== "info").length;

  return (
    <aside className="w-72 shrink-0 bg-rich-wood-dark border-l border-warm-wood flex flex-col">
      {/* Tab bar */}
      <div className="flex border-b border-warm-wood shrink-0 overflow-x-auto scrollbar-none">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex-1 min-w-0 py-2 px-1 text-[11px] font-ui font-semibold whitespace-nowrap transition-colors border-b-2 ${
              activeTab === t.id
                ? "border-emerald-glow text-emerald-glow"
                : "border-transparent text-soft-gray hover:text-parchment-light"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {activeTab === "players" && (
          <PlayersTab
            state={state}
            pages={pages}
            onAddHuman={onAddHuman}
            onAddAI={onAddAI}
            onRemove={onRemovePlayer}
            onRename={onRenamePlayer}
            onBumpScore={onBumpScore}
            onBumpCounter={onBumpCounter}
            onNextTurn={onNextTurn}
            onPrevTurn={onPrevTurn}
            onRoll={onRoll}
            onStart={onStart}
            onEnd={onEnd}
          />
        )}
        {activeTab === "board" && (
          <BoardTab
            state={state}
            pages={pages}
            counters={state.customCounters}
            onGoToPage={onGoToPage}
            onAddCounter={onAddCounter}
            onBumpCustomCounter={onBumpCustomCounter}
            onRemoveCounter={onRemoveCounter}
            onStartTimer={onStartTimer}
            onStopTimer={onStopTimer}
            onResetTimer={onResetTimer}
          />
        )}
        {activeTab === "log" && <LogTab log={state.log} />}
        {activeTab === "rules" && <RulesTab rules={rules} guide={guide} />}
        {activeTab === "ai" && (
          <AITab
            players={state.players}
            onUpdatePlayer={onUpdatePlayer}
            onTriggerAI={onTriggerAI}
          />
        )}
      </div>
    </aside>
  );
}
