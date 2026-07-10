import type { HTMLAttributes } from "react";

import { cn } from "./cn";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  elevated?: boolean;
}

export function Card({
  className,
  interactive = false,
  elevated = false,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/[0.075] bg-[#0d121e] text-slate-100",
        elevated && "shadow-[0_18px_50px_rgba(0,0,0,0.24)]",
        interactive &&
          "transition-[border-color,background-color,transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-indigo-400/25 hover:bg-[#101625] hover:shadow-[0_18px_45px_rgba(0,0,0,0.18)] motion-reduce:transform-none motion-reduce:transition-none",
        className,
      )}
      {...props}
    />
  );
}

export function Surface({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/[0.07] bg-white/[0.035]",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5 pb-3 sm:p-6 sm:pb-3", className)} {...props} />;
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-5 py-3 sm:px-6", className)} {...props} />;
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-center border-t border-white/[0.06] px-5 py-4 sm:px-6",
        className,
      )}
      {...props}
    />
  );
}
