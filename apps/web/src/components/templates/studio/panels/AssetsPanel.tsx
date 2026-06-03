"use client";

import { useRef } from "react";

import { useImageUpload } from "@/hooks/useUpload";

interface AssetsPanelProps {
  assets: string[];
  appliedUrl: string | undefined;
  hasSelection: boolean;
  onUploaded: (url: string) => void;
  onApply: (url: string) => void;
  onRemoveFromComp: () => void;
  onDeleteAsset: (url: string) => void;
}

export function AssetsPanel({
  assets,

  appliedUrl,

  hasSelection,

  onUploaded,

  onApply,

  onRemoveFromComp,

  onDeleteAsset,
}: AssetsPanelProps) {
  const { upload, uploading } = useImageUpload();

  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);

    for (const file of files) {
      const uploaded = await upload(file);

      if (uploaded) onUploaded(uploaded);
    }

    e.target.value = "";
  }

  return (
    <div className="p-2.5">
      <div className="flex items-center justify-between px-1 mb-2">
        <p className="text-[10px] text-soft-gray-dark font-ui uppercase tracking-[0.1em]">
          Asset library
        </p>

        <span className="text-[10px] text-soft-gray-dark font-ui">
          {assets.length}
        </span>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFile}
      />

      <button
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="w-full py-4 rounded-xl border border-dashed border-warm-wood hover:border-emerald-glow/50 flex flex-col items-center gap-1.5 text-soft-gray hover:text-parchment-light transition-colors disabled:opacity-50 mb-2.5"
      >
        {uploading ? (
          <div className="w-5 h-5 border-2 border-warm-wood border-t-emerald-glow rounded-full animate-spin" />
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 16V4m0 0L7 9m5-5l5 5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            <path
              d="M4 17v2a1 1 0 001 1h14a1 1 0 001-1v-2"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        )}

        <span className="text-2xs font-ui">
          {uploading ? "Uploading…" : "Upload images"}
        </span>

        <span className="text-[10px] font-ui text-soft-gray-dark">
          PNG / JPG · max 5MB
        </span>
      </button>

      {!hasSelection && assets.length > 0 && (
        <p className="text-[10px] text-royal-gold/80 font-ui px-1 mb-2">
          Select a component to apply an image.
        </p>
      )}

      {assets.length === 0 ? (
        <p className="text-2xs text-soft-gray-dark font-ui text-center py-6 leading-relaxed">
          No assets yet.
          <br />
          Uploaded images appear here and can be reused across components.
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-1.5">
          {assets.map((url) => {
            const active = appliedUrl === url;

            return (
              <div key={url} className="relative group aspect-square">
                <button
                  onClick={() => onApply(url)}
                  disabled={!hasSelection}
                  title={
                    hasSelection
                      ? "Apply to selected component"
                      : "Select a component first"
                  }
                  className={`w-full h-full rounded-lg overflow-hidden border transition-all disabled:cursor-not-allowed ${active ? "border-emerald-glow ring-1 ring-emerald-glow" : "border-warm-wood hover:border-emerald-glow/50"}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}

                  <img
                    src={url}
                    alt="asset"
                    className="w-full h-full object-cover"
                  />
                </button>

                {active && (
                  <span className="absolute bottom-0.5 left-0.5 text-[9px] font-ui font-bold text-deep-void bg-emerald-glow rounded px-1 leading-tight pointer-events-none">
                    on
                  </span>
                )}

                <button
                  onClick={() => onDeleteAsset(url)}
                  title="Remove from library"
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-deep-void border border-warm-wood text-soft-gray-dark hover:text-crimson-flame hover:border-crimson-flame flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg width="7" height="7" viewBox="0 0 8 8" fill="none">
                    <path
                      d="M1 1l6 6M7 1L1 7"
                      stroke="currentColor"
                      strokeWidth="1.3"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {appliedUrl && (
        <button
          onClick={onRemoveFromComp}
          className="w-full mt-3 py-1.5 rounded-lg border border-warm-wood/60 text-soft-gray-dark hover:text-crimson-flame hover:border-crimson-flame/40 text-2xs font-ui transition-colors"
        >
          Remove image from component
        </button>
      )}
    </div>
  );
}

