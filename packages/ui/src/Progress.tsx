"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: Parameters<typeof clsx>) {
  return twMerge(clsx(inputs));
}

type ProgressVariant = "emerald" | "gold" | "crimson" | "cyan";

const variantStyles: Record<ProgressVariant, string> = {
  emerald: "bg-emerald-glow shadow-emerald",
  gold:    "bg-royal-gold shadow-gold",
  crimson: "bg-crimson-flame",
  cyan:    "bg-cyan-spark",
};

interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  variant?: ProgressVariant;
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, variant = "emerald", ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-1.5 w-full overflow-hidden rounded-full bg-warm-wood",
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className={cn(
        "h-full w-full flex-1 transition-all duration-500 rounded-full",
        variantStyles[variant]
      )}
      style={{ transform: `translateX(-${100 - (value ?? 0)}%)` }}
    />
  </ProgressPrimitive.Root>
));
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
export type { ProgressProps };
