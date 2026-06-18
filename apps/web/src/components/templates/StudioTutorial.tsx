"use client";

import { useEffect, useRef, useState } from "react";

export const STUDIO_TUTORIAL_KEY = "velonix:studio-tutorial-seen";

interface Step {
  title: string;
  body: React.ReactNode;
  /** data-tutorial attribute value of the real element to spotlight. Omit for the intro/outro cards. */
  target?: string;
  /** If true, clicking the real (spotlighted) element auto-advances the tour. */
  advanceOnClick?: boolean;
  placement?: "top" | "bottom" | "left" | "right";
}

const STEPS: Step[] = [
  {
    title: "Let's build something",
    body: "This tour is hands-on — instead of slides, we'll point you straight at the real buttons in the studio and have you try them. Hit Next to start.",
  },
  {
    title: "Open the Parts tab",
    body: "Every board, card, deck, token, meeple, die and more lives here. Click the tab to open it.",
    target: "parts-tab",
    advanceOnClick: true,
    placement: "right",
  },
  {
    title: "Drop it on the board",
    body: "Click any piece in the list, then click here on the canvas to place it. Already placed one? Just hit Next.",
    target: "canvas",
    placement: "left",
  },
  {
    title: "Select & move",
    body: "This is your everyday tool — click it, then drag any piece on the board to move it, pull a corner to resize, or the gold dot to rotate.",
    target: "tool-select",
    advanceOnClick: true,
    placement: "bottom",
  },
  {
    title: "Pan around",
    body: "Click this (or hold H) to drag the canvas itself around — handy on a big board.",
    target: "tool-hand",
    advanceOnClick: true,
    placement: "bottom",
  },
  {
    title: "Sketch & annotate",
    body: "Pencil, highlighter, arrow and rectangle tools for quick sketches or callouts. To get back to Select afterward, press V — or just click the red ✕ that appears next to these tools while one is active.",
    target: "tool-pencil",
    placement: "bottom",
  },
  {
    title: "Properties, Style & Notes",
    body: "Select a piece, then use these tabs: Props for position/size, Style for fill & fonts, and Notes to record a quick voice memo right on that piece.",
    target: "right-tabs",
    placement: "left",
  },
  {
    title: "Build real rules",
    body: "Click Rules to write When → Then logic in plain language (\"On turn start, each player draws 1 card\") — no scripting needed.",
    target: "tab-rules",
    advanceOnClick: true,
    placement: "left",
  },
  {
    title: "Resize the side panels",
    body: "Got a lot of tabs open and feeling cramped? Drag this edge left or right — it remembers your preferred width.",
    target: "resize-handle",
    placement: "left",
  },
  {
    title: "Save anytime",
    body: "Your work autosaves, but ⌘/Ctrl+S (or this button) saves instantly.",
    target: "save-btn",
    placement: "bottom",
  },
  {
    title: "Publish when ready",
    body: "Set your pricing and submit to the marketplace whenever the game feels ready. You can keep editing after publishing, too.",
    target: "publish-btn",
    placement: "bottom",
  },
  {
    title: "That's the tour",
    body: "Reopen this anytime from the ? button. Now go make something great.",
  },
];

interface Rect { top: number; left: number; width: number; height: number; }

function useTargetRect(selector: string | undefined): Rect | null {
  const [rect, setRect] = useState<Rect | null>(null);

  useEffect(() => {
    if (!selector) { setRect(null); return; }
    let raf = 0;
    const measure = () => {
      const el = document.querySelector(`[data-tutorial="${selector}"]`);
      if (el) {
        const r = el.getBoundingClientRect();
        setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
      } else {
        setRect(null);
      }
      raf = requestAnimationFrame(measure);
    };
    measure();
    return () => cancelAnimationFrame(raf);
  }, [selector]);

  return rect;
}

