"use client";

import { useRef, useState, useCallback, forwardRef, useImperativeHandle } from "react";
import { cn } from "@/lib/utils";

export interface OtpInputProps {
  length?: number;
  value?: string;
  onChange?: (value: string | React.ChangeEvent<HTMLInputElement>) => void; 
  onComplete?: (value: string) => void;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  error?: boolean;
  errorMessage?: string | undefined;
  hint?: string | undefined;
  label?: string | undefined;
  disabled?: boolean | undefined;
  className?: string | undefined;
  name?: string | undefined;
}

export interface OtpInputHandle {
  focus: () => void;
  clear: () => void;
}

export const OtpInput = forwardRef<OtpInputHandle, OtpInputProps>(
  (
    {
      length = 6,
      value = "",
      onChange,
      onComplete,
      error,
      errorMessage,
      hint,
      label,
      disabled,
      className,
    },
    ref
  ) => {
    const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
    const [digits, setDigits] = useState<string[]>(() =>
      Array.from({ length }, (_, i) => value[i] ?? "")
    );

    useImperativeHandle(ref, () => ({
      focus: () => inputsRef.current[0]?.focus(),
      clear: () => {
        const empty = Array(length).fill("");
        setDigits(empty);
        onChange?.("");
        inputsRef.current[0]?.focus();
      },
    }));

    const emit = useCallback(
      (next: string[]) => {
        const joined = next.join("");
        onChange?.(joined);
        if (joined.length === length) onComplete?.(joined);
      },
      [length, onChange, onComplete]
    );

    const handleChange = (index: number, char: string) => {
      // Allow only alphanumeric
      const val = char.replace(/[^a-zA-Z0-9]/g, "").slice(-1).toUpperCase();
      const next = [...digits];
      next[index] = val;
      setDigits(next);
      emit(next);
      if (val && index < length - 1) {
        inputsRef.current[index + 1]?.focus();
      }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace") {
        if (digits[index]) {
          const next = [...digits];
          next[index] = "";
          setDigits(next);
          emit(next);
        } else if (index > 0) {
          inputsRef.current[index - 1]?.focus();
          const next = [...digits];
          next[index - 1] = "";
          setDigits(next);
          emit(next);
        }
      } else if (e.key === "ArrowLeft" && index > 0) {
        inputsRef.current[index - 1]?.focus();
      } else if (e.key === "ArrowRight" && index < length - 1) {
        inputsRef.current[index + 1]?.focus();
      }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
      e.preventDefault();
      const pasted = e.clipboardData
        .getData("text")
        .replace(/[^a-zA-Z0-9]/g, "")
        .toUpperCase()
        .slice(0, length);

      const next = Array.from({ length }, (_, i) => pasted[i] ?? "");
      setDigits(next);
      emit(next);

      const focusIndex = Math.min(pasted.length, length - 1);
      inputsRef.current[focusIndex]?.focus();
    };

    return (
      <div className={cn("flex flex-col gap-1.5 w-full", className)}>
        {label && (
          <label className="text-2xs font-ui font-semibold text-parchment-mid uppercase tracking-wider">
            {label}
          </label>
        )}

        <div className="flex items-center justify-between gap-4 max-md:gap-2">
          {Array.from({ length }).map((_, i) => (
            <input
              key={i}
              ref={(el) => { inputsRef.current[i] = el; }}
              type="text"
              inputMode="text"
              maxLength={1}
              value={digits[i]}
              disabled={disabled}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={handlePaste}
              onFocus={(e) => e.target.select()}
              aria-label={`OTP digit ${i + 1}`}
              className={cn(
                "v-input",
                "w-13 h-12 text-center text-base font-mono tracking-widest px-0",
                "caret-transparent",
                error && "input-error",
              )}
            />
          ))}
        </div>

        {errorMessage && (
          <p className="text-2xs text-crimson-flame font-ui">{errorMessage}</p>
        )}
        {hint && !errorMessage && (
          <p className="text-2xs text-soft-gray-dark font-ui">{hint}</p>
        )}
      </div>
    );
  }
);
OtpInput.displayName = "OtpInput";