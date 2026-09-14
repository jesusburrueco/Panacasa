import { useId } from "react";
import { cn } from "@/lib/utils";

export interface RadioOption {
  value: string;
  label: React.ReactNode;
  description?: React.ReactNode;
  disabled?: boolean;
}

export interface RadioGroupProps {
  name: string;
  options: RadioOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  className?: string;
}

export function RadioGroup({
  name,
  options,
  value,
  defaultValue,
  onChange,
  className,
}: RadioGroupProps) {
  const groupId = useId();

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {options.map((option) => {
        const optionId = `${groupId}-${option.value}`;

        return (
          <label
            key={option.value}
            htmlFor={optionId}
            className={cn(
              "flex items-center justify-between gap-4 rounded-lg bg-surface-container-low p-4 shadow-soft transition-all",
              option.disabled
                ? "cursor-not-allowed opacity-50"
                : "cursor-pointer hover:shadow-soft-lg"
            )}
          >
            <div className="flex flex-col gap-0.5">
              <span className="font-sans text-label-md text-on-surface">
                {option.label}
              </span>
              {option.description && (
                <span className="font-sans text-label-sm text-on-surface-variant">
                  {option.description}
                </span>
              )}
            </div>
            <input
              id={optionId}
              type="radio"
              name={name}
              value={option.value}
              disabled={option.disabled}
              checked={value !== undefined ? value === option.value : undefined}
              defaultChecked={
                value === undefined && defaultValue === option.value
              }
              onChange={() => onChange?.(option.value)}
              className="form-radio h-6 w-6 shrink-0 cursor-pointer border-2 border-outline-variant bg-surface text-tertiary-container focus:ring-2 focus:ring-tertiary-container/40 focus:ring-offset-0"
            />
          </label>
        );
      })}
    </div>
  );
}
