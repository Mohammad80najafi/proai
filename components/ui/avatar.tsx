import Image from "next/image";

import { cn } from "./cn";

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

const avatarSizes: Record<AvatarSize, { className: string; pixels: number }> = {
  xs: { className: "size-6 text-[9px]", pixels: 24 },
  sm: { className: "size-8 text-[11px]", pixels: 32 },
  md: { className: "size-10 text-xs", pixels: 40 },
  lg: { className: "size-14 text-base", pixels: 56 },
  xl: { className: "size-20 text-xl", pixels: 80 },
};

export interface AvatarProps {
  src?: string | null;
  alt: string;
  fallback?: string;
  size?: AvatarSize;
  className?: string;
  status?: "online" | "offline" | "busy";
}

export function Avatar({
  src,
  alt,
  fallback,
  size = "md",
  className,
  status,
}: AvatarProps) {
  const dimensions = avatarSizes[size];
  const initials =
    fallback ??
    alt
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.at(0))
      .join("");

  return (
    <span className={cn("relative inline-flex shrink-0", className)}>
      <span
        className={cn(
          "relative inline-flex overflow-hidden rounded-full border border-white/10 bg-slate-800 text-slate-200 ring-2 ring-[#080b13]",
          dimensions.className,
        )}
      >
        {src ? (
          <Image
            src={src}
            alt={alt}
            width={dimensions.pixels}
            height={dimensions.pixels}
            className="size-full object-cover"
            unoptimized
          />
        ) : (
          <span
            className="flex size-full items-center justify-center bg-gradient-to-br from-slate-700 to-slate-900 font-semibold"
            aria-label={alt}
          >
            {initials || "؟"}
          </span>
        )}
      </span>
      {status ? (
        <span
          className={cn(
            "absolute bottom-0 end-0 size-2.5 rounded-full border-2 border-[#080b13]",
            status === "online" && "bg-emerald-400",
            status === "offline" && "bg-slate-500",
            status === "busy" && "bg-orange-400",
          )}
          title={
            status === "online"
              ? "آنلاین"
              : status === "busy"
                ? "مشغول"
                : "آفلاین"
          }
        />
      ) : null}
    </span>
  );
}

export function AvatarGroup({
  users,
  max = 3,
  className,
}: {
  users: Array<Pick<AvatarProps, "src" | "alt" | "fallback">>;
  max?: number;
  className?: string;
}) {
  const visible = users.slice(0, max);
  const remaining = users.length - visible.length;

  return (
    <span className={cn("flex -space-x-2 space-x-reverse", className)}>
      {visible.map((user, index) => (
        <Avatar key={`${user.alt}-${index}`} {...user} size="sm" />
      ))}
      {remaining > 0 ? (
        <span className="relative z-10 inline-flex size-8 items-center justify-center rounded-full border border-white/10 bg-slate-800 text-[10px] font-semibold text-slate-300 ring-2 ring-[#080b13]">
          +{remaining.toLocaleString("fa-IR")}
        </span>
      ) : null}
    </span>
  );
}
