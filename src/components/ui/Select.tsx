import { SelectHTMLAttributes, forwardRef, useId } from "react";
import { cn } from "@/lib/utils";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, id, children, ...props }, ref) => {
    const generatedId = useId();
    const selectId = id ?? generatedId;

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="ml-1 block font-sans text-label-md text-on-surface-variant"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            aria-invalid={Boolean(error)}
            className={cn(
              "w-full appearance-none rounded-DEFAULT border-none bg-surface-container-low px-4 py-3.5 pr-10 font-sans text-body-md text-on-surface shadow-inset transition-all focus:outline-none focus:ring-2 focus:ring-primary-container/20",
              error && "ring-2 ring-error/60 focus:ring-error/60",
              className
            )}
            {...props}
          >
            {children}
          </select>
          <svg
            className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-outline"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        {error && (
          <p className="ml-1 font-sans text-label-sm text-error">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
