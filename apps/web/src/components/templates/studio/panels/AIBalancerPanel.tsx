"use client";

import { useState, useCallback, useRef } from "react";
import type { CanvasComp, GameRule, GameGuide } from "../core";

// ── Types ─────────────────────────────────────────────────────────────────────

interface BalanceIssue {
  severity: "critical" | "warning" | "info";
  category: string;
  title: string;
  detail: string;
}

interface BalanceAnalysis {
  difficultyScore: number;     // 1–10
  complexityScore: number;     // 1–10
  balanceScore: number;        // 1–10 (10 = well balanced)
  replayabilityScore: number;  // 1–10
  playerCountRating: string;   // e.g. "Best 2–4"
  estimatedPlaytime: string;   // e.g. "45–75 min"
  issues: BalanceIssue[];
  suggestions: string[];
  strengths: string[];
  summary: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildGameSummary(
  components: CanvasComp[],
  rules: GameRule[],
  guide: GameGuide,
  pages: { id: string; name: string; components: CanvasComp[] }[],
): string {
  const typeCount: Record<string, number> = {};
  for (const c of components) {
    typeCount[c.type] = (typeCount[c.type] ?? 0) + 1;
  }

  const compSummary = Object.entries(typeCount)
    .map(([t, n]) => `${n}× ${t}`)
    .join(", ");

  const ruleSummary = rules
    .filter((r) => r.enabled !== false)
    .slice(0, 12)
    .map((r) => `• [${r.trigger}] ${r.description}`)
    .join("\n");

  const linkedComponents = components.filter((c) => c.linkToPageId).length;

  return `
GAME DESIGN SUMMARY
===================
Pages: ${pages.length} (${pages.map((p) => p.name).join(", ")})
Total components: ${components.length}
Component breakdown: ${compSummary || "none"}
Page-linked components: ${linkedComponents}

OBJECTIVE: ${guide.objective || "Not specified"}

ACTIVE RULES (${rules.filter((r) => r.enabled !== false).length} total):
${ruleSummary || "No rules defined yet."}

SCENARIOS: ${guide.scenarios?.length ?? 0}
${guide.scenarios?.slice(0, 3).map((s) => `• ${s.name} (${s.players}p, ${s.difficulty})`).join("\n") ?? ""}
  `.trim();
}

const SYSTEM_PROMPT = `You are an expert board game designer and balance consultant. 
Analyze the provided game design and return ONLY a valid JSON object (no markdown, no explanation) 
with this exact structure:

{
  "difficultyScore": <1-10 integer>,
  "complexityScore": <1-10 integer>,
  "balanceScore": <1-10 integer>,
  "replayabilityScore": <1-10 integer>,
  "playerCountRating": "<string like '2-4 players, best 3'>",
  "estimatedPlaytime": "<string like '30-60 min'>",
  "summary": "<2-3 sentence overall assessment>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "issues": [
    {
      "severity": "<critical|warning|info>",
      "category": "<Balance|Complexity|Clarity|Replayability|Components|Rules>",
      "title": "<short title>",
      "detail": "<1-2 sentence explanation and fix suggestion>"
    }
  ],
  "suggestions": ["<actionable suggestion 1>", "<actionable suggestion 2>", "<suggestion 3>", "<suggestion 4>", "<suggestion 5>"]
}

Rules:
- difficultyScore: how hard is the game to play (1=trivial, 10=brutal)
- complexityScore: how many rules/decisions to track (1=simple, 10=overwhelming)  
- balanceScore: how fairly balanced between players (1=very unfair, 10=perfectly balanced)
- replayabilityScore: how much variety/replay value (1=play once, 10=infinite variety)
- issues: identify 2-5 real design problems; if none, return []
- suggestions: always return 4-6 concrete, actionable improvements
- Base all analysis on the actual component count, types, rules provided
- If the game is very sparse (few components, few rules), say so clearly`;

// ── Score ring ────────────────────────────────────────────────────────────────

function ScoreRing({
  score,
  label,
  color,
}: {
  score: number;
  label: string;
  color: string;
}) {
  const r = 18;
  const circumference = 2 * Math.PI * r;
  const dash = (score / 10) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-11 h-11">
        <svg width="44" height="44" viewBox="0 0 44 44" className="-rotate-90">
          <circle cx="22" cy="22" r={r} fill="none" stroke="rgba(58,42,31,0.6)" strokeWidth="3.5" />
          <circle
            cx="22" cy="22" r={r}
            fill="none"
            stroke={color}
            strokeWidth="3.5"
            strokeDasharray={`${dash} ${circumference}`}
            strokeLinecap="round"
            style={{ transition: "stroke-dasharray 0.6s ease" }}
          />
        </svg>
        <span
          className="absolute inset-0 flex items-center justify-center text-xs font-display font-bold"
          style={{ color }}
        >
          {score}
        </span>
      </div>
      <span className="text-[10px] font-ui text-soft-gray-dark text-center leading-tight">
        {label}
      </span>
    </div>
  );
}

