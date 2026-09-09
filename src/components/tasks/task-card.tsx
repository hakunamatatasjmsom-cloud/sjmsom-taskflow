"use client";

import { format, isPast, isToday } from "date-fns";
import { Calendar, MessageSquare } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge, PriorityBadge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { TaskWithRelations } from "@/lib/types";

// Card-based task tile used in lists and on the dashboard.
export function TaskCard({
  task,
  onOpen,
  showAssignee = true,
}: {
  task: TaskWithRelations;
  onOpen: (task: TaskWithRelations) => void;
  showAssignee?: boolean;
}) {
  const due = task.due_date ? new Date(task.due_date) : null;
  const overdue = due && task.status !== "done" && isPast(due) && !isToday(due);

  return (
    <button
      onClick={() => onOpen(task)}
      className="group w-full rounded-lg border border-border bg-card p-4 text-left shadow-sm transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-medium leading-snug text-ink group-hover:text-navy">
          {task.title}
        </h3>
        <PriorityBadge priority={task.priority} />
      </div>

      {task.description && (
        <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{task.description}</p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <StatusBadge status={task.status} />
        {task.category?.name && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {task.category.name}
          </span>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
        <div className="flex items-center gap-2">
          {showAssignee && (
            <>
              <Avatar
                initials={task.assignee?.initials}
                name={task.assignee?.name}
                className="h-6 w-6 text-[10px]"
              />
              <span className="text-xs text-muted-foreground">
                {task.assignee?.name ?? "Unassigned"}
              </span>
            </>
          )}
        </div>
        {due && (
          <span
            className={cn(
              "flex items-center gap-1 text-xs",
              overdue ? "font-medium text-rose-600" : "text-muted-foreground"
            )}
          >
            <Calendar className="h-3.5 w-3.5" />
            {overdue ? "Overdue · " : ""}
            {format(due, "d MMM")}
          </span>
        )}
      </div>
    </button>
  );
}
