"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { createTask, updateTask } from "@/app/actions";
import type { AppUser, Category, TaskWithRelations } from "@/lib/types";

interface Props {
  users: AppUser[];
  categories: Category[];
  currentUserId: string;
  task?: TaskWithRelations; // present => edit mode
  onDone?: () => void;
}

// Shared create/edit form. Uses a plain FormData submit to the server action.
export function TaskForm({ users, categories, currentUserId, task, onDone }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const isEdit = Boolean(task);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = isEdit ? await updateTask(task!.id, fd) : await createTask(fd);
      if (res?.error) {
        setError(res.error);
        return;
      }
      router.refresh();
      onDone?.();
      if (!isEdit) (e.target as HTMLFormElement).reset();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          required
          defaultValue={task?.title}
          placeholder="e.g. Follow up with title sponsor on MoU"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={task?.description ?? ""}
          placeholder="Context, links, what 'done' looks like…"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="category_id">Category</Label>
          <Select id="category_id" name="category_id" defaultValue={task?.category_id ?? ""}>
            <option value="">— none —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="assigned_to">Assign to</Label>
          <Select
            id="assigned_to"
            name="assigned_to"
            defaultValue={task?.assigned_to ?? currentUserId}
          >
            <option value="">— unassigned —</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
                {u.id === currentUserId ? " (me)" : ""}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="priority">Priority</Label>
          <Select id="priority" name="priority" defaultValue={task?.priority ?? "medium"}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="due_date">Due date</Label>
          <Input id="due_date" name="due_date" type="date" defaultValue={task?.due_date ?? ""} />
        </div>
      </div>

      {isEdit && (
        <div className="space-y-1.5">
          <Label htmlFor="status">Status</Label>
          <Select id="status" name="status" defaultValue={task?.status}>
            <option value="pending">Pending</option>
            <option value="in_progress">In progress</option>
            <option value="done">Done</option>
          </Select>
        </div>
      )}

      {error && (
        <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
      )}

      <div className="flex justify-end gap-2 pt-1">
        {onDone && (
          <Button type="button" variant="outline" onClick={onDone}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : isEdit ? "Save changes" : "Create task"}
        </Button>
      </div>
    </form>
  );
}
