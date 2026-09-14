import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

const variantClasses = {
  primary:
    "bg-primary text-on-primary hover:brightness-110 active:scale-95 shadow-soft",
  secondary:
    "bg-secondary-container text-on-secondary-container hover:brightness-95 active:scale-95",
  outline:
    "bg-transparent border-2 border-primary text-primary hover:bg-primary/5 active:scale-95",
} as const;

const sizeClasses = {
  sm: "px-4 py-2 text-label-sm",
  md: "px-8 py-4 text-label-md",
  lg: "px-10 py-5 text-label-md",
} as const;

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variantClasses;
  size?: keyof typeof sizeClasses;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-full font-sans font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
