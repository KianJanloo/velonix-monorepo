"use client";

import { useState, memo } from "react";

import { COMP_ICONS } from "../core";

import type { CanvasComp } from "../core";

import { EyeOpen, EyeOff, LockClosed, LockOpen } from "./controls";

interface LayersPanelProps {
  components: CanvasComp[]; // already reversed (top layer first)
  total: number;
  selectedId: string | null;
  renamingId: string | null;
  onSelect: (id: string) => void;
  onStartRename: (id: string | null) => void;
  onChange: (id: string, patch: Partial<CanvasComp>, history?: boolean) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, dir: "up" | "down") => void;
  onUngroup: (groupId: string) => void;
}

interface LayerRowProps {
  c: CanvasComp;
  idx: number;
  total: number;
  indent: number;
  selectedId: string | null;
  renamingId: string | null;
  onSelect: (id: string) => void;
  onStartRename: (id: string | null) => void;
  onChange: (id: string, patch: Partial<CanvasComp>, history?: boolean) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, dir: "up" | "down") => void;
}

function LayerRowImpl({
  c,

  idx,

  total,

  indent,

  selectedId,

  renamingId,

  onSelect,

  onStartRename,

  onChange,

  onDelete,

  onMove,
}: LayerRowProps) {
  const sel = selectedId === c.id;

  return (
    <div
      onClick={() => onSelect(c.id)}
      style={{ paddingLeft: 8 + indent * 16 }}
      className={`flex items-center gap-1.5 pr-1 py-1.5 rounded-lg mb-0.5 cursor-pointer group transition-colors ${sel ? "bg-emerald-ghost text-emerald-glow ring-1 ring-emerald-glow/30" : "text-soft-gray hover:bg-warm-wood hover:text-parchment-light"} ${!c.visible ? "opacity-50" : ""}`}
    >
      <span className={`shrink-0 ${sel ? "text-emerald-glow" : "opacity-60"}`}>
        {COMP_ICONS[c.type]}
      </span>

      {renamingId === c.id ? (
        <input
          autoFocus
          defaultValue={c.name}
          onClick={(e) => e.stopPropagation()}
          onBlur={(e) => {
            onChange(c.id, { name: e.target.value.trim() || c.name });

            onStartRename(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === "Escape")
              (e.target as HTMLInputElement).blur();
          }}
          className="flex-1 min-w-0 bg-deep-void/60 border border-emerald-glow/40 rounded px-1 py-0.5 text-2xs font-ui text-parchment-light outline-none"
        />
      ) : (
        <span
          className="text-2xs font-ui truncate flex-1 min-w-0 select-none"
          onDoubleClick={(e) => {
            e.stopPropagation();

            onStartRename(c.id);
          }}
          title="Double-click to rename"
        >
          {c.name}

          {c.quantity > 1 && (
            <span className="ml-1 text-[10px] text-soft-gray-dark">
              ×{c.quantity}
            </span>
          )}
        </span>
      )}

      <div
        className={`flex items-center gap-0.5 shrink-0 ${sel ? "" : "opacity-0 group-hover:opacity-100"} transition-opacity`}
      >
        <button
          title="Bring forward"
          disabled={idx === 0}
          onClick={(e) => {
            e.stopPropagation();

            onMove(c.id, "up");
          }}
          className="p-1 rounded hover:bg-warm-wood-light text-soft-gray-dark hover:text-parchment-light disabled:opacity-25 disabled:hover:bg-transparent"
        >
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
            <path
              d="M6 2.5l3.5 4M6 2.5L2.5 6.5M6 2.5v7"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <button
          title="Send backward"
          disabled={idx === total - 1}
          onClick={(e) => {
            e.stopPropagation();

            onMove(c.id, "down");
          }}
          className="p-1 rounded hover:bg-warm-wood-light text-soft-gray-dark hover:text-parchment-light disabled:opacity-25 disabled:hover:bg-transparent"
        >
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
            <path
              d="M6 9.5l3.5-4M6 9.5L2.5 5.5M6 9.5v-7"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <button
          title={c.locked ? "Unlock" : "Lock"}
          onClick={(e) => {
            e.stopPropagation();

            onChange(c.id, { locked: !c.locked }, false);
          }}
          className={`p-1 rounded hover:bg-warm-wood-light ${c.locked ? "text-royal-gold" : "text-soft-gray-dark hover:text-parchment-light"}`}
        >
          {c.locked ? LockClosed : LockOpen}
        </button>

        <button
          title={c.visible ? "Hide" : "Show"}
          onClick={(e) => {
            e.stopPropagation();

            onChange(c.id, { visible: !c.visible }, false);
          }}
          className="p-1 rounded hover:bg-warm-wood-light text-soft-gray-dark hover:text-parchment-light"
        >
          {c.visible ? EyeOpen : EyeOff}
        </button>

        <button
          title="Delete"
          onClick={(e) => {
            e.stopPropagation();

            onDelete(c.id);
          }}
          className="p-1 rounded hover:bg-crimson-flame/20 text-soft-gray-dark hover:text-crimson-flame"
        >
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
            <path
              d="M2.5 3.5h7M5 3.5V2.5h2v1M3.5 3.5l.4 6h4.2l.4-6"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

/** Memoized: with hundreds of layers, only the row(s) that actually changed
 * (selection, visibility, rename) re-render instead of the whole list. */
const LayerRow = memo(LayerRowImpl);

export function LayersPanel({
  components,

  total,

  selectedId,

  renamingId,

  onSelect,

  onStartRename,

  onChange,

  onDelete,

  onMove,

  onUngroup,
}: LayersPanelProps) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggleCollapse = (gid: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);

      next.has(gid) ? next.delete(gid) : next.add(gid);

      return next;
    });

  if (total === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 px-4 text-center">
        <svg
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="none"
          className="text-soft-gray-dark"
        >
          <path
            d="M12 3l9 5-9 5-9-5 9-5z"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinejoin="round"
          />

          <path
            d="M3 13l9 5 9-5"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinejoin="round"
            opacity="0.5"
          />
        </svg>

        <p className="text-2xs text-soft-gray-dark font-ui">No layers yet</p>

        <p className="text-[10px] text-soft-gray-dark font-ui leading-relaxed">
          Add pieces from the <span className="text-soft-gray">Parts</span> tab
          or draw on the canvas.
        </p>
      </div>
    );
  }

  // Build a display list: each group becomes one parent node (at its top-most

  // member's position) with its members nested underneath.

  type Node =
    | { type: "leaf"; c: CanvasComp }
    | { type: "group"; groupId: string; members: CanvasComp[] };

  const seen = new Set<string>();

  const nodes: Node[] = [];

  for (const c of components) {
    if (c.groupId) {
      if (seen.has(c.groupId)) continue;

      seen.add(c.groupId);

      nodes.push({
        type: "group",

        groupId: c.groupId,

        members: components.filter((x) => x.groupId === c.groupId),
      });
    } else {
      nodes.push({ type: "leaf", c });
    }
  }

  const idxOf = (c: CanvasComp) => components.indexOf(c);

  const rowProps = {
    total: components.length,

    selectedId,

    renamingId,

    onSelect,

    onStartRename,

    onChange,

    onDelete,

    onMove,
  };

  return (
    <div className="py-1.5">
      <div className="flex items-center justify-between px-3 pb-1.5">
        <span className="text-[10px] text-soft-gray-dark font-ui uppercase tracking-[0.1em]">
          {total} layer{total === 1 ? "" : "s"}
        </span>

        <span className="text-[10px] text-soft-gray-dark font-ui">
          top → bottom
        </span>
      </div>

      <div className="px-1.5">
        {nodes.map((node) => {
          if (node.type === "leaf") {
            return (
              <LayerRow
                key={node.c.id}
                c={node.c}
                idx={idxOf(node.c)}
                indent={0}
                {...rowProps}
              />
            );
          }

          const isOpen = !collapsed.has(node.groupId);

          const groupSel = node.members.some((m) => m.id === selectedId);

          const allHidden = node.members.every((m) => !m.visible);

          return (
            <div key={node.groupId} className="mb-0.5">
              {/* Group header */}

              <div
                onClick={() => onSelect(node.members[0]!.id)}
                className={`flex items-center gap-1 pl-1 pr-1 py-1.5 rounded-lg cursor-pointer group transition-colors ${groupSel ? "bg-[rgba(124,92,255,0.14)] text-[#a78bff] ring-1 ring-[rgba(124,92,255,0.4)]" : "text-soft-gray hover:bg-warm-wood hover:text-parchment-light"}`}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();

                    toggleCollapse(node.groupId);
                  }}
                  className="p-0.5 shrink-0 text-soft-gray-dark hover:text-parchment-light"
                  title={isOpen ? "Collapse" : "Expand"}
                >
                  <svg
                    width="9"
                    height="9"
                    viewBox="0 0 10 10"
                    fill="none"
                    style={{
                      transform: isOpen ? "rotate(90deg)" : "none",

                      transition: "transform .12s",
                    }}
                  >
                    <path d="M3 2l4 3-4 3z" fill="currentColor" />
                  </svg>
                </button>

                <span className="text-[#a78bff] shrink-0" title="Group">
                  ⛓
                </span>

                <span className="text-2xs font-ui font-semibold truncate flex-1 min-w-0">
                  Group{" "}
                  <span className="text-[10px] text-soft-gray-dark">
                    ({node.members.length})
                  </span>
                </span>

                <div
                  className={`flex items-center gap-0.5 shrink-0 ${groupSel ? "" : "opacity-0 group-hover:opacity-100"} transition-opacity`}
                >
                  <button
                    title="Show/hide group"
                    onClick={(e) => {
                      e.stopPropagation();

                      node.members.forEach((m) =>
                        onChange(m.id, { visible: allHidden }, false),
                      );
                    }}
                    className="p-1 rounded hover:bg-warm-wood-light text-soft-gray-dark hover:text-parchment-light"
                  >
                    {allHidden ? EyeOff : EyeOpen}
                  </button>

                  <button
                    title="Ungroup"
                    onClick={(e) => {
                      e.stopPropagation();

                      onUngroup(node.groupId);
                    }}
                    className="p-1 rounded hover:bg-warm-wood-light text-soft-gray-dark hover:text-parchment-light"
                  >
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                      <rect
                        x="1.5"
                        y="1.5"
                        width="4"
                        height="4"
                        rx="1"
                        stroke="currentColor"
                        strokeWidth="1.1"
                      />

                      <rect
                        x="6.5"
                        y="6.5"
                        width="4"
                        height="4"
                        rx="1"
                        stroke="currentColor"
                        strokeWidth="1.1"
                        strokeDasharray="1.5 1.3"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Members */}

              {isOpen &&
                node.members.map((m) => (
                  <LayerRow
                    key={m.id}
                    c={m}
                    idx={idxOf(m)}
                    indent={1}
                    {...rowProps}
                  />
                ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
