"use client";

import type { ReactNode } from "react";

import type {
  CompType,
} from "./core-model";

export const COMP_ICONS: Record<CompType, ReactNode> = {
  board: (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <rect
        x="1"
        y="1"
        width="10"
        height="10"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <path
        d="M1 4.5h10M4.5 1v10"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.5"
      />
    </svg>
  ),
  card: (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <rect
        x="2"
        y="0.5"
        width="8"
        height="11"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.2"
      />
    </svg>
  ),
  token: (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  ),
  tile: (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <rect
        x="1"
        y="1"
        width="10"
        height="10"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.2"
      />
    </svg>
  ),
  die: (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <rect
        x="1"
        y="1"
        width="10"
        height="10"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <circle cx="4" cy="4" r="1" fill="currentColor" />
      <circle cx="8" cy="8" r="1" fill="currentColor" />
    </svg>
  ),
  pawn: (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <circle cx="6" cy="3.5" r="2" stroke="currentColor" strokeWidth="1.2" />
      <path
        d="M3.5 11c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  ),
  rulebook: (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <rect
        x="1"
        y="0.5"
        width="10"
        height="11"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <path
        d="M3.5 4h5M3.5 6.5h5M3.5 9h3"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.6"
      />
    </svg>
  ),
  text: (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path
        d="M2 3h8M6 3v7"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  ),
  meeple: (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path
        d="M6 1.5a1.5 1.5 0 011.3 2.2L9.5 5 9 6.5 6.5 6 6 7l1 3.5H5L6 7l-.5-1L3 6.5 2.5 5l2.2-1.3A1.5 1.5 0 016 1.5z"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </svg>
  ),
  cube: (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <rect
        x="2.5"
        y="2.5"
        width="7"
        height="7"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.2"
      />
    </svg>
  ),
  coin: (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.2" />
      <path
        d="M6 3.8v4.4M4.8 5h2a1 1 0 010 2H5"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  ),
  hex: (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path
        d="M6 1l4.3 2.5v5L6 11 1.7 8.5v-5z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  ),
  marker: (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <circle cx="6" cy="6" r="3" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="6" cy="6" r="1" fill="currentColor" />
    </svg>
  ),
  deck: (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <rect
        x="3"
        y="2"
        width="7"
        height="9"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.1"
      />
      <path
        d="M1.5 3.5v6A1 1 0 002.5 10.5"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
    </svg>
  ),
  note: (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path
        d="M1.5 1.5h9v6L7.5 10.5h-6z"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
      <path
        d="M10.5 7.5h-3v3"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
    </svg>
  ),
};

// ── Tools ─────────────────────────────────────────────────────────────────────

export const TOOLS = [
  {
    id: "select" as const,
    label: "Select (V)",
    cursor: "default",
    creates: null,
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path
          d="M2 2l4.5 10 1.8-4L13 6 2 2z"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: "hand" as const,
    label: "Pan (H)",
    cursor: "grab",
    creates: null,
    icon: (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path
          d="M5 5.5V3a1 1 0 012 0v2.5m0 0V2.5a1 1 0 012 0V5.5m0 0V3a1 1 0 012 0v5a4 4 0 01-4 4H5a4 4 0 01-4-4V6a1 1 0 012 0v2"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: "board" as const,
    label: "Board",
    cursor: "crosshair",
    creates: "board" as CompType,
    icon: COMP_ICONS.board,
  },
  {
    id: "card" as const,
    label: "Card",
    cursor: "crosshair",
    creates: "card" as CompType,
    icon: COMP_ICONS.card,
  },
  {
    id: "token" as const,
    label: "Token",
    cursor: "crosshair",
    creates: "token" as CompType,
    icon: COMP_ICONS.token,
  },
  {
    id: "die" as const,
    label: "Die",
    cursor: "crosshair",
    creates: "die" as CompType,
    icon: COMP_ICONS.die,
  },
  {
    id: "pawn" as const,
    label: "Pawn",
    cursor: "crosshair",
    creates: "pawn" as CompType,
    icon: COMP_ICONS.pawn,
  },
  {
    id: "text" as const,
    label: "Title / Text (T)",
    cursor: "text",
    creates: "text" as CompType,
    icon: COMP_ICONS.text,
  },
] as const;

export type ToolId = (typeof TOOLS)[number]["id"];

// ── Shape renderer (used in editor + previews) ────────────────────────────────

