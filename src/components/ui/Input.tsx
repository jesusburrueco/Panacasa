import { InputHTMLAttributes, ReactNode, forwardRef, useId } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: string;
  endAdornment?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, endAdornment, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="ml-1 block font-sans text-label-md text-on-surface-variant"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && (
            <span className="material-symbols-outlined pointer-events-none absolute left-4 text-[20px] text-outline">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            aria-invalid={Boolean(error)}
            className={cn(
              "w-full rounded-DEFAULT border-none bg-surface-container-low px-4 py-3.5 font-sans text-body-md text-on-surface shadow-inset placeholder:text-outline-variant/60 transition-all focus:outline-none focus:ring-2 focus:ring-primary-container/20",
              icon && "pl-12",
              Boolean(endAdornment) && "pr-12",
              error && "ring-2 ring-error/60 focus:ring-error/60",
              className
            )}
            {...props}
          />
          {endAdornment && (
            <div className="absolute right-4 flex items-center">{endAdornment}</div>
          )}
        </div>
        {error && (
          <p className="ml-1 font-sans text-label-sm text-error">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
