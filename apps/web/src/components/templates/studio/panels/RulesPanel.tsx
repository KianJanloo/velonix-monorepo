"use client";

import { useState, useCallback } from "react";
import Link from "next/link";

import {
  RULE_TRIGGERS,
  RULE_TARGETS,
  RULE_ACTIONS,
  RULE_TEMPLATES,
  RULE_CONDITION_SUBJECTS,
  RULE_CONDITION_OPERATORS,
  ruleActionDef,
  buildRuleDescription,
} from "../core";

import type {
  RuleTrigger,
  RuleActionType,
  RuleTarget,
  // RuleParamss,
  GameRule,
  RuleCondition,
  RuleConditionSubject,
  RuleConditionOperator,
  RuleAction,
} from "../core";

import {
  // Stepper,
  SectionLabel,
} from "./controls";

// ── Helpers ───────────────────────────────────────────────────────────────────

let _id = 0;
const uid = () => `rc-${++_id}-${Date.now()}`;

function blankCondition(): RuleCondition {
  return {
    id: uid(),
    subject: "score",
    operator: "gte",
    value: 0,
    negate: false,
  };
}

function blankAction(): RuleAction {
  return { id: uid(), type: "gain_points", target: "current", amount: 1 };
}

// ── Condition row ─────────────────────────────────────────────────────────────

function ConditionRow({
  c,
  onChange,
  onDelete,
}: {
  c: RuleCondition;
  onChange: (patch: Partial<RuleCondition>) => void;
  onDelete: () => void;
}) {
  const op = RULE_CONDITION_OPERATORS.find((o) => o.value === c.operator);
  const needsBetween = c.operator === "between";

  return (
    <div className="group flex flex-col gap-1.5 p-2 rounded-lg bg-rich-wood-mid border border-warm-wood/40">
      {/* Subject + Negate row */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onChange({ negate: !c.negate })}
          title={c.negate ? "NOT (click to remove)" : "Add NOT"}
          className={`text-[10px] font-mono px-1.5 py-0.5 rounded border transition-colors ${
            c.negate
              ? "border-crimson-flame/60 text-crimson-flame bg-crimson-ghost"
              : "border-warm-wood text-soft-gray-dark hover:border-soft-gray"
          }`}
        >
          NOT
        </button>
        <select
          value={c.subject}
          onChange={(e) =>
            onChange({ subject: e.target.value as RuleConditionSubject })
          }
          className="flex-1 bg-rich-wood-dark border border-warm-wood rounded px-1.5 py-1 text-2xs text-parchment-light font-ui outline-none focus:border-emerald-glow"
        >
          {RULE_CONDITION_SUBJECTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        {c.subject === "counter" && (
          <input
            value={c.counterKey ?? ""}
            onChange={(e) => onChange({ counterKey: e.target.value })}
            placeholder="counter key"
            className="w-20 bg-rich-wood-dark border border-warm-wood rounded px-1.5 py-1 text-2xs font-mono text-parchment-light outline-none focus:border-emerald-glow"
          />
        )}
        <button
          onClick={onDelete}
          className="opacity-0 group-hover:opacity-100 text-soft-gray-dark hover:text-crimson-flame transition-opacity text-xs px-0.5"
        >
          ×
        </button>
      </div>

      {/* Operator + Value row */}
      <div className="flex items-center gap-1.5">
        <select
          value={c.operator}
          onChange={(e) =>
            onChange({ operator: e.target.value as RuleConditionOperator })
          }
          className="flex-1 bg-rich-wood-dark border border-warm-wood rounded px-1.5 py-1 text-2xs text-parchment-light font-ui outline-none focus:border-emerald-glow"
        >
          {RULE_CONDITION_OPERATORS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.symbol} {o.label}
            </option>
          ))}
        </select>
        <input
          type="number"
          value={c.value}
          onChange={(e) => onChange({ value: Number(e.target.value) })}
          className="w-16 bg-rich-wood-dark border border-warm-wood rounded px-1.5 py-1 text-2xs font-mono text-parchment-light outline-none focus:border-emerald-glow text-center"
        />
        {needsBetween && (
          <>
            <span className="text-soft-gray-dark text-[10px]">and</span>
            <input
              type="number"
              value={c.value2 ?? 0}
              onChange={(e) => onChange({ value2: Number(e.target.value) })}
              className="w-16 bg-rich-wood-dark border border-warm-wood rounded px-1.5 py-1 text-2xs font-mono text-parchment-light outline-none focus:border-emerald-glow text-center"
            />
          </>
        )}
      </div>

      {/* Human-readable preview */}
      <p className="text-[10px] text-soft-gray-dark font-ui italic">
        {c.negate ? "NOT " : ""}
        {RULE_CONDITION_SUBJECTS.find((s) => s.value === c.subject)?.label}{" "}
        {op?.label} {c.value}
        {needsBetween ? ` and ${c.value2 ?? 0}` : ""}
      </p>
    </div>
  );
}

