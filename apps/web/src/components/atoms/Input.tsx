import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  hint?: string | undefined;
  errorMessage?: string | undefined;
  label?: string | undefined;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, label, hint, errorMessage, id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label
            htmlFor={id}
            className="text-2xs font-ui font-semibold text-parchment-mid uppercase tracking-wider"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            "v-input",
            error && "input-error",
            className
          )}
          {...props}
        />
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
Input.displayName = "Input";
