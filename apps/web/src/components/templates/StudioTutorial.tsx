"use client";

import { useState } from "react";

export const STUDIO_TUTORIAL_KEY = "velonix:studio-tutorial-seen";

interface Step {
  icon: string;
  title: string;
  body: React.ReactNode;
}

const STEPS: Step[] = [
  {
    icon: "🎲",
    title: "Welcome to the Studio",
    body: <>This is where you design your board game — the board, cards, pieces, rules and more. Here&apos;s a 90-second tour of how it all works. You can reopen this anytime from the <span className="text-emerald-glow">?</span> button.</>,
  },
  {
    icon: "🧩",
    title: "Add parts",
    body: <>Open the <span className="text-emerald-glow font-semibold">Parts</span> tab on the left and click any piece — board, card, deck, token, meeple, die, coin, hex, note and more — to drop it on the canvas. Or pick a shape tool in the top toolbar and click the canvas to place it.</>,
  },
  {
    icon: "🖱️",
    title: "Move, resize, rotate",
    body: <>Click a component to select it. Drag to move, pull the <span className="text-[#7c5cff] font-semibold">purple handles</span> to resize, and use the <span className="text-royal-gold font-semibold">gold dot</span> above it to rotate. Scroll to zoom; hold the middle mouse button (or the Pan tool) to move around.</>,
  },
  {
    icon: "🎚️",
    title: "Properties & Style",
    body: <>The right panel has <span className="text-emerald-glow font-semibold">Props</span> (position, size, rotation, alignment, quantity) and <span className="text-emerald-glow font-semibold">Style</span> (fill, stroke, corners, opacity, fonts). Edit precise values or use the presets and sliders.</>,
  },
  {
    icon: "🗂️",
    title: "Layers & Assets",
    body: <>The <span className="text-emerald-glow font-semibold">Layers</span> tab lists every piece — reorder, rename (double-click), lock or hide them. The <span className="text-emerald-glow font-semibold">Assets</span> tab lets you upload images and apply them to a selected component.</>,
  },
  {
    icon: "🔗",
    title: "Group components",
    body: <><span className="font-semibold">Shift-click</span> several components to select them together, then press <span className="font-mono text-parchment-light">⌘/Ctrl&nbsp;G</span> (or the Group button) to combine them into one unit that moves together. <span className="font-mono text-parchment-light">⌘/Ctrl&nbsp;⇧&nbsp;G</span> ungroups. Right-click anything for a quick menu.</>,
  },
  {
    icon: "📄",
    title: "Multiple pages",
    body: <>Use the <span className="text-emerald-glow font-semibold">Pages</span> bar to create more than one canvas — a main board, player boards, a card sheet — and switch between them. Each page has its own changeable size (set the W×H or pick a preset).</>,
  },
  {
    icon: "⚙️",
    title: "Rule Engine",
    body: <>In the right panel&apos;s <span className="text-emerald-glow font-semibold">Rules</span> tab, build <span className="text-cyan-spark font-semibold">When → Then</span> rules (e.g. &ldquo;On turn start, each player draws 1 card&rdquo;). A live preview shows the sentence that players will read.</>,
  },
  {
    icon: "📖",
    title: "Rule guide & scenarios",
    body: <>Click <span className="text-emerald-glow font-semibold">Guide</span> in the toolbar to write your objective, setup steps, turn structure, and named scenarios/variants. This becomes the &ldquo;How to play&rdquo; section on your game&apos;s marketplace page.</>,
  },
  {
    icon: "👥",
    title: "Invite collaborators",
    body: <>On Pro &amp; Studio plans, use <span className="text-emerald-glow font-semibold">Share</span> to invite teammates as editors or viewers. You&apos;ll see who&apos;s in the studio and changes sync live as you both work.</>,
  },
  {
    icon: "🚀",
    title: "Preview, save & publish",
    body: <>Switch to <span className="text-emerald-glow font-semibold">Preview</span> (2D/3D) to playtest the look. Your work auto-saves (⌘/Ctrl&nbsp;S to save now). When it&apos;s ready, hit <span className="text-emerald-glow font-semibold">Publish</span> to set pricing and submit to the marketplace.</>,
  },
];

export function StudioTutorial({ onClose }: { onClose: () => void }) {
  const [i, setI] = useState(0);
  const step = STEPS[i]!;
  const isLast = i === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="v-card w-full max-w-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4">
          <span className="text-2xs font-ui font-semibold text-soft-gray uppercase tracking-[0.12em]">Studio tour · {i + 1}/{STEPS.length}</span>
          <button onClick={onClose} className="text-soft-gray hover:text-parchment-light p-1 -mr-1" title="Close">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex gap-4">
          <div className="w-14 h-14 rounded-2xl bg-warm-wood/40 border border-warm-wood flex items-center justify-center text-3xl shrink-0">{step.icon}</div>
          <div className="min-w-0">
            <h2 className="font-display text-xl font-bold text-parchment-light mb-1.5">{step.title}</h2>
            <p className="text-sm text-parchment-mid font-ui leading-relaxed">{step.body}</p>
          </div>
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-1.5 pb-4">
          {STEPS.map((_, idx) => (
            <button key={idx} onClick={() => setI(idx)} aria-label={`Step ${idx + 1}`}
              className={`h-1.5 rounded-full transition-all ${idx === i ? "w-5 bg-emerald-glow" : "w-1.5 bg-warm-wood hover:bg-warm-wood-light"}`} />
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-warm-wood bg-rich-wood-dark/40">
          <button onClick={onClose} className="text-2xs font-ui text-soft-gray hover:text-parchment-light">Skip tour</button>
          <div className="flex items-center gap-2">
            {i > 0 && (
              <button onClick={() => setI(i - 1)} className="px-3 py-1.5 rounded-lg border border-warm-wood-light text-parchment-light text-2xs font-ui font-semibold hover:bg-warm-wood">Back</button>
            )}
            <button
              onClick={() => (isLast ? onClose() : setI(i + 1))}
              className="px-4 py-1.5 rounded-lg bg-emerald-glow text-deep-void text-2xs font-ui font-bold hover:bg-emerald-bright transition-all">
              {isLast ? "Start building" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
