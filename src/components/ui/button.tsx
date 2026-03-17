import * as React from "react";

import { cn } from "@/lib/utils";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline" | "secondary";
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex h-10 items-center justify-center rounded-lg px-4 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
          variant === "default" && "bg-slate-900 text-white shadow-soft hover:bg-slate-800",
          variant === "outline" && "border border-slate-200 bg-white text-slate-900 hover:bg-slate-50",
          variant === "secondary" && "bg-slate-100 text-slate-900 hover:bg-slate-200",
          className,
        )}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";
