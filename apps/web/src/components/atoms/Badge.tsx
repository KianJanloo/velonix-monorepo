import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-2xs font-ui font-bold tracking-widest uppercase",
  {
    variants: {
      variant: {
        premium:
          "bg-royal-gold-ghost text-royal-gold border border-[rgba(245,196,81,0.3)] shadow-gold",
        published:
          "bg-emerald-ghost text-emerald-glow border border-[rgba(0,212,165,0.3)]",
        draft:
          "bg-[rgba(168,162,158,0.08)] text-soft-gray border border-[rgba(168,162,158,0.18)]",
        danger:
          "bg-crimson-ghost text-crimson-flame border border-[rgba(255,59,92,0.3)]",
        info:
          "bg-cyan-ghost text-cyan-spark border border-[rgba(0,229,255,0.25)]",
        neutral:
          "bg-warm-wood text-soft-gray border border-warm-wood-light",
      },
    },
    defaultVariants: { variant: "neutral" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

export function Badge({ className, variant, dot, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" aria-hidden="true" />
      )}
      {children}
    </span>
  );
}
