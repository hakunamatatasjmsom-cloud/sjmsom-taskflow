"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { TaskCard } from "@/components/tasks/task-card";
import { TaskDetail } from "@/components/tasks/task-detail";
import { TaskForm } from "@/components/tasks/task-form";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PRIORITY_ORDER, type AppUser, type Category, type TaskStatus, type TaskWithRelations } from "@/lib/types";

const COLUMNS: { key: TaskStatus; label: string; accent: string }[] = [
  { key: "pending", label: "Pending", accent: "bg-amber-400" },
  { key: "in_progress", label: "In progress", accent: "bg-blue-500" },
  { key: "done", label: "Done", accent: "bg-emerald-500" },
];

// Member dashboard: "My Tasks" grouped by status + a priority-sorted to-do list.
export function DashboardView({
  currentUser,
  tasks,
  users,
  categories,
}: {
  currentUser: AppUser;
  tasks: TaskWithRelations[];
  users: AppUser[];
  categories: Category[];
}) {
  const [selected, setSelected] = useState<TaskWithRelations | null>(null);
  const [creating, setCreating] = useState(false);

  const grouped = useMemo(() => {
    return {
      pending: tasks.filter((t) => t.status === "pending"),
      in_progress: tasks.filter((t) => t.status === "in_progress"),
      done: tasks.filter((t) => t.status === "done"),
    };
  }, [tasks]);

  // "What to do next": open tasks sorted by priority then due date.
  const todo = useMemo(() => {
    return tasks
      .filter((t) => t.status !== "done")
      .sort((a, b) => {
        const p = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
        if (p !== 0) return p;
        const ad = a.due_date ? +new Date(a.due_date) : Infinity;
        const bd = b.due_date ? +new Date(b.due_date) : Infinity;
        return ad - bd;
      })
      .slice(0, 6);
  }, [tasks]);

  const done = grouped.done.length;
  const percent = tasks.length ? Math.round((done / tasks.length) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">
            Hi, {currentUser.name.split(" ")[0]}
          </h1>
          <p className="mt-1 text-muted-foreground">
            You have {grouped.pending.length + grouped.in_progress.length} open task
            {grouped.pending.length + grouped.in_progress.length === 1 ? "" : "s"}.
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" /> New task
        </Button>
      </div>

      {/* Personal progress strip */}
      <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-ink">My completion</span>
          <span className="font-display text-xl font-semibold text-navy">{percent}%</span>
        </div>
        <Progress value={percent} className="mt-3" barClassName="bg-navy" />
        <p className="mt-2 text-xs text-muted-foreground">
          {done} of {tasks.length} of my tasks done
        </p>
      </div>

      {/* To-do next */}
      {todo.length > 0 && (
        <section>
          <h2 className="mb-4 font-display text-xl font-semibold text-ink">Do next</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {todo.map((t) => (
              <TaskCard key={t.id} task={t} onOpen={setSelected} showAssignee={false} />
            ))}
          </div>
        </section>
      )}

      {/* Grouped by status */}
      <section>
        <h2 className="mb-4 font-display text-xl font-semibold text-ink">My tasks</h2>
        {tasks.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-card p-10 text-center">
            <p className="text-muted-foreground">
              Nothing assigned to you yet. Create a task or ask a teammate to assign you one.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            {COLUMNS.map((col) => (
              <div key={col.key}>
                <div className="mb-3 flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${col.accent}`} />
                  <h3 className="text-sm font-semibold text-ink">{col.label}</h3>
                  <span className="text-sm text-muted-foreground">
                    {grouped[col.key].length}
                  </span>
                </div>
                <div className="space-y-3">
                  {grouped[col.key].length === 0 ? (
                    <p className="rounded-md border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
                      None
                    </p>
                  ) : (
                    grouped[col.key].map((t) => (
                      <TaskCard key={t.id} task={t} onOpen={setSelected} showAssignee={false} />
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Detail dialog */}
      <TaskDetail
        task={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
        currentUser={currentUser}
        users={users}
        categories={categories}
      />

      {/* Create dialog */}
      <Dialog open={creating} onClose={() => setCreating(false)} title="New task">
        <TaskForm
          users={users}
          categories={categories}
          currentUserId={currentUser.id}
          onDone={() => setCreating(false)}
        />
      </Dialog>
    </div>
  );
}
