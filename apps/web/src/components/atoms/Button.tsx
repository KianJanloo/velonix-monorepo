"use client";

import { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg font-ui font-semibold text-sm tracking-wide transition-all duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-deep-void disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
  {
    variants: {
      variant: {
        primary:
          "bg-emerald-glow text-deep-void hover:bg-emerald-dark hover:shadow-emerald focus-visible:ring-emerald-glow",
        gold:
          "bg-royal-gold text-deep-void hover:bg-royal-gold-dark hover:shadow-gold focus-visible:ring-royal-gold",
        outline:
          "bg-transparent text-parchment-light border border-warm-wood-light hover:bg-warm-wood hover:border-soft-gray focus-visible:ring-emerald-glow",
        ghost:
          "bg-emerald-ghost text-emerald-glow border border-[rgba(0,214,143,0.22)] hover:bg-[rgba(0,214,143,0.15)] focus-visible:ring-emerald-glow",
        danger:
          "bg-crimson-flame text-white hover:bg-crimson-dark hover:shadow-crimson focus-visible:ring-crimson-flame",
        subtle:
          "bg-warm-wood text-parchment-mid hover:bg-warm-wood-light hover:text-parchment-light focus-visible:ring-emerald-glow",
      },
      size: {
        sm: "text-xs px-3 py-1.5",
        md: "px-5 py-2.5",
        lg: "text-base px-8 py-3",
        icon: "w-9 h-9 p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled ?? isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin -ml-0.5 mr-1 h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Loading
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);
Button.displayName = "Button";
