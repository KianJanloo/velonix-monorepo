"use client";

import { useState } from "react";

import { SCENARIO_DIFFICULTY } from "../core";

import type {
  ScenarioDifficulty,
  GameScenario,
  GameGuide,
} from "../core";

/** Editable ordered list of short text steps. */

function StepList({
  label,

  items,

  placeholder,

  readOnly,

  onChange,
}: {
  label: string;

  items: string[];

  placeholder: string;

  readOnly: boolean;

  onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  const add = () => {
    if (draft.trim()) {
      onChange([...items, draft.trim()]);

      setDraft("");
    }
  };

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;

    if (j < 0 || j >= items.length) return;

    const next = [...items];

    [next[i], next[j]] = [next[j]!, next[i]!];

    onChange(next);
  };

  return (
    <div>
      <p className="text-2xs font-ui font-semibold text-soft-gray uppercase tracking-wider mb-2">
        {label}
      </p>

      <ol className="space-y-1.5 mb-2">
        {items.map((step, i) => (
          <li key={i} className="flex items-start gap-2 group">
            <span className="w-5 h-5 rounded-full bg-warm-wood/50 text-emerald-glow text-[10px] font-ui font-bold flex items-center justify-center shrink-0 mt-0.5">
              {i + 1}
            </span>

            <input
              value={step}
              disabled={readOnly}
              onChange={(e) => {
                const n = [...items];

                n[i] = e.target.value;

                onChange(n);
              }}
              className="v-input text-xs flex-1 disabled:opacity-70"
            />

            {!readOnly && (
              <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity mt-1">
                <button
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  className="p-0.5 text-soft-gray-dark hover:text-parchment-light disabled:opacity-25"
                >
                  ↑
                </button>

                <button
                  onClick={() => move(i, 1)}
                  disabled={i === items.length - 1}
                  className="p-0.5 text-soft-gray-dark hover:text-parchment-light disabled:opacity-25"
                >
                  ↓
                </button>

                <button
                  onClick={() => onChange(items.filter((_, k) => k !== i))}
                  className="p-0.5 text-soft-gray-dark hover:text-crimson-flame"
                >
                  ✕
                </button>
              </div>
            )}
          </li>
        ))}

        {items.length === 0 && (
          <li className="text-2xs text-soft-gray-dark font-ui pl-7">
            Nothing yet.
          </li>
        )}
      </ol>

      {!readOnly && (
        <div className="flex gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") add();
            }}
            placeholder={placeholder}
            className="v-input text-xs flex-1"
          />

          <button
            onClick={add}
            disabled={!draft.trim()}
            className="px-3 rounded-lg bg-warm-wood/50 text-soft-gray text-2xs font-ui hover:text-parchment-light hover:bg-warm-wood disabled:opacity-40"
          >
            Add
          </button>
        </div>
      )}
    </div>
  );
}

