import { format, isPast, isToday } from "date-fns";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge, PriorityBadge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { overallProgress } from "@/lib/stats";
import { cn } from "@/lib/utils";
import type { AppUser, TaskStatus, TaskWithRelations } from "@/lib/types";

// Read-only, public breakdown of every member's tasks grouped by status.
// Renders on the home page so anyone (logged in or not) can see who's on what.
// No interactivity — it's a display, not the editable dashboard.

const COLUMNS: { key: TaskStatus; label: string; dot: string }[] = [
  { key: "pending", label: "Pending", dot: "bg-amber-400" },
  { key: "in_progress", label: "In progress", dot: "bg-blue-500" },
  { key: "done", label: "Done", dot: "bg-emerald-500" },
];

function TaskLine({ task }: { task: TaskWithRelations }) {
  const due = task.due_date ? new Date(task.due_date) : null;
  const overdue = due && task.status !== "done" && isPast(due) && !isToday(due);
  return (
    <div className="rounded-md border border-border bg-white p-2.5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium leading-snug text-ink">{task.title}</p>
        <PriorityBadge priority={task.priority} />
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        {task.category?.name && <span>{task.category.name}</span>}
        {due && (
          <span className={cn(overdue && "font-medium text-rose-600")}>
            {overdue ? "Overdue · " : "Due "}
            {format(due, "d MMM")}
          </span>
        )}
      </div>
    </div>
  );
}

export function PublicMemberBreakdown({
  users,
  tasks,
}: {
  users: AppUser[];
  tasks: TaskWithRelations[];
}) {
  // Only show members who actually have tasks assigned.
  const rows = users
    .map((u) => ({ user: u, tasks: tasks.filter((t) => t.assigned_to === u.id) }))
    .filter((r) => r.tasks.length > 0);

  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Once tasks are assigned, each member&rsquo;s workload appears here.
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {rows.map(({ user, tasks: userTasks }) => {
        const stat = overallProgress(userTasks);
        const grouped: Record<TaskStatus, TaskWithRelations[]> = {
          pending: userTasks.filter((t) => t.status === "pending"),
          in_progress: userTasks.filter((t) => t.status === "in_progress"),
          done: userTasks.filter((t) => t.status === "done"),
        };

        return (
          <div
            key={user.id}
            className="rounded-lg border border-border bg-card p-5 shadow-sm"
          >
            {/* Member header + personal progress */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Avatar initials={user.initials} name={user.name} className="h-10 w-10" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-ink">{user.name}</span>
                    {user.role === "admin" && (
                      <span className="rounded bg-gold/20 px-1.5 py-0.5 text-[10px] font-semibold text-gold-600">
                        ADMIN
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {stat.done} of {stat.total} done
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-display text-xl font-semibold text-navy">
                  {stat.percent}%
                </div>
              </div>
            </div>
            <Progress value={stat.percent} className="mt-3" barClassName="bg-navy" />

            {/* Tasks grouped by status */}
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {COLUMNS.map((col) => (
                <div key={col.key}>
                  <div className="mb-2 flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${col.dot}`} />
                    <span className="text-xs font-semibold text-ink">{col.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {grouped[col.key].length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {grouped[col.key].length === 0 ? (
                      <p className="rounded-md border border-dashed border-border px-2 py-3 text-center text-xs text-muted-foreground">
                        None
                      </p>
                    ) : (
                      grouped[col.key].map((t) => <TaskLine key={t.id} task={t} />)
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

