import Link from "next/link";
import { cn } from "@/lib/utils";

// Wordmark: a small gold monogram tile + the TaskFlow lockup.
export function Brand({
  href = "/",
  variant = "dark",
  className,
}: {
  href?: string;
  variant?: "dark" | "light";
  className?: string;
}) {
  return (
    <Link href={href} className={cn("group inline-flex items-center gap-2.5", className)}>
      <span className="grid h-9 w-9 place-items-center rounded-md bg-gold font-display text-lg font-semibold text-navy">
        S
      </span>
      <span className="leading-none">
        <span
          className={cn(
            "block font-display text-lg font-semibold tracking-tight",
            variant === "dark" ? "text-ink" : "text-white"
          )}
        >
          TaskFlow
        </span>
        <span
          className={cn(
            "block text-[11px] font-medium tracking-wide",
            variant === "dark" ? "text-muted-foreground" : "text-white/60"
          )}
        >
          SJMSOM · IIT Bombay
        </span>
      </span>
    </Link>
  );
}
