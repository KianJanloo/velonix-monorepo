"use client";

import { useState } from "react";

import Link from "next/link";

import {
  useCollaborators,
  useInviteCollaborator,
  useUpdateCollaboratorRole,
  useRemoveCollaborator,
} from "@/hooks/useCollaborators";

import { usePlan } from "@/hooks/usePlan";

import type { PresenceMember } from "@/hooks/useStudioCollab";

import type { CollaboratorRole } from "@velonix/types";

export function PresenceAvatar({ member }: { member: PresenceMember }) {
  const initials = (member.displayName || member.username || "?")

    .slice(0, 2)

    .toUpperCase();

  const ring =
    member.role === "owner"
      ? "ring-royal-gold"
      : member.role === "viewer"
        ? "ring-soft-gray"
        : "ring-emerald-glow";

  return (
    <div
      className={`w-6 h-6 rounded-full bg-warm-wood border border-rich-wood-dark ring-1 ${ring} overflow-hidden flex items-center justify-center text-[9px] font-ui font-bold text-parchment-light z-10`}
      title={`${member.displayName} · ${member.role}`}
    >
      {member.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element

        <img
          src={member.avatarUrl}
          alt={member.displayName}
          className="w-full h-full object-cover"
        />
      ) : (
        initials
      )}
    </div>
  );
}

export function ShareDialog({
  gameId,

  onClose,
}: {
  gameId: string;

  onClose: () => void;
}) {
  const plan = usePlan();

  const { data: collaborators, isLoading } = useCollaborators(gameId);

  const invite = useInviteCollaborator(gameId);

  const updateRole = useUpdateCollaboratorRole(gameId);

  const remove = useRemoveCollaborator(gameId);

  const [identifier, setIdentifier] = useState("");

  const [role, setRole] = useState<CollaboratorRole>("editor");

  const max = plan.limits.maxCollaborators;

  const used = collaborators?.length ?? 0;

  const full = used >= max;

  function submit() {
    const id = identifier.trim();

    if (!id || full) return;

    invite.mutate(
      { identifier: id, role },

      { onSuccess: () => setIdentifier("") },
    );
  }

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="v-card w-full max-w-md p-6 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-1">
          <h2 className="font-display text-lg font-bold text-parchment-light">
            Share studio
          </h2>

          <button
            onClick={onClose}
            className="text-soft-gray hover:text-parchment-light p-1 -mr-1"
            title="Close"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M3 3l10 10M13 3L3 13"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <p className="text-2xs text-soft-gray font-ui mb-5">
          Invite people to co-edit this game in real time. {plan.label} plan ·{" "}
          {used}/{max} collaborator seat{max === 1 ? "" : "s"} used.
        </p>

        {/* Invite form */}

        <div className="flex gap-2 mb-2">
          <input
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
            }}
            placeholder="Email or username"
            disabled={full}
            className="v-input text-sm flex-1 disabled:opacity-50"
          />

          <select
            value={role}
            onChange={(e) => setRole(e.target.value as CollaboratorRole)}
            disabled={full}
            className="v-input text-sm w-24 disabled:opacity-50"
          >
            <option value="editor">Editor</option>

            <option value="viewer">Viewer</option>
          </select>
        </div>

        <button
          onClick={submit}
          disabled={full || !identifier.trim() || invite.isPending}
          className="w-full py-2 rounded-lg bg-emerald-glow text-deep-void text-2xs font-ui font-bold hover:bg-emerald-bright transition-all disabled:opacity-40 mb-1"
        >
          {invite.isPending ? "Inviting…" : "Send invite"}
        </button>

        {full && (
          <p className="text-2xs text-royal-gold font-ui text-center mb-2">
            Seat limit reached for your plan.{" "}
            <Link href="/pricing" className="underline">
              Upgrade
            </Link>{" "}
            for more.
          </p>
        )}

        {/* List */}

        <div className="mt-4 border-t border-warm-wood pt-4 space-y-2">
          <p className="text-2xs font-ui font-semibold text-soft-gray uppercase tracking-wider">
            Collaborators
          </p>

          {isLoading ? (
            <p className="text-2xs text-soft-gray-dark font-ui py-2">
              Loading…
            </p>
          ) : !collaborators || collaborators.length === 0 ? (
            <p className="text-2xs text-soft-gray-dark font-ui py-2">
              No collaborators yet. Invite someone above.
            </p>
          ) : (
            collaborators.map((c) => (
              <div key={c.id} className="flex items-center gap-2.5 py-1.5">
                <div className="w-8 h-8 rounded-full bg-warm-wood overflow-hidden flex items-center justify-center text-2xs font-ui font-bold text-parchment-light shrink-0">
                  {c.user?.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element

                    <img
                      src={c.user.avatarUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    (c.user?.displayName ?? "?").slice(0, 2).toUpperCase()
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-2xs font-ui font-semibold text-parchment-light truncate">
                    {c.user?.displayName ?? c.userId}
                  </p>

                  <p className="text-[10px] text-soft-gray-dark font-ui truncate">
                    @{c.user?.username}
                  </p>
                </div>

                <select
                  value={c.role}
                  onChange={(e) =>
                    updateRole.mutate({
                      userId: c.userId,

                      role: e.target.value as CollaboratorRole,
                    })
                  }
                  className="v-input text-2xs !py-1 w-20 shrink-0"
                >
                  <option value="editor">Editor</option>

                  <option value="viewer">Viewer</option>
                </select>

                <button
                  onClick={() => remove.mutate(c.userId)}
                  title="Remove"
                  className="p-1 rounded text-soft-gray-dark hover:text-crimson-flame shrink-0"
                >
                  <svg width="13" height="13" viewBox="0 0 12 12" fill="none">
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
            ))
          )}
        </div>
      </div>
    </div>
  );
}
