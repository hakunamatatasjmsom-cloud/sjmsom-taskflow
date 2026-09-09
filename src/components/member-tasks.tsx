"use client";

import { useState } from "react";
import { TaskCard } from "@/components/tasks/task-card";
import { TaskDetail } from "@/components/tasks/task-detail";
import type { AppUser, Category, TaskWithRelations } from "@/lib/types";

// Renders a member's tasks and wires up the shared detail dialog.
export function MemberTasks({
  tasks,
  currentUser,
  users,
  categories,
}: {
  tasks: TaskWithRelations[];
  currentUser: AppUser;
  users: AppUser[];
  categories: Category[];
}) {
  const [selected, setSelected] = useState<TaskWithRelations | null>(null);

  return (
    <div>
      <h2 className="mb-4 font-display text-xl font-semibold text-ink">Task history</h2>
      {tasks.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card p-10 text-center">
          <p className="text-muted-foreground">No tasks assigned to this member yet.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tasks.map((t) => (
            <TaskCard key={t.id} task={t} onOpen={setSelected} showAssignee={false} />
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
    </div>
  );
}
