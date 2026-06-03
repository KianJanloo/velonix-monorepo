"use client";

import Link from "next/link";

import { useState } from "react";

import {
  RULE_TRIGGERS,
  RULE_TARGETS,
  RULE_ACTIONS,
  RULE_TEMPLATES,
  ruleActionDef,
  buildRuleDescription,
} from "../core";

import type {
  RuleTrigger,
  RuleActionType,
  RuleTarget,
  RuleParams,
  GameRule,
} from "../core";

import {
  Stepper,
} from "./controls";

export function RulesPanel({
  hasEngine,

  rules,

  onAdd,

  onUpdate,

  onDelete,
}: {
  hasEngine: boolean;

  rules: GameRule[];

  onAdd: (rule: Omit<GameRule, "id">) => void;

  onUpdate: (id: string, patch: Partial<GameRule>) => void;

  onDelete: (id: string) => void;
}) {
  const [trigger, setTrigger] = useState<RuleTrigger>("turn_start");

  const [action, setAction] = useState<RuleActionType>("draw_cards");

  const [amount, setAmount] = useState(1);

  const [target, setTarget] = useState<RuleTarget>("current");

  const [value, setValue] = useState("");

  const def = ruleActionDef(action)!;

  const triggerLabel = (t: RuleTrigger) =>
    RULE_TRIGGERS.find((x) => x.value === t)?.short ?? t;

  const draftParams: RuleParams = {
    ...(def.hasAmount ? { amount } : {}),

    ...(def.hasTarget ? { target } : {}),

    ...(def.hasValue ? { value } : {}),
  };

  const preview = buildRuleDescription(action, draftParams);

  const canAdd = !def.hasValue || value.trim().length > 0;

  function chooseAction(a: RuleActionType) {
    setAction(a);

    setAmount(ruleActionDef(a)?.defaultAmount ?? 1);
  }

  function add() {
    if (!canAdd) return;

    onAdd({
      trigger,

      action,

      params: draftParams,

      description: preview,

      enabled: true,
    });

    setValue("");
  }

  if (!hasEngine) {
    return (
      <div className="space-y-3">
        <p className="text-2xs font-ui font-semibold text-soft-gray uppercase tracking-wider">
          Rule Engine
        </p>

        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <div className="w-10 h-10 rounded-full bg-[rgba(245,196,81,0.1)] border border-royal-gold/30 flex items-center justify-center">
            <svg
              width="18"
              height="18"
              viewBox="0 0 18 18"
              fill="none"
              className="text-royal-gold"
            >
              <rect
                x="3"
                y="8"
                width="12"
                height="8"
                rx="1.5"
                stroke="currentColor"
                strokeWidth="1.5"
              />

              <path
                d="M6 8V5.5a3 3 0 016 0V8"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
          </div>

          <p className="text-2xs text-soft-gray font-ui leading-relaxed">
            The visual rule engine is available on{" "}
            <span className="text-royal-gold font-semibold">Pro</span> and{" "}
            <span className="text-royal-gold font-semibold">Studio</span>.
          </p>

          <Link
            href="/pricing"
            className="w-full py-2 rounded-lg bg-royal-gold/10 border border-royal-gold/30 text-royal-gold text-2xs font-ui font-semibold hover:bg-royal-gold/20"
          >
            Upgrade →
          </Link>
        </div>
      </div>
    );
  }

  const activeCount = rules.filter((r) => r.enabled !== false).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-2xs font-ui font-semibold text-soft-gray uppercase tracking-wider">
          Rule Engine
        </p>

        {rules.length > 0 && (
          <span className="text-[10px] text-soft-gray-dark font-ui">
            {activeCount}/{rules.length} active
          </span>
        )}
      </div>

      {/* Visual WHEN → THEN builder */}

      <div className="rounded-xl border border-warm-wood/50 bg-warm-wood/15 overflow-hidden">
        {/* WHEN */}

        <div className="p-2.5 border-b border-warm-wood/40">
          <span className="text-[10px] font-ui font-bold text-cyan-spark uppercase tracking-[0.12em]">
            When
          </span>

          <select
            className="v-input text-xs mt-1"
            value={trigger}
            onChange={(e) => setTrigger(e.target.value as RuleTrigger)}
          >
            {RULE_TRIGGERS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* THEN */}

        <div className="p-2.5 space-y-2">
          <span className="text-[10px] font-ui font-bold text-emerald-glow uppercase tracking-[0.12em]">
            Then
          </span>

          <select
            className="v-input text-xs"
            value={action}
            onChange={(e) => chooseAction(e.target.value as RuleActionType)}
          >
            {RULE_ACTIONS.map((a) => (
              <option key={a.type} value={a.type}>
                {a.label}
              </option>
            ))}
          </select>

          {(def.hasAmount || def.hasTarget) && (
            <div className="grid grid-cols-2 gap-2">
              {def.hasAmount && (
                <Stepper
                  label={def.amountLabel ?? "Amount"}
                  value={amount}
                  min={1}
                  max={99}
                  onChange={setAmount}
                />
              )}

              {def.hasTarget && (
                <label className="block">
                  <span className="text-2xs text-soft-gray-dark font-ui block mb-1">
                    Who
                  </span>

                  <select
                    className="v-input text-xs !py-2"
                    value={target}
                    onChange={(e) => setTarget(e.target.value as RuleTarget)}
                  >
                    {RULE_TARGETS.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>
          )}

          {def.hasValue && (
            <input
              className="v-input text-xs"
              placeholder={def.valuePlaceholder}
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
          )}
        </div>

        {/* Live preview */}

        <div className="px-2.5 pb-2.5">
          <div className="rounded-lg bg-deep-void/60 border border-warm-wood/40 px-2.5 py-2">
            <p className="text-[10px] text-soft-gray-dark font-ui uppercase tracking-wider mb-0.5">
              Preview
            </p>

            <p className="text-2xs text-parchment-light font-ui leading-relaxed">
              <span className="text-cyan-spark font-semibold">
                {triggerLabel(trigger)}:{" "}
              </span>

              {preview}
            </p>
          </div>

          <button
            onClick={add}
            disabled={!canAdd}
            className="w-full mt-2 py-2 rounded-lg bg-emerald-ghost border border-emerald-glow/20 text-emerald-glow text-2xs font-ui font-semibold hover:bg-emerald-glow hover:text-deep-void transition-all disabled:opacity-40"
          >
            + Add Rule
          </button>
        </div>
      </div>

      {/* Starter templates */}

      {rules.length === 0 && (
        <div>
          <p className="text-[10px] text-soft-gray-dark font-ui uppercase tracking-[0.1em] mb-1.5">
            Quick templates
          </p>

          <div className="flex flex-wrap gap-1.5">
            {RULE_TEMPLATES.map((t) => (
              <button
                key={t.label}
                onClick={() =>
                  onAdd({
                    trigger: t.trigger,

                    action: t.action,

                    params: t.params,

                    description: buildRuleDescription(t.action, t.params),

                    enabled: true,
                  })
                }
                className="px-2 py-1 rounded-md text-[10px] font-ui font-semibold bg-warm-wood/40 text-soft-gray hover:text-parchment-light hover:bg-warm-wood"
              >
                + {t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Rules list */}

      {rules.length === 0 ? (
        <p className="text-2xs text-soft-gray-dark font-ui text-center py-2">
          No rules yet. Build one above.
        </p>
      ) : (
        <div className="space-y-2">
          {rules.map((rule, idx) => {
            const enabled = rule.enabled !== false;

            return (
              <div
                key={rule.id}
                className={`rounded-lg border group transition-colors ${enabled ? "border-warm-wood" : "border-warm-wood/40 opacity-55"}`}
              >
                <div className="flex items-center gap-1.5 px-2.5 pt-2">
                  <div className="flex items-center gap-1 min-w-0 flex-1">
                    <span className="text-[10px] font-ui font-bold text-cyan-spark bg-[rgba(0,229,255,0.1)] px-1.5 py-0.5 rounded shrink-0">
                      {triggerLabel(rule.trigger)}
                    </span>

                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 12 12"
                      fill="none"
                      className="text-soft-gray-dark shrink-0"
                    >
                      <path
                        d="M2 6h7M6.5 3l3 3-3 3"
                        stroke="currentColor"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>

                    {rule.action && (
                      <span className="text-[10px] font-ui font-semibold text-emerald-glow bg-emerald-ghost px-1.5 py-0.5 rounded truncate min-w-0">
                        {ruleActionDef(rule.action)?.label ?? rule.action}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      title={enabled ? "Disable" : "Enable"}
                      onClick={() => onUpdate(rule.id, { enabled: !enabled })}
                      className={`relative w-7 h-4 rounded-full transition-colors shrink-0 ${enabled ? "bg-emerald-glow" : "bg-warm-wood"}`}
                    >
                      <span
                        className={`absolute top-0.5 w-3 h-3 rounded-full bg-deep-void transition-all ${enabled ? "left-3.5" : "left-0.5"}`}
                      />
                    </button>

                    <button
                      title="Duplicate"
                      onClick={() => onAdd({ ...rule })}
                      className="p-1 rounded text-soft-gray-dark hover:text-parchment-light hover:bg-warm-wood-light opacity-60 group-hover:opacity-100 transition-opacity"
                    >
                      <svg
                        width="11"
                        height="11"
                        viewBox="0 0 12 12"
                        fill="none"
                      >
                        <rect
                          x="3.5"
                          y="3.5"
                          width="6"
                          height="6"
                          rx="1"
                          stroke="currentColor"
                          strokeWidth="1.1"
                        />

                        <path
                          d="M2.5 8V2.5h5.5"
                          stroke="currentColor"
                          strokeWidth="1.1"
                        />
                      </svg>
                    </button>

                    <button
                      title="Delete"
                      onClick={() => onDelete(rule.id)}
                      className="p-1 rounded text-soft-gray-dark hover:text-crimson-flame hover:bg-crimson-flame/10 opacity-60 group-hover:opacity-100 transition-opacity"
                    >
                      <svg
                        width="11"
                        height="11"
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
                  </div>
                </div>

                <textarea
                  className="w-full bg-transparent text-2xs text-parchment-mid font-ui resize-none outline-none px-2.5 pb-2 pt-1.5 leading-relaxed"
                  rows={2}
                  value={rule.description}
                  placeholder="Describe what happens…"
                  onChange={(e) =>
                    onUpdate(rule.id, { description: e.target.value })
                  }
                />

                {idx === rules.length - 1 && (
                  <div className="px-2.5 pb-1.5 text-[10px] text-soft-gray-dark font-ui">
                    Edit the text to fine-tune wording.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

