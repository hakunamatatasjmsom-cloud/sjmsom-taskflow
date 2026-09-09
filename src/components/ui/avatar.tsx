import { cn } from "@/lib/utils";

// Initials avatar. Deterministic tint per person keeps the team page readable.
const TINTS = [
  "bg-navy text-white",
  "bg-maroon text-white",
  "bg-gold text-navy",
  "bg-navy-600 text-white",
  "bg-maroon-600 text-white",
];

export function Avatar({
  initials,
  name,
  className,
}: {
  initials?: string | null;
  name?: string | null;
  className?: string;
}) {
  const text = (initials || name?.slice(0, 2) || "?").toUpperCase();
  const tint = TINTS[(text.charCodeAt(0) || 0) % TINTS.length];
  return (
    <span
      className={cn(
        "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
        tint,
        className
      )}
      title={name ?? undefined}
    >
      {text}
    </span>
  );
}