export function GuideDialog({
  guide,

  readOnly,

  onChange,

  onClose,
}: {
  guide: GameGuide;

  readOnly: boolean;

  onChange: (g: GameGuide) => void;

  onClose: () => void;
}) {
  const patch = (p: Partial<GameGuide>) => onChange({ ...guide, ...p });

  const addScenario = () =>
    patch({
      scenarios: [
        ...guide.scenarios,

        {
          id: `scn-${Date.now()}`,

          name: `Scenario ${guide.scenarios.length + 1}`,

          description: "",

          players: "2–4",

          difficulty: "standard",

          winCondition: "",
        },
      ],
    });

  const updateScenario = (id: string, p: Partial<GameScenario>) =>
    patch({
      scenarios: guide.scenarios.map((s) => (s.id === id ? { ...s, ...p } : s)),
    });

  const removeScenario = (id: string) =>
    patch({ scenarios: guide.scenarios.filter((s) => s.id !== id) });

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="v-card w-full max-w-2xl p-6 max-h-[88vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-1">
          <h2 className="font-display text-lg font-bold text-parchment-light">
            Rule guide & scenarios
          </h2>

          <button
            onClick={onClose}
            className="text-soft-gray hover:text-parchment-light p-1 -mr-1"
            title="Close"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M3 3l10 10M13 3L3 13"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <p className="text-2xs text-soft-gray font-ui mb-5">
          A how-to-play guide shown on your game&apos;s marketplace page.{" "}
          {readOnly && <span className="text-royal-gold">View only.</span>}
        </p>

        <div className="space-y-6">
          {/* Objective */}

          <div>
            <p className="text-2xs font-ui font-semibold text-soft-gray uppercase tracking-wider mb-2">
              Objective
            </p>

            <textarea
              value={guide.objective}
              disabled={readOnly}
              onChange={(e) => patch({ objective: e.target.value })}
              placeholder="In one or two sentences, how do you win?"
              className="v-input text-xs resize-none h-16 disabled:opacity-70"
            />
          </div>

          <StepList
            label="Setup"
            items={guide.setupSteps}
            placeholder="Add a setup step…"
            readOnly={readOnly}
            onChange={(setupSteps) => patch({ setupSteps })}
          />

          <StepList
            label="Turn structure"
            items={guide.turnStructure}
            placeholder="Add a phase…"
            readOnly={readOnly}
            onChange={(turnStructure) => patch({ turnStructure })}
          />

          {/* Scenarios */}

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-2xs font-ui font-semibold text-soft-gray uppercase tracking-wider">
                Scenarios & variants
              </p>

              {!readOnly && (
                <button
                  onClick={addScenario}
                  className="text-2xs font-ui text-emerald-glow hover:underline"
                >
                  + Add scenario
                </button>
              )}
            </div>

            {guide.scenarios.length === 0 ? (
              <p className="text-2xs text-soft-gray-dark font-ui">
                No scenarios yet. Add variants like a 2-player short game or an
                advanced mode.
              </p>
            ) : (
              <div className="space-y-3">
                {guide.scenarios.map((s) => (
                  <div
                    key={s.id}
                    className="rounded-lg border border-warm-wood p-3 space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        value={s.name}
                        disabled={readOnly}
                        onChange={(e) =>
                          updateScenario(s.id, { name: e.target.value })
                        }
                        className="v-input text-xs font-semibold flex-1 disabled:opacity-70"
                        placeholder="Scenario name"
                      />

                      {!readOnly && (
                        <button
                          onClick={() => removeScenario(s.id)}
                          className="p-1 text-soft-gray-dark hover:text-crimson-flame shrink-0"
                          title="Remove scenario"
                        >
                          <svg
                            width="13"
                            height="13"
                            viewBox="0 0 12 12"
                            fill="none"
                          >
                            <path
                              d="M2.5 3.5h7M5 3.5V2.5h2v1M3.5 3.5l.4 6h4.2l.4-6"
                              stroke="currentColor"
                              strokeWidth="1"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <label className="block">
                        <span className="text-[10px] text-soft-gray-dark font-ui block mb-1">
                          Players
                        </span>

                        <input
                          value={s.players}
                          disabled={readOnly}
                          onChange={(e) =>
                            updateScenario(s.id, { players: e.target.value })
                          }
                          className="v-input text-xs disabled:opacity-70"
                          placeholder="2–4"
                        />
                      </label>

                      <label className="block">
                        <span className="text-[10px] text-soft-gray-dark font-ui block mb-1">
                          Difficulty
                        </span>

                        <select
                          value={s.difficulty}
                          disabled={readOnly}
                          onChange={(e) =>
                            updateScenario(s.id, {
                              difficulty: e.target.value as ScenarioDifficulty,
                            })
                          }
                          className="v-input text-xs disabled:opacity-70"
                        >
                          {SCENARIO_DIFFICULTY.map((d) => (
                            <option key={d.value} value={d.value}>
                              {d.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    <textarea
                      value={s.description}
                      disabled={readOnly}
                      onChange={(e) =>
                        updateScenario(s.id, { description: e.target.value })
                      }
                      placeholder="How this scenario differs / its setup."
                      className="v-input text-xs resize-none h-14 disabled:opacity-70"
                    />

                    <input
                      value={s.winCondition}
                      disabled={readOnly}
                      onChange={(e) =>
                        updateScenario(s.id, { winCondition: e.target.value })
                      }
                      placeholder="Win condition"
                      className="v-input text-xs disabled:opacity-70"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-emerald-glow text-deep-void text-2xs font-ui font-bold hover:bg-emerald-bright"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}


