import * as React from "react";
import { cn } from "@/lib/utils";

// Simple, dependency-free progress bar.
export function Progress({
  value,
  className,
  barClassName,
}: {
  value: number;
  className?: string;
  barClassName?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-muted", className)}>
      <div
        className={cn("h-full rounded-full bg-navy transition-all duration-700", barClassName)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
