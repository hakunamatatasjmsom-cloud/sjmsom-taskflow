"use client";

import { useMemo, useState } from "react";
import { Plus, SlidersHorizontal } from "lucide-react";
import { TaskCard } from "@/components/tasks/task-card";
import { TaskDetail } from "@/components/tasks/task-detail";
import { TaskForm } from "@/components/tasks/task-form";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import type {
  AppUser,
  Category,
  TaskStatus,
  TaskWithRelations,
} from "@/lib/types";

// Full task list with filters by person, category, and status.
export function TasksView({
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

  const [person, setPerson] = useState("all");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState<"all" | TaskStatus>("all");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (person !== "all" && t.assigned_to !== person) return false;
      if (category !== "all" && t.category_id !== category) return false;
      if (status !== "all" && t.status !== status) return false;
      if (q && !`${t.title} ${t.description ?? ""}`.toLowerCase().includes(q.toLowerCase()))
        return false;
      return true;
    });
  }, [tasks, person, category, status, q]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">All tasks</h1>
          <p className="mt-1 text-muted-foreground">
            Create, assign and track every task across the team.
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" /> New task
        </Button>
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-ink">
          <SlidersHorizontal className="h-4 w-4" /> Filters
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            placeholder="Search title or description…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <Select value={person} onChange={(e) => setPerson(e.target.value)}>
            <option value="all">Everyone</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
                {u.id === currentUser.id ? " (me)" : ""}
              </option>
            ))}
          </Select>
          <Select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <Select value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
            <option value="all">Any status</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In progress</option>
            <option value="done">Done</option>
          </Select>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Showing {filtered.length} of {tasks.length} tasks
      </p>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card p-10 text-center">
          <p className="text-muted-foreground">No tasks match these filters.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t) => (
            <TaskCard key={t.id} task={t} onOpen={setSelected} />
          ))}
        </div>
      )}

      <TaskDetail
        task={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
        currentUser={currentUser}
        users={users}
        categories={categories}
      />

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
