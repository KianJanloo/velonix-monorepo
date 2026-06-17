"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";

import { useAudioUpload } from "@/hooks/useUpload";

import type { VoiceNoteEntry } from "../core";

import { SectionLabel } from "./controls";

interface VoiceNotesPanelProps {
  notes: VoiceNoteEntry[];
  onChange: (notes: VoiceNoteEntry[]) => void;
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * Voice-note annotations for the selected component — record a quick
 * audio note (rules clarification, art direction, playtest feedback) right
 * on the piece it's about, instead of writing it down somewhere else.
 */
export function VoiceNotesPanel({ notes, onChange }: VoiceNotesPanelProps) {
  const { upload, uploading } = useAudioUpload();
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/mp4")
          ? "audio/mp4"
          : "";
      const rec = new MediaRecorder(
        stream,
        mime ? { mimeType: mime } : undefined,
      );
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        void finishRecording(mime || "audio/webm");
      };
      rec.start();
      recorderRef.current = rec;
      startRef.current = Date.now();
      setElapsed(0);
      setRecording(true);
      timerRef.current = setInterval(() => {
        setElapsed((Date.now() - startRef.current) / 1000);
      }, 200);
    } catch {
      toast.error(
        "Couldn't access the microphone. Check your browser permissions.",
      );
    }
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const finishRecording = async (mime: string) => {
    const durationSec = (Date.now() - startRef.current) / 1000;
    const blob = new Blob(chunksRef.current, { type: mime });
    if (blob.size < 200) {
      toast.error("Recording was too short — try again.");
      return;
    }
    const ext = mime.includes("mp4") ? "m4a" : "webm";
    const url = await upload(blob, `voice-note.${ext}`);
    if (!url) return;
    const entry: VoiceNoteEntry = {
      id: `vn-${Date.now()}`,
      url,
      durationSec,
      createdAt: Date.now(),
    };
    onChange([...notes, entry]);
    toast.success("Voice note added.");
  };

  const deleteNote = (id: string) => onChange(notes.filter((n) => n.id !== id));

  const updateTranscript = (id: string, transcript: string) =>
    onChange(notes.map((n) => (n.id === id ? { ...n, transcript } : n)));

  return (
    <div className="space-y-3">
      <SectionLabel>Voice notes</SectionLabel>

      <div className="v-card p-3 flex flex-col items-center gap-2">
        {recording ? (
          <button
            onClick={stopRecording}
            className="w-12 h-12 rounded-full bg-crimson-flame flex items-center justify-center animate-pulse"
            title="Stop recording"
          >
            <span className="block w-3.5 h-3.5 bg-white rounded-sm" />
          </button>
        ) : (
          <button
            onClick={startRecording}
            disabled={uploading}
            className="w-12 h-12 rounded-full bg-emerald-glow/90 hover:bg-emerald-glow flex items-center justify-center disabled:opacity-50"
            title="Record a voice note"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect x="6" y="2" width="6" height="10" rx="3" fill="#0a0a0a" />
              <path
                d="M3.5 9.5a5.5 5.5 0 0011 0M9 15v2"
                stroke="#0a0a0a"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
          </button>
        )}
        <span className="text-2xs font-ui text-soft-gray">
          {recording
            ? formatDuration(elapsed)
            : uploading
              ? "Uploading…"
              : "Tap to record"}
        </span>
      </div>

      {notes.length === 0 ? (
        <p className="text-2xs text-soft-gray-dark font-ui text-center py-2">
          No voice notes yet on this component.
        </p>
      ) : (
        <div className="space-y-2">
          {[...notes].reverse().map((n) => (
            <div key={n.id} className="v-card p-2.5 space-y-1.5">
              <div className="flex items-center gap-2">
                <audio controls src={n.url} className="flex-1 h-7" />
                <span className="text-2xs text-soft-gray-dark font-ui shrink-0">
                  {formatDuration(n.durationSec)}
                </span>
                <button
                  onClick={() => deleteNote(n.id)}
                  className="text-soft-gray-dark hover:text-crimson-flame shrink-0"
                  title="Delete voice note"
                >
                  <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                    <path
                      d="M3 4h8M5.5 4V2.8h3V4M4 4l.6 8h4.8L10 4"
                      stroke="currentColor"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
              <input
                value={n.transcript ?? ""}
                onChange={(e) => updateTranscript(n.id, e.target.value)}
                placeholder="Add a note about this recording…"
                className="v-input w-full text-2xs"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
