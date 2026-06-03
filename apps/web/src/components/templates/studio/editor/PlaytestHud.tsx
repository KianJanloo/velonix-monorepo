"use client";

import type { GameRule, GameGuide } from "../core";

export interface Player {
  id: string;
  name: string;
  color: string;
  score: number;
}

const DICE = [4, 6, 8, 10, 20];

interface PlaytestHudProps {
  players: Player[];
  turnIdx: number;
  round: number;
  log: string[];
  rules: GameRule[];
  guide: GameGuide;
  onAddPlayer: () => void;
  onRemovePlayer: (id: string) => void;
  onRenamePlayer: (id: string, name: string) => void;
  onBumpScore: (id: string, delta: number) => void;
  onNextTurn: () => void;
  onPrevTurn: () => void;
  onRoll: (sides: number) => void;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-warm-wood/60 p-3">
      <p className="text-2xs font-ui font-semibold text-soft-gray uppercase tracking-wider mb-2">
        {title}
      </p>
      {children}
    </div>
  );
}

export function PlaytestHud({
  players,
  turnIdx,
  round,
  log,
  rules,
  guide,
  onAddPlayer,
  onRemovePlayer,
  onRenamePlayer,
  onBumpScore,
  onNextTurn,
  onPrevTurn,
  onRoll,
}: PlaytestHudProps) {
  const current = players[turnIdx];
  const enabledRules = rules.filter((r) => r.enabled !== false);

  return (
    <aside className="w-72 shrink-0 bg-rich-wood-dark border-l border-warm-wood flex flex-col overflow-y-auto">
      {/* Turn tracker */}
      <Section title={`Turn · Round ${round}`}>
        <div className="flex items-center gap-2">
          <button
            onClick={onPrevTurn}
            className="px-2 py-1.5 rounded-lg border border-warm-wood text-soft-gray text-2xs font-ui hover:text-parchment-light"
          >
            ‹ Prev
          </button>
          <div
            className="flex-1 text-center py-1.5 rounded-lg font-ui font-bold text-sm truncate"
            style={{ backgroundColor: (current?.color ?? "#888") + "22", color: current?.color ?? "#ccc" }}
          >
            {current?.name ?? "—"}
          </div>
          <button
            onClick={onNextTurn}
            className="px-2 py-1.5 rounded-lg bg-emerald-glow text-deep-void text-2xs font-ui font-bold hover:bg-emerald-bright"
          >
            Next ›
          </button>
        </div>
      </Section>

      {/* Players + scores */}
      <Section title="Players">
        <div className="space-y-1.5">
          {players.map((p, i) => (
            <div
              key={p.id}
              className={`flex items-center gap-1.5 rounded-lg p-1 ${i === turnIdx ? "bg-warm-wood/50" : ""}`}
            >
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
              <input
                value={p.name}
                onChange={(e) => onRenamePlayer(p.id, e.target.value)}
                className="flex-1 min-w-0 bg-transparent text-xs font-ui text-parchment-light outline-none"
              />
              <button onClick={() => onBumpScore(p.id, -1)} className="w-5 h-5 rounded bg-warm-wood text-soft-gray text-xs leading-none hover:text-parchment-light">−</button>
              <span className="w-6 text-center text-xs font-mono text-parchment-light">{p.score}</span>
              <button onClick={() => onBumpScore(p.id, 1)} className="w-5 h-5 rounded bg-warm-wood text-soft-gray text-xs leading-none hover:text-parchment-light">+</button>
              {players.length > 1 && (
                <button onClick={() => onRemovePlayer(p.id)} className="text-soft-gray-dark hover:text-crimson-flame text-xs px-0.5" title="Remove">×</button>
              )}
            </div>
          ))}
        </div>
        <button
          onClick={onAddPlayer}
          className="mt-2 w-full py-1.5 rounded-lg border border-dashed border-warm-wood text-soft-gray text-2xs font-ui hover:text-parchment-light hover:border-warm-wood-light"
        >
          + Add player
        </button>
      </Section>

      {/* Dice */}
      <Section title="Dice">
        <div className="flex flex-wrap gap-1">
          {DICE.map((d) => (
            <button
              key={d}
              onClick={() => onRoll(d)}
              className="flex-1 min-w-[44px] py-1.5 rounded-lg bg-warm-wood/50 text-parchment-light text-2xs font-ui font-semibold hover:bg-warm-wood"
            >
              d{d}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-soft-gray-dark font-ui mt-1.5">
          Rolls for <span style={{ color: current?.color }}>{current?.name ?? "—"}</span>.
        </p>
      </Section>

      {/* Rules reference */}
      {(guide.objective || enabledRules.length > 0 || guide.scenarios.length > 0) && (
        <Section title="How to play">
          {guide.objective && (
            <p className="text-2xs font-ui text-parchment-mid mb-2 leading-relaxed">{guide.objective}</p>
          )}
          {enabledRules.length > 0 && (
            <ul className="space-y-1 mb-2">
              {enabledRules.map((r) => (
                <li key={r.id} className="text-[11px] font-ui text-soft-gray flex gap-1.5">
                  <span className="text-emerald-glow shrink-0">•</span>
                  <span>{r.description}</span>
                </li>
              ))}
            </ul>
          )}
          {guide.scenarios.length > 0 && (
            <div className="space-y-1">
              {guide.scenarios.map((s) => (
                <div key={s.id} className="text-[11px] font-ui">
                  <span className="text-parchment-light font-semibold">{s.name}</span>
                  <span className="text-soft-gray-dark"> · {s.players}p · {s.difficulty}</span>
                  {s.winCondition && <p className="text-soft-gray">Win: {s.winCondition}</p>}
                </div>
              ))}
            </div>
          )}
        </Section>
      )}

      {/* Activity log */}
      <Section title="Log">
        {log.length === 0 ? (
          <p className="text-[11px] text-soft-gray-dark font-ui">No actions yet.</p>
        ) : (
          <ul className="space-y-0.5 max-h-40 overflow-y-auto">
            {log.map((line, i) => (
              <li key={i} className="text-[11px] font-mono text-soft-gray">{line}</li>
            ))}
          </ul>
        )}
      </Section>
    </aside>
  );
}
