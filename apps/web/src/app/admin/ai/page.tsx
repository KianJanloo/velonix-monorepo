"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

interface AiConfig {
  enabled: boolean;
  provider: string | null;
  model: string | null;
  maxTokens: number | null;
  hasApiKey: boolean;
}

export default function AdminAiPage() {
  const { data: config, isLoading } = useQuery({
    queryKey: ["admin", "ai", "config"],
    queryFn: () => apiClient.get<AiConfig>("/ai/config"),
  });

  const { data: status } = useQuery({
    queryKey: ["admin", "ai", "status"],
    queryFn: () => apiClient.get<{ enabled: boolean }>("/ai/status"),
  });

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-parchment-light">
            AI Management
          </h1>
          <p className="text-soft-gray text-sm font-ui mt-0.5">
            Artificial intelligence feature configuration and monitoring
          </p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-ui font-bold ${
            status?.enabled
              ? "bg-emerald-ghost text-emerald-glow"
              : "bg-crimson-ghost text-crimson-flame"
          }`}
        >
          {status?.enabled ? "Enabled" : "Disabled"}
        </span>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="v-card h-20 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Configuration */}
          <div className="v-card p-6">
            <h2 className="font-display text-sm font-bold text-parchment-light mb-4">
              Configuration
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-warm-wood/30">
                <span className="text-sm font-ui text-soft-gray">Provider</span>
                <span className="text-sm font-ui text-parchment-light font-mono">
                  {config?.provider ?? "—"}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-warm-wood/30">
                <span className="text-sm font-ui text-soft-gray">Model</span>
                <span className="text-sm font-ui text-parchment-light font-mono">
                  {config?.model ?? "—"}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-warm-wood/30">
                <span className="text-sm font-ui text-soft-gray">Max Tokens</span>
                <span className="text-sm font-ui text-parchment-light font-mono">
                  {config?.maxTokens ?? "—"}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm font-ui text-soft-gray">API Key</span>
                <span className="text-sm font-ui text-parchment-light">
                  {config?.hasApiKey ? (
                    <span className="text-emerald-glow">Configured</span>
                  ) : (
                    <span className="text-crimson-flame">Not configured</span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Usage Info */}
          <div className="v-card p-6">
            <h2 className="font-display text-sm font-bold text-parchment-light mb-3">
              Usage
            </h2>
            <p className="text-sm text-soft-gray font-ui leading-relaxed">
              AI features are used in the Studio for{" "}
              <span className="text-parchment-light font-semibold">
                game balance analysis
              </span>
              . Creators can request an AI-powered balance review of their game
              design, which analyzes component counts, rules, and mechanics to
              provide difficulty scores, strengths, and actionable suggestions.
            </p>
            <div className="mt-4 p-4 rounded-xl bg-rich-wood-mid/50 border border-warm-wood/40">
              <p className="text-xs text-parchment-mid font-ui">
                <span className="text-soft-gray-dark font-semibold">
                  Rate limit:{" "}
                </span>
                10 requests per minute per user ·{" "}
                <span className="text-soft-gray-dark font-semibold">
                  Endpoint:{" "}
                </span>
                <code className="text-cyan-spark text-[10px] font-mono">
                  POST /v1/ai/balance
                </code>
              </p>
            </div>
          </div>

          {/* Environment Variables */}
          <div className="v-card p-6">
            <h2 className="font-display text-sm font-bold text-parchment-light mb-3">
              Environment Variables
            </h2>
            <div className="space-y-2 text-sm font-ui">
              <div className="flex items-center gap-2">
                <code className="text-[11px] font-mono text-cyan-spark bg-rich-wood-mid px-1.5 py-0.5 rounded">
                  AI_API_KEY
                </code>
                <span className="text-soft-gray">Anthropic API key</span>
              </div>
              <div className="flex items-center gap-2">
                <code className="text-[11px] font-mono text-cyan-spark bg-rich-wood-mid px-1.5 py-0.5 rounded">
                  AI_MODEL
                </code>
                <span className="text-soft-gray">
                  Model name (default: claude-sonnet-4-6)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <code className="text-[11px] font-mono text-cyan-spark bg-rich-wood-mid px-1.5 py-0.5 rounded">
                  AI_MAX_TOKENS
                </code>
                <span className="text-soft-gray">
                  Max tokens per response (default: 1000)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <code className="text-[11px] font-mono text-cyan-spark bg-rich-wood-mid px-1.5 py-0.5 rounded">
                  AI_PROVIDER
                </code>
                <span className="text-soft-gray">
                  Provider name (default: anthropic)
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