// ── Issue card ────────────────────────────────────────────────────────────────

const SEVERITY_STYLES = {
  critical: { bg: "bg-crimson-ghost", border: "border-crimson-flame/40", icon: "🔴", text: "text-crimson-flame" },
  warning:  { bg: "bg-[rgba(245,196,81,0.08)]", border: "border-royal-gold/30", icon: "🟡", text: "text-royal-gold" },
  info:     { bg: "bg-[rgba(61,220,151,0.06)]", border: "border-emerald-glow/20", icon: "🔵", text: "text-emerald-glow" },
};

function IssueCard({ issue }: { issue: BalanceIssue }) {
  const [open, setOpen] = useState(false);
  const s = SEVERITY_STYLES[issue.severity];

  return (
    <div className={`rounded-lg border ${s.bg} ${s.border} p-2.5`}>
      <button
        className="w-full flex items-center gap-2 text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="text-[11px] shrink-0">{s.icon}</span>
        <span className={`text-2xs font-ui font-semibold flex-1 ${s.text}`}>{issue.title}</span>
        <span className="text-[10px] text-soft-gray-dark font-ui shrink-0">{issue.category}</span>
        <svg
          width="9" height="9" viewBox="0 0 9 9" fill="none"
          className={`shrink-0 text-soft-gray-dark transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M1.5 3l3 3 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      </button>
      {open && (
        <p className="mt-1.5 text-[11px] text-parchment-mid font-ui leading-relaxed pl-5">
          {issue.detail}
        </p>
      )}
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────

interface Props {
  components: CanvasComp[];
  rules: GameRule[];
  guide: GameGuide;
  pages: { id: string; name: string; components: CanvasComp[] }[];
  isPro: boolean;
}

export function AIBalancerPanel({ components, rules, guide, pages, isPro }: Props) {
  const [analysis, setAnalysis] = useState<BalanceAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [_streamText, setStreamText] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const analyze = useCallback(async () => {
    if (loading) {
      abortRef.current?.abort();
      return;
    }

    setLoading(true);
    setError(null);
    setStreamText("Thinking…");
    setAnalysis(null);

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const gameSummary = buildGameSummary(components, rules, guide, pages);

      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        signal: ctrl.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: [
            {
              role: "user",
              content: `Please analyze this board game design and return a JSON balance report:\n\n${gameSummary}`,
            },
          ],
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error((err as { error?: { message?: string } }).error?.message ?? `API error ${resp.status}`);
      }

      const data = await resp.json() as { content: { type: string; text: string }[] };
      const raw = data.content.find((b) => b.type === "text")?.text ?? "";

      // Strip any accidental markdown fences
      const clean = raw.replace(/```json\n?|```\n?/g, "").trim();
      const parsed = JSON.parse(clean) as BalanceAnalysis;

      // Validate/clamp scores
      const clamp = (n: unknown) => Math.max(1, Math.min(10, Math.round(Number(n) || 5)));
      parsed.difficultyScore    = clamp(parsed.difficultyScore);
      parsed.complexityScore    = clamp(parsed.complexityScore);
      parsed.balanceScore       = clamp(parsed.balanceScore);
      parsed.replayabilityScore = clamp(parsed.replayabilityScore);

      setAnalysis(parsed);
      setStreamText("");
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        setStreamText("");
      } else {
        setError(err instanceof Error ? err.message : "Analysis failed.");
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }, [components, rules, guide, pages, loading]);

  const scoreColor = (n: number) =>
    n >= 8 ? "#3ddc97" : n >= 5 ? "#f5c451" : "#ff3b5c";

  if (!isPro) {
    return (
      <div className="p-4 space-y-3">
        <div className="rounded-xl border border-[rgba(124,92,255,0.4)] bg-[rgba(124,92,255,0.08)] p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🤖</span>
            <div>
              <p className="text-sm font-display font-bold text-[#a78bff]">AI Game Balancer</p>
              <p className="text-[10px] text-soft-gray-dark font-ui">Pro feature</p>
            </div>
          </div>
          <p className="text-2xs font-ui text-parchment-mid leading-relaxed">
            Get instant AI analysis of your game's balance, difficulty, complexity, and
            replayability — plus specific, actionable improvement suggestions.
          </p>
          <ul className="space-y-1">
            {[
              "Difficulty & complexity scoring",
              "Balance issue detection",
              "Playcount & playtime estimate",
              "5+ improvement suggestions",
            ].map((f) => (
              <li key={f} className="flex items-center gap-2 text-2xs font-ui text-soft-gray">
                <span className="text-emerald-glow">✓</span> {f}
              </li>
            ))}
          </ul>
          <a
            href="/pricing"
            className="block text-center py-2 rounded-lg bg-[rgba(124,92,255,0.2)] text-[#a78bff] text-2xs font-ui font-bold hover:bg-[rgba(124,92,255,0.35)] transition-colors"
          >
            Upgrade to Pro →
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 space-y-4 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-lg">🤖</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-display font-bold text-parchment-light">AI Balancer</p>
          <p className="text-[10px] text-soft-gray-dark font-ui">
            {components.length} components · {rules.filter((r) => r.enabled !== false).length} rules
          </p>
        </div>
      </div>

      {/* Analyse button */}
      <button
        onClick={analyze}
        className={`w-full py-2.5 rounded-xl text-sm font-display font-bold transition-colors ${
          loading
            ? "bg-warm-wood text-soft-gray"
            : "bg-[rgba(124,92,255,0.85)] text-white hover:bg-[#7c5cff]"
        }`}
      >
        {loading ? "⏹ Cancel analysis" : analysis ? "↺ Re-analyse" : "Analyse my game"}
      </button>

      {/* Streaming placeholder */}
      {loading && (
        <div className="rounded-xl border border-warm-wood/40 bg-rich-wood-mid p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#a78bff] animate-pulse" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#a78bff] animate-pulse [animation-delay:0.2s]" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#a78bff] animate-pulse [animation-delay:0.4s]" />
            <span className="text-[10px] text-soft-gray-dark font-ui ml-1">Analysing game design…</span>
          </div>
          <p className="text-2xs text-soft-gray font-ui">
            Reading {components.length} components and {rules.filter(r => r.enabled !== false).length} rules…
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-crimson-flame/40 bg-crimson-ghost p-3">
          <p className="text-2xs font-ui text-crimson-flame font-semibold mb-1">Analysis failed</p>
          <p className="text-[11px] font-ui text-parchment-mid">{error}</p>
          <button
            onClick={analyze}
            className="mt-2 text-[10px] font-ui text-crimson-flame hover:text-parchment-light transition-colors"
          >
            Try again →
          </button>
        </div>
      )}

      {/* Results */}
      {analysis && !loading && (
        <div className="space-y-4">
          {/* Score rings */}
          <div>
            <p className="text-[10px] font-ui font-semibold text-soft-gray uppercase tracking-wider mb-3">
              Scores
            </p>
            <div className="grid grid-cols-4 gap-1">
              <ScoreRing score={analysis.difficultyScore}    label="Difficulty"    color={scoreColor(11 - analysis.difficultyScore)} />
              <ScoreRing score={analysis.complexityScore}    label="Complexity"    color={scoreColor(11 - analysis.complexityScore)} />
              <ScoreRing score={analysis.balanceScore}       label="Balance"       color={scoreColor(analysis.balanceScore)} />
              <ScoreRing score={analysis.replayabilityScore} label="Replayability" color={scoreColor(analysis.replayabilityScore)} />
            </div>
          </div>

          {/* Meta */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-rich-wood-mid border border-warm-wood/40 p-2.5">
              <p className="text-[10px] text-soft-gray-dark font-ui mb-0.5">Player count</p>
              <p className="text-2xs font-ui font-semibold text-parchment-light">{analysis.playerCountRating}</p>
            </div>
            <div className="rounded-lg bg-rich-wood-mid border border-warm-wood/40 p-2.5">
              <p className="text-[10px] text-soft-gray-dark font-ui mb-0.5">Playtime</p>
              <p className="text-2xs font-ui font-semibold text-parchment-light">{analysis.estimatedPlaytime}</p>
            </div>
          </div>

          {/* Summary */}
          <div>
            <p className="text-[10px] font-ui font-semibold text-soft-gray uppercase tracking-wider mb-1.5">
              Summary
            </p>
            <p className="text-2xs font-ui text-parchment-mid leading-relaxed">{analysis.summary}</p>
          </div>

          {/* Strengths */}
          {analysis.strengths?.length > 0 && (
            <div>
              <p className="text-[10px] font-ui font-semibold text-soft-gray uppercase tracking-wider mb-1.5">
                Strengths
              </p>
              <ul className="space-y-1">
                {analysis.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-2xs font-ui text-parchment-mid">
                    <span className="text-emerald-glow shrink-0 mt-0.5">✓</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Issues */}
          {analysis.issues?.length > 0 && (
            <div>
              <p className="text-[10px] font-ui font-semibold text-soft-gray uppercase tracking-wider mb-1.5">
                Issues ({analysis.issues.length})
              </p>
              <div className="space-y-1.5">
                {analysis.issues.map((issue, i) => (
                  <IssueCard key={i} issue={issue} />
                ))}
              </div>
            </div>
          )}

          {/* Suggestions */}
          {analysis.suggestions?.length > 0 && (
            <div>
              <p className="text-[10px] font-ui font-semibold text-soft-gray uppercase tracking-wider mb-1.5">
                Suggestions
              </p>
              <ol className="space-y-2">
                {analysis.suggestions.map((s, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span
                      className="shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-mono font-bold mt-0.5"
                      style={{ background: "rgba(124,92,255,0.25)", color: "#a78bff" }}
                    >
                      {i + 1}
                    </span>
                    <p className="text-2xs font-ui text-parchment-mid leading-relaxed">{s}</p>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Re-analyse nudge */}
          <p className="text-[10px] text-soft-gray-dark font-ui text-center">
            Add more rules or components and re-analyse to see updated scores.
          </p>
        </div>
      )}

      {/* Empty state */}
      {!analysis && !loading && !error && (
        <div className="text-center py-6 space-y-2">
          <p className="text-3xl">⚖️</p>
          <p className="text-soft-gray text-2xs font-ui">
            Click "Analyse my game" to get AI-powered balance scoring, issue detection, and improvement suggestions.
          </p>
        </div>
      )}
    </div>
  );
}
