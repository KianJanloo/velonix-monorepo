import { cn } from "@/lib/utils";

interface VelonixLogoProps {
  size?: number;
  className?: string;
  showWordmark?: boolean;
  wordmarkSize?: "sm" | "md" | "lg";
}

export function VelonixLogo({
  size = 40,
  className,
  showWordmark = false,
  wordmarkSize = "md",
}: VelonixLogoProps) {
  const id = `vlogo-${Math.random().toString(36).slice(2, 7)}`;

  const wordmarkSizes = {
    sm: "text-sm tracking-[0.12em]",
    md: "text-lg tracking-[0.14em]",
    lg: "text-2xl tracking-[0.16em]",
  };

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 80 80"
        fill="none"
        aria-label="Velonix logo mark"
        role="img"
      >
        <defs>
          <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#c4b49a" />
            <stop offset="50%" stopColor="#f5c451" />
            <stop offset="100%" stopColor="#c4b49a" />
          </linearGradient>
        </defs>
        {/* Outer V */}
        <polyline
          points="8,18 40,62 72,18"
          fill="none"
          stroke={`url(#${id})`}
          strokeWidth="5"
          strokeLinejoin="miter"
        />
        {/* Inner V */}
        <polyline
          points="18,18 40,52 62,18"
          fill="none"
          stroke={`url(#${id})`}
          strokeWidth="3"
          strokeLinejoin="miter"
          opacity="0.45"
        />
        {/* King crown */}
        <circle cx="40" cy="15" r="3.5" fill={`url(#${id})`} />
        <rect x="37.5" y="8" width="5" height="2.5" rx="1" fill={`url(#${id})`} />
        <circle cx="40" cy="7" r="2" fill={`url(#${id})`} opacity="0.8" />
      </svg>

      {showWordmark && (
        <span
          className={cn(
            "font-display font-bold text-royal-gold",
            wordmarkSizes[wordmarkSize]
          )}
        >
          VELONIX
        </span>
      )}
    </div>
  );
}