export function StudioTutorial({ onClose }: { onClose: () => void }) {
  const [i, setI] = useState(0);
  const step = STEPS[i]!;
  const isLast = i === STEPS.length - 1;
  const rect = useTargetRect(step.target);
  const calloutRef = useRef<HTMLDivElement>(null);

  // Auto-advance when the spotlighted element is actually clicked.
  useEffect(() => {
    if (!step.target || !step.advanceOnClick) return;
    const el = document.querySelector(`[data-tutorial="${step.target}"]`);
    if (!el) return;
    const handler = () => setI((n) => Math.min(n + 1, STEPS.length - 1));
    el.addEventListener("click", handler, { once: true });
    return () => el.removeEventListener("click", handler);
  }, [step.target, step.advanceOnClick]);

  const next = () => (isLast ? onClose() : setI((n) => n + 1));
  const back = () => setI((n) => Math.max(0, n - 1));

  const PAD = 8;

  // No real target (intro/outro), or the target isn't on screen right now —
  // fall back to a centered card so the tour never gets visually stuck.
  if (!step.target || !rect) {
    return (
      <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
        <div className="v-card w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
          <p className="text-2xs font-ui font-semibold text-soft-gray uppercase tracking-[0.12em] mb-2">
            Studio tour · {i + 1}/{STEPS.length}
          </p>
          <h2 className="font-display text-xl font-bold text-parchment-light mb-2">{step.title}</h2>
          <p className="text-sm text-parchment-mid font-ui leading-relaxed mb-5">{step.body}</p>
          <Footer i={i} isLast={isLast} onSkip={onClose} onBack={back} onNext={next} />
        </div>
      </div>
    );
  }

  // Position the callout beside the spotlighted element.
  const placement = step.placement ?? "bottom";
  const calloutStyle: React.CSSProperties = { position: "fixed", maxWidth: 320, zIndex: 202 };
  if (placement === "bottom") { calloutStyle.top = rect.top + rect.height + 14; calloutStyle.left = Math.max(12, rect.left); }
  if (placement === "top") { calloutStyle.bottom = window.innerHeight - rect.top + 14; calloutStyle.left = Math.max(12, rect.left); }
  if (placement === "left") { calloutStyle.top = rect.top; calloutStyle.right = window.innerWidth - rect.left + 14; }
  if (placement === "right") { calloutStyle.top = rect.top; calloutStyle.left = rect.left + rect.width + 14; }

  return (
    <div className="fixed inset-0 z-[200]" style={{ pointerEvents: "none" }}>
      {/* Four dimmed strips around the spotlighted rect — the cutout itself has no overlay, so the real element stays fully clickable. */}
      <div style={{ position: "fixed", inset: 0, top: 0, height: Math.max(0, rect.top - PAD), background: "rgba(0,0,0,0.65)", pointerEvents: "auto" }} onClick={onClose} />
      <div style={{ position: "fixed", left: 0, top: rect.top + rect.height + PAD, right: 0, bottom: 0, background: "rgba(0,0,0,0.65)", pointerEvents: "auto" }} onClick={onClose} />
      <div style={{ position: "fixed", left: 0, top: Math.max(0, rect.top - PAD), width: Math.max(0, rect.left - PAD), height: rect.height + PAD * 2, background: "rgba(0,0,0,0.65)", pointerEvents: "auto" }} onClick={onClose} />
      <div style={{ position: "fixed", left: rect.left + rect.width + PAD, top: Math.max(0, rect.top - PAD), right: 0, height: rect.height + PAD * 2, background: "rgba(0,0,0,0.65)", pointerEvents: "auto" }} onClick={onClose} />

      {/* Glow ring around the real element */}
      <div
        style={{
          position: "fixed", top: rect.top - PAD, left: rect.left - PAD, width: rect.width + PAD * 2, height: rect.height + PAD * 2,
          border: "2px solid #3ddc97", borderRadius: 10, boxShadow: "0 0 0 4px rgba(61,220,151,0.25), 0 0 24px rgba(61,220,151,0.5)",
          pointerEvents: "none",
        }}
      />

      <div ref={calloutRef} style={{ ...calloutStyle, pointerEvents: "auto" }} className="v-card p-4">
        <p className="text-2xs font-ui font-semibold text-soft-gray uppercase tracking-[0.1em] mb-1.5">
          Studio tour · {i + 1}/{STEPS.length}
        </p>
        <h2 className="font-display text-base font-bold text-parchment-light mb-1.5">{step.title}</h2>
        <p className="text-xs text-parchment-mid font-ui leading-relaxed mb-3">{step.body}</p>
        {step.advanceOnClick && (
          <p className="text-2xs text-emerald-glow font-ui font-semibold mb-3">👉 Try clicking the highlighted button</p>
        )}
        <Footer i={i} isLast={isLast} onSkip={onClose} onBack={back} onNext={next} />
      </div>
    </div>
  );
}

function Footer({ i, isLast, onSkip, onBack, onNext }: { i: number; isLast: boolean; onSkip: () => void; onBack: () => void; onNext: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <button onClick={onSkip} className="text-2xs font-ui text-soft-gray hover:text-parchment-light">
        Skip tour
      </button>
      <div className="flex items-center gap-2">
        {i > 0 && (
          <button onClick={onBack} className="px-3 py-1.5 rounded-lg border border-warm-wood-light text-parchment-light text-2xs font-ui font-semibold hover:bg-warm-wood">
            Back
          </button>
        )}
        <button onClick={onNext} className="px-4 py-1.5 rounded-lg bg-emerald-glow text-deep-void text-2xs font-ui font-bold hover:bg-emerald-bright transition-all">
          {isLast ? "Start building" : "Next"}
        </button>
      </div>
    </div>
  );
}
