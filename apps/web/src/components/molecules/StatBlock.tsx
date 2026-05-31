import { cn } from "@/lib/utils";

type AccentColor = "emerald" | "gold" | "cyan" | "parchment";

interface StatBlockProps {
  label: string;
  value: string | number;
  change?: string;
  changePositive?: boolean;
  accent?: AccentColor;
  className?: string;
}

const accentStyles: Record<AccentColor, { bar: string; value: string }> = {
  emerald: {
    bar: "bg-emerald-glow shadow-emerald",
    value: "text-emerald-glow [text-shadow:0_0_14px_rgba(124,92,255,0.35)]",
  },
  gold: {
    bar: "bg-royal-gold shadow-gold",
    value: "text-royal-gold [text-shadow:0_0_14px_rgba(245,196,81,0.35)]",
  },
  cyan: {
    bar: "bg-cyan-spark shadow-cyan",
    value: "text-cyan-spark [text-shadow:0_0_14px_rgba(0,229,255,0.3)]",
  },
  parchment: {
    bar: "bg-parchment-mid",
    value: "text-parchment-light",
  },
};

export function StatBlock({
  label,
  value,
  change,
  changePositive = true,
  accent = "emerald",
  className,
}: StatBlockProps) {
  const styles = accentStyles[accent];

  return (
    <div
      className={cn(
        "relative bg-rich-wood-dark border border-warm-wood rounded-xl p-5 overflow-hidden",
        className
      )}
    >
      {/* Accent top bar */}
      <div className={cn("absolute top-0 left-0 right-0 h-0.5", styles.bar)} />

      <p className="text-2xs font-ui font-bold tracking-[0.14em] uppercase text-soft-gray-dark mb-2">
        {label}
      </p>
      <p className={cn("font-display text-3xl font-black leading-none mb-1.5", styles.value)}>
        {value}
      </p>
      {change && (
        <p
          className={cn(
            "text-2xs font-ui font-semibold",
            changePositive ? "text-emerald-glow" : "text-crimson-flame"
          )}
        >
          {change}
        </p>
      )}
    </div>
  );
}
