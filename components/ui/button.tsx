import type { ButtonHTMLAttributes, ComponentProps } from "react";
import Link from "next/link";
import { LoaderCircle } from "lucide-react";

import { cn } from "./cn";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "border border-indigo-400/20 bg-indigo-500 text-white shadow-[0_8px_24px_rgba(79,70,229,0.2)] hover:bg-indigo-400 active:bg-indigo-600",
  secondary:
    "border border-white/[0.08] bg-white/[0.07] text-slate-100 hover:border-white/[0.14] hover:bg-white/[0.1] active:bg-white/[0.06]",
  outline:
    "border border-white/[0.12] bg-transparent text-slate-200 hover:border-indigo-400/40 hover:bg-indigo-400/[0.08] hover:text-white",
  ghost:
    "border border-transparent bg-transparent text-slate-400 hover:bg-white/[0.06] hover:text-slate-100",
  danger:
    "border border-red-400/20 bg-red-500/15 text-red-200 hover:border-red-400/30 hover:bg-red-500/25",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 gap-1.5 rounded-xl px-3 text-xs",
  md: "h-10 gap-2 rounded-xl px-4 text-sm",
  lg: "h-12 gap-2.5 rounded-[14px] px-5 text-sm",
  icon: "size-10 rounded-xl p-0",
};

export function buttonStyles({
  variant = "primary",
  size = "md",
  fullWidth,
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
} = {}) {
  return cn(
    "inline-flex shrink-0 items-center justify-center whitespace-nowrap font-medium outline-none transition-[color,background-color,border-color,box-shadow,transform] duration-150 focus-visible:ring-2 focus-visible:ring-indigo-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#080b13] disabled:pointer-events-none disabled:opacity-45 motion-reduce:transition-none",
    variantClasses[variant],
    sizeClasses[size],
    fullWidth && "w-full",
    className,
  );
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  loadingLabel?: string;
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  fullWidth,
  loading = false,
  loadingLabel = "در حال انجام…",
  disabled,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonStyles({ variant, size, fullWidth, className })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? (
        <>
          <LoaderCircle
            className="size-4 animate-spin motion-reduce:animate-none"
            aria-hidden="true"
          />
          <span>{loadingLabel}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}

export interface ButtonLinkProps
  extends Omit<ComponentProps<typeof Link>, "className"> {
  className?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

export function ButtonLink({
  className,
  variant = "primary",
  size = "md",
  fullWidth,
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={buttonStyles({ variant, size, fullWidth, className })}
      {...props}
    >
      {children}
    </Link>
  );
}
