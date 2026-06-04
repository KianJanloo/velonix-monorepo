"use client";

import { useRef } from "react";
import Image from "next/image";
import { useImageUpload } from "@/hooks/useUpload";

interface ImageUploadFieldProps {
  value: string | null | undefined;
  onChange: (url: string | null) => void;
  label?: string;
  /** "avatar" = round preview, "cover" = wide preview, "tile" = square */
  shape?: "avatar" | "cover" | "tile";
  hint?: string;
}

export function ImageUploadField({ value, onChange, label, shape = "cover", hint }: ImageUploadFieldProps) {
  const { upload, uploading } = useImageUpload();
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await upload(file);
    if (url) onChange(url);
    e.target.value = "";
  }

  const previewClass =
    shape === "avatar" ? "w-16 h-16 rounded-full"
    : shape === "tile" ? "w-20 h-20 rounded-lg"
    : "w-full h-32 rounded-lg";

  return (
    <div>
      {label && <span className="text-2xs font-ui font-semibold text-parchment-mid uppercase tracking-wider block mb-1.5">{label}</span>}
      <div className={shape === "avatar" ? "flex items-center gap-4" : "space-y-2"}>
        {/* Preview */}
        <div className={`relative ${previewClass} bg-warm-wood/40 border border-warm-wood overflow-hidden flex items-center justify-center shrink-0`}>
          {value ? (
            <Image src={value} alt="preview" fill unoptimized className="object-cover" />
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-warm-wood-light">
              <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.3"/>
              <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" opacity="0.5"/>
              <path d="M3 16l5-5 4 4 3-3 6 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>
            </svg>
          )}
        </div>

        {/* Controls */}
        <div className="flex-1 min-w-0">
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="px-3 py-2 rounded-lg bg-emerald-ghost border border-emerald-glow/20 text-emerald-glow text-xs font-ui font-semibold hover:bg-emerald-glow hover:text-deep-void transition-all disabled:opacity-50 inline-flex items-center gap-2"
            >
              {uploading ? (
                <><span className="w-3.5 h-3.5 border-2 border-emerald-glow/40 border-t-emerald-glow rounded-full animate-spin" /> Uploading…</>
              ) : (
                <><svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 16V4m0 0L7 9m5-5l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M4 17v2a1 1 0 001 1h14a1 1 0 001-1v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg> {value ? "Replace" : "Upload"}</>
              )}
            </button>
            {value && (
              <button type="button" onClick={() => onChange(null)} className="px-3 py-2 rounded-lg border border-warm-wood text-soft-gray text-xs font-ui hover:text-crimson-flame hover:border-crimson-flame/40 transition-colors">
                Remove
              </button>
            )}
          </div>
          {hint && <p className="text-2xs text-soft-gray-dark font-ui mt-1.5">{hint}</p>}
        </div>
      </div>
    </div>
  );
}
