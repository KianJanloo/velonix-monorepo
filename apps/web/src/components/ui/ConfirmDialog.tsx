"use client";

import { useState } from "react";
import { Button } from "@/components/atoms/Button";

interface ConfirmDialogProps {
  title: string;
  description: string;
  confirmLabel?: string;
  variant?: "danger" | "warning";
  onConfirm: () => void | Promise<void>;
  children: (open: () => void) => React.ReactNode;
}

export function ConfirmDialog({
  title,
  description,
  confirmLabel = "Confirm",
  variant = "danger",
  onConfirm,
  children,
}: ConfirmDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    try {
      await onConfirm();
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {children(() => setOpen(true))}

      {open && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => !loading && setOpen(false)}
          />
          {/* Dialog */}
          <div className="relative v-card p-6 max-w-sm w-full shadow-2xl">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-4 ${
              variant === "danger" ? "bg-crimson-ghost border border-crimson-flame/30" : "bg-[rgba(245,196,81,0.1)] border border-royal-gold/30"
            }`}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className={variant === "danger" ? "text-crimson-flame" : "text-royal-gold"}>
                <path d="M10 2L18 17H2L10 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                <path d="M10 8v4M10 14.5h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <h2 className="font-display text-lg font-bold tracking-wide text-parchment-light mb-2">{title}</h2>
            <p className="text-soft-gray text-sm font-ui leading-relaxed mb-6">{description}</p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setOpen(false)} disabled={loading}>
                Cancel
              </Button>
              <Button
                variant={variant === "danger" ? "danger" : "gold"}
                className="flex-1"
                isLoading={loading}
                onClick={handleConfirm}
              >
                {confirmLabel}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
