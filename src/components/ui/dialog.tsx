"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

// Minimal accessible modal (no Radix dep). Closes on backdrop click + Esc.
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) {
      document.addEventListener("keydown", onKey);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center">
      <div className="fixed inset-0 bg-navy/40 backdrop-blur-sm" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative z-10 my-8 w-full max-w-lg rounded-lg border border-border bg-white shadow-xl",
          className
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border p-5">
          <div>
            {title && (
              <h2 className="font-display text-xl font-semibold text-ink">{title}</h2>
            )}
            {description && (
              <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-ink"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