// ── Action row ────────────────────────────────────────────────────────────────

function ActionRow({
  a,
  onChange,
  onDelete,
  pages,
}: {
  a: RuleAction;
  onChange: (patch: Partial<RuleAction>) => void;
  onDelete: () => void;
  pages?: { id: string; name: string }[];
}) {
  const def = ruleActionDef(a.type);

  return (
    <div className="group flex flex-col gap-1.5 p-2 rounded-lg bg-[rgba(61,220,151,0.05)] border border-emerald-glow/20">
      {/* Action type */}
      <div className="flex items-center gap-1.5">
        <span className="text-emerald-glow text-[10px] font-ui font-semibold shrink-0">
          THEN
        </span>
        <select
          value={a.type}
          onChange={(e) => onChange({ type: e.target.value as RuleActionType })}
          className="flex-1 bg-rich-wood-dark border border-warm-wood rounded px-1.5 py-1 text-2xs text-parchment-light font-ui outline-none focus:border-emerald-glow"
        >
          {RULE_ACTIONS.map((r) => (
            <option key={r.type} value={r.type}>
              {r.label}
            </option>
          ))}
        </select>
        <button
          onClick={onDelete}
          className="opacity-0 group-hover:opacity-100 text-soft-gray-dark hover:text-crimson-flame transition-opacity text-xs px-0.5"
        >
          ×
        </button>
      </div>

      {/* Target */}
      {def?.hasTarget && (
        <select
          value={a.target ?? "current"}
          onChange={(e) => onChange({ target: e.target.value as RuleTarget })}
          className="w-full bg-rich-wood-dark border border-warm-wood rounded px-1.5 py-1 text-2xs text-parchment-light font-ui outline-none focus:border-emerald-glow"
        >
          {RULE_TARGETS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      )}

      {/* Amount */}
      {def?.hasAmount && (
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-soft-gray-dark font-ui shrink-0">
            {def.amountLabel ?? "Amount"}
          </span>
          <input
            type="number"
            value={a.amount ?? 1}
            min={0}
            onChange={(e) => onChange({ amount: Number(e.target.value) })}
            className="w-16 bg-rich-wood-dark border border-warm-wood rounded px-1.5 py-1 text-2xs font-mono text-parchment-light outline-none focus:border-emerald-glow text-center"
          />
        </div>
      )}

      {/* Page link for navigate_page */}
      {a.type === "navigate_page" && pages && pages.length > 0 && (
        <select
          value={a.pageId ?? ""}
          onChange={(e) =>
            onChange({
              pageId: e.target.value,
              value: pages.find((p) => p.id === e.target.value)?.name!,
            })
          }
          className="w-full bg-rich-wood-dark border border-warm-wood rounded px-1.5 py-1 text-2xs text-parchment-light font-ui outline-none focus:border-emerald-glow"
        >
          <option value="">— Select page —</option>
          {pages.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      )}

      {/* Value string */}
      {def?.hasValue && a.type !== "navigate_page" && (
        <input
          value={a.value ?? ""}
          onChange={(e) => onChange({ value: e.target.value })}
          placeholder={def.valuePlaceholder ?? "Value…"}
          className="w-full bg-rich-wood-dark border border-warm-wood rounded px-1.5 py-1 text-2xs font-ui text-parchment-light outline-none focus:border-emerald-glow"
        />
      )}

      {/* Counter key for set_counter */}
      {a.type === "set_counter" && (
        <input
          value={a.counterKey ?? ""}
          onChange={(e) => onChange({ counterKey: e.target.value })}
          placeholder="Counter name"
          className="w-full bg-rich-wood-dark border border-warm-wood rounded px-1.5 py-1 text-2xs font-mono text-parchment-light outline-none focus:border-emerald-glow"
        />
      )}
    </div>
  );
}

// ── Rule card ─────────────────────────────────────────────────────────────────

function RuleCard({
  rule,
  expanded,
  onToggleExpand,
  onUpdate,
  onDelete,
  onDuplicate,
  pages,
}: {
  rule: GameRule;
  expanded: boolean;
  onToggleExpand: () => void;
  onUpdate: (patch: Partial<GameRule>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  pages?: { id: string; name: string }[];
}) {
  const enabled = rule.enabled !== false;
  const trigger = RULE_TRIGGERS.find((t) => t.value === rule.trigger);
  const conditions = rule.conditions ?? [];
  const actions = rule.actions ?? [];

  const addCondition = () =>
    onUpdate({ conditions: [...conditions, blankCondition()] });
  const updateCondition = (id: string, patch: Partial<RuleCondition>) =>
    onUpdate({
      conditions: conditions.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    });
  const deleteCondition = (id: string) =>
    onUpdate({ conditions: conditions.filter((c) => c.id !== id) });

  const addAction = () => onUpdate({ actions: [...actions, blankAction()] });
  const updateAction = (id: string, patch: Partial<RuleAction>) =>
    onUpdate({
      actions: actions.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    });
  const deleteAction = (id: string) =>
    onUpdate({ actions: actions.filter((a) => a.id !== id) });

  return (
    <div
      className={`rounded-xl border transition-colors ${
        enabled
          ? "border-warm-wood/60 bg-warm-wood/10"
          : "border-warm-wood/25 bg-transparent opacity-55"
      }`}
    >
      {/* Header */}
      <div className="flex flex-col items-center gap-2 px-2.5 py-2">
        {/* Trigger badge */}
        <button
          onClick={onToggleExpand}
          className="flex items-center gap-1 min-w-0 flex-1"
        >
          <span className="text-[11px] shrink-0">{trigger?.icon ?? "⚡"}</span>
          <span className="text-[10px] font-ui font-semibold text-royal-gold uppercase tracking-wider shrink-0">
            {trigger?.short ?? rule.trigger}
          </span>
          {conditions.length > 0 && (
            <span className="text-[10px] font-ui text-soft-gray-dark shrink-0">
              · {conditions.length} cond{conditions.length > 1 ? "s" : ""}
            </span>
          )}
          {actions.length > 0 && (
            <span className="ml-auto text-[10px] font-ui text-emerald-glow/70 shrink-0">
              {actions.length} action{actions.length > 1 ? "s" : ""}
            </span>
          )}
        </button>

        {/* Enable toggle */}
        <div className="flex gap-2 w-full py-2">
          {/* Priority badge */}
          <span className="text-[10px] font-mono text-soft-gray-dark shrink-0">
            #{rule.priority ?? 50}
          </span>
          <button
            title={enabled ? "Disable" : "Enable"}
            onClick={() => onUpdate({ enabled: !enabled })}
            className={`relative w-7 h-4 rounded-full transition-colors shrink-0 ${enabled ? "bg-emerald-glow" : "bg-warm-wood"}`}
          >
            <span
              className={`absolute top-0.5 w-3 h-3 rounded-full bg-deep-void transition-all ${enabled ? "left-3.5" : "left-0.5"}`}
            />
          </button>

          {/* Duplicate */}
          <button
            onClick={onDuplicate}
            className="p-1 rounded text-soft-gray-dark hover:text-parchment-light hover:bg-warm-wood opacity-60 hover:opacity-100 transition-opacity"
            title="Duplicate"
          >
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
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

          {/* Delete */}
          <button
            onClick={onDelete}
            className="p-1 rounded text-soft-gray-dark hover:text-crimson-flame hover:bg-crimson-flame/10 opacity-60 hover:opacity-100 transition-opacity"
            title="Delete"
          >
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
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

      {/* Description */}
      <div className="px-2.5 pb-2">
        <textarea
          rows={2}
          value={rule.description}
          onChange={(e) => onUpdate({ description: e.target.value })}
          placeholder="Describe what this rule does…"
          className="w-full bg-transparent text-2xs text-parchment-mid font-ui resize-none outline-none leading-relaxed placeholder-soft-gray-dark"
        />
      </div>

      {/* Expanded editor */}
      {expanded && (
        <div className="border-t border-warm-wood/40 px-2.5 py-3 space-y-3">
          {/* Trigger + Priority */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-[10px] font-ui text-soft-gray-dark mb-1">
                Trigger
              </p>
              <select
                value={rule.trigger}
                onChange={(e) =>
                  onUpdate({ trigger: e.target.value as RuleTrigger })
                }
                className="w-full bg-rich-wood-dark border border-warm-wood rounded px-1.5 py-1.5 text-2xs text-parchment-light font-ui outline-none focus:border-emerald-glow"
              >
                {RULE_TRIGGERS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.icon} {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <p className="text-[10px] font-ui text-soft-gray-dark mb-1">
                Priority (0=first)
              </p>
              <input
                type="number"
                value={rule.priority ?? 50}
                min={0}
                max={999}
                onChange={(e) => onUpdate({ priority: Number(e.target.value) })}
                className="w-full bg-rich-wood-dark border border-warm-wood rounded px-1.5 py-1.5 text-2xs font-mono text-parchment-light outline-none focus:border-emerald-glow"
              />
            </div>
          </div>

          {/* Conditions */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[10px] font-ui font-semibold text-soft-gray uppercase tracking-wider">
                IF (all must pass)
              </p>
              <button
                onClick={addCondition}
                className="text-[10px] font-ui text-emerald-glow hover:text-emerald-bright px-1.5 py-0.5 rounded hover:bg-emerald-ghost transition-colors"
              >
                + Condition
              </button>
            </div>
            {conditions.length === 0 ? (
              <p className="text-[10px] text-soft-gray-dark font-ui italic">
                No conditions — rule always fires on trigger
              </p>
            ) : (
              <div className="space-y-1.5">
                {conditions.map((c, i) => (
                  <div key={c.id}>
                    {i > 0 && (
                      <p className="text-[10px] text-royal-gold/70 font-ui font-semibold text-center py-0.5">
                        AND
                      </p>
                    )}
                    <ConditionRow
                      c={c}
                      onChange={(patch) => updateCondition(c.id, patch)}
                      onDelete={() => deleteCondition(c.id)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[10px] font-ui font-semibold text-soft-gray uppercase tracking-wider">
                THEN (run in order)
              </p>
              <button
                onClick={addAction}
                className="text-[10px] font-ui text-emerald-glow hover:text-emerald-bright px-1.5 py-0.5 rounded hover:bg-emerald-ghost transition-colors"
              >
                + Action
              </button>
            </div>
            {actions.length === 0 ? (
              <p className="text-[10px] text-soft-gray-dark font-ui italic">
                No actions — add at least one
              </p>
            ) : (
              <div className="space-y-1.5">
                {actions.map((a) => (
                  <ActionRow
                    key={a.id}
                    a={a}
                    onChange={(patch) => updateAction(a.id, patch)}
                    onDelete={() => deleteAction(a.id)}
                    pages={pages!}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────

export function RulesPanel({
  hasEngine,
  rules,
  onAdd,
  onUpdate,
  onDelete,
  pages,
}: {
  hasEngine: boolean;
  rules: GameRule[];
  onAdd: (rule: Omit<GameRule, "id">) => void;
  onUpdate: (id: string, patch: Partial<GameRule>) => void;
  onDelete: (id: string) => void;
  pages?: { id: string; name: string }[];
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterTrigger, setFilterTrigger] = useState<RuleTrigger | "all">(
    "all",
  );

  const toggleExpand = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  const addFromTemplate = (tpl: (typeof RULE_TEMPLATES)[number]) => {
    const conditions: RuleCondition[] = (tpl.conditions ?? []).map((c) => ({
      ...c,
      id: uid(),
    }));
    const actions: RuleAction[] = [
      {
        id: uid(),
        type: tpl.action,
        target: tpl.params.target ?? "current",
        amount: tpl.params.amount ?? 1,
        value: tpl.params.value!,
      },
    ];
    onAdd({
      trigger: tpl.trigger,
      description: buildRuleDescription(tpl.action, tpl.params),
      priority: 50,
      conditions,
      actions,
      action: tpl.action,
      params: tpl.params,
      enabled: true,
    });
  };

  const addBlank = () => {
    onAdd({
      trigger: "turn_start",
      description: "",
      priority: 50,
      conditions: [],
      actions: [blankAction()],
      enabled: true,
    });
  };

  const filteredRules =
    filterTrigger === "all"
      ? rules
      : rules.filter((r) => r.trigger === filterTrigger);

  const sortedRules = [...filteredRules].sort(
    (a, b) => (a.priority ?? 50) - (b.priority ?? 50),
  );

  return (
    <div className="p-3 space-y-4">
      {/* Engine gate */}
      {!hasEngine && (
        <div className="rounded-xl bg-[rgba(245,196,81,0.08)] border border-[rgba(245,196,81,0.3)] p-3">
          <p className="text-2xs font-ui text-royal-gold font-semibold mb-1">
            Rule Engine — Pro
          </p>
          <p className="text-[10px] text-soft-gray font-ui mb-2">
            Upgrade to run rules automatically in playtest with full condition
            evaluation.
          </p>
          <Link
            href="/pricing"
            className="text-[10px] font-ui font-bold text-royal-gold hover:text-parchment-light transition-colors"
          >
            Upgrade →
          </Link>
        </div>
      )}

      {/* Templates */}
      <div>
        <SectionLabel>Quick-add templates</SectionLabel>
        <div className="grid grid-cols-1 gap-1">
          {RULE_TEMPLATES.map((tpl) => (
            <button
              key={tpl.label}
              onClick={() => addFromTemplate(tpl)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-dashed border-warm-wood/60 text-left hover:border-emerald-glow/40 hover:bg-warm-wood/20 transition-colors group"
            >
              <span className="text-[11px]">
                {RULE_TRIGGERS.find((t) => t.value === tpl.trigger)?.icon}
              </span>
              <span className="text-2xs font-ui text-soft-gray group-hover:text-parchment-light flex-1">
                {tpl.label}
              </span>
              <span className="text-[10px] font-ui text-emerald-glow opacity-0 group-hover:opacity-100 transition-opacity">
                + Add
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="h-px bg-warm-wood/40" />

      {/* Filter + Add */}
      <div className="flex items-center gap-2">
        <select
          value={filterTrigger}
          onChange={(e) =>
            setFilterTrigger(e.target.value as RuleTrigger | "all")
          }
          className="flex-1 bg-rich-wood-mid border border-warm-wood rounded-lg px-2 py-1.5 text-2xs text-parchment-light font-ui outline-none focus:border-emerald-glow"
        >
          <option value="all">All triggers ({rules.length})</option>
          {RULE_TRIGGERS.map((t) => {
            const count = rules.filter((r) => r.trigger === t.value).length;
            return (
              <option key={t.value} value={t.value}>
                {t.icon} {t.short} ({count})
              </option>
            );
          })}
        </select>
        <button
          onClick={addBlank}
          className="px-3 py-1.5 rounded-lg bg-emerald-glow text-deep-void text-2xs font-ui font-bold hover:bg-emerald-bright transition-colors shrink-0"
        >
          + Rule
        </button>
      </div>

      {/* Rule list */}
      {sortedRules.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-soft-gray-dark text-2xs font-ui">
            {filterTrigger === "all"
              ? "No rules yet. Add one above or use a template."
              : "No rules for this trigger."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {sortedRules.map((rule) => (
            <RuleCard
              key={rule.id}
              rule={rule}
              expanded={expandedId === rule.id}
              onToggleExpand={() => toggleExpand(rule.id)}
              onUpdate={(patch) => onUpdate(rule.id, patch)}
              onDelete={() => onDelete(rule.id)}
              onDuplicate={() =>
                onAdd({ ...rule, priority: (rule.priority ?? 50) + 1 })
              }
              pages={pages!}
            />
          ))}
        </div>
      )}

      {rules.length > 0 && (
        <p className="text-[10px] text-soft-gray-dark font-ui text-center">
          {rules.filter((r) => r.enabled !== false).length}/{rules.length} rules
          active · sorted by priority
        </p>
      )}
    </div>
  );
}
