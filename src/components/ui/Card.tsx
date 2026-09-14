import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, interactive = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-lg bg-surface-container-low p-6 shadow-soft",
          interactive &&
            "transition-transform duration-300 hover:scale-[1.02] cursor-pointer",
          className
        )}
        {...props}
      />
    );
  }
);

Card.displayName = "Card";
