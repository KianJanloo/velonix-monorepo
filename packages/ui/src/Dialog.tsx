"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";

// ── cn helper (inlined to avoid web-app dependency) ──────────────────────────
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: Parameters<typeof clsx>) {
  return twMerge(clsx(inputs));
}

// ── Dialog Root ──────────────────────────────────────────────────────────────

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

// ── Overlay ──────────────────────────────────────────────────────────────────

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-300 bg-black/70 backdrop-blur-sm",
      "data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-in [animation-direction:reverse]",
      className
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

// ── Content ──────────────────────────────────────────────────────────────────

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        // Positioning
        "fixed left-[50%] top-[50%] z-400 translate-x-[-50%] translate-y-[-50%]",
        // Sizing
        "w-full max-w-lg",
        // Velonix dark wood styling
        "bg-rich-wood-dark border border-warm-wood rounded-2xl",
        "shadow-xl p-6",
        // Animation
        "data-[state=open]:animate-scale-in",
        // Focus
        "focus:outline-none",
        className
      )}
      {...props}
    >
      {children}
      {/* Close button */}
      <DialogPrimitive.Close
        className={cn(
          "absolute right-4 top-4",
          "w-8 h-8 rounded-lg flex items-center justify-center",
          "text-soft-gray hover:text-parchment-light hover:bg-warm-wood",
          "transition-all duration-150 focus:outline-none focus-visible:ring-2",
          "focus-visible:ring-emerald-glow focus-visible:ring-offset-2",
          "focus-visible:ring-offset-rich-wood-dark"
        )}
        aria-label="Close dialog"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

// ── Header / Footer / Title / Description ────────────────────────────────────

function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col gap-1.5 mb-5", className)}
      {...props}
    />
  );
}

function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-6 pt-5",
        "border-t border-warm-wood",
        className
      )}
      {...props}
    />
  );
}

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "font-display text-xl font-bold tracking-display text-parchment-light",
      className
    )}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-soft-gray font-ui leading-relaxed", className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog, DialogTrigger, DialogPortal, DialogOverlay, DialogClose,
  DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription,
};
