import { cn } from "@/lib/utils";
import {
  PRIORITY_LABELS,
  STATUS_LABELS,
  type TaskPriority,
  type TaskStatus,
} from "@/lib/types";

// Color-coded status badge per the brief:
// pending = amber/grey, in progress = blue, done = green.
const STATUS_STYLES: Record<TaskStatus, string> = {
  pending: "bg-amber-50 text-amber-700 ring-amber-600/20",
  in_progress: "bg-blue-50 text-blue-700 ring-blue-600/20",
  done: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
};

export function StatusBadge({ status, className }: { status: TaskStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        STATUS_STYLES[status],
        className
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          status === "pending" && "bg-amber-500",
          status === "in_progress" && "bg-blue-500",
          status === "done" && "bg-emerald-500"
        )}
      />
      {STATUS_LABELS[status]}
    </span>
  );
}

const PRIORITY_STYLES: Record<TaskPriority, string> = {
  low: "bg-slate-50 text-slate-600 ring-slate-500/20",
  medium: "bg-sky-50 text-sky-700 ring-sky-600/20",
  high: "bg-orange-50 text-orange-700 ring-orange-600/20",
  urgent: "bg-rose-50 text-rose-700 ring-rose-600/20",
};

export function PriorityBadge({
  priority,
  className,
}: {
  priority: TaskPriority;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        PRIORITY_STYLES[priority],
        className
      )}
    >
      {PRIORITY_LABELS[priority]}
    </span>
  );
}
