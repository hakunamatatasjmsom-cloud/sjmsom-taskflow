"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow, format } from "date-fns";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge, PriorityBadge } from "@/components/ui/badge";
import { TaskForm } from "@/components/tasks/task-form";
import { postUpdate, setTaskStatus } from "@/app/actions";
import { createClient } from "@/lib/supabase/client";
import type {
  AppUser,
  Category,
  TaskStatus,
  TaskUpdate,
  TaskWithRelations,
} from "@/lib/types";
import { Calendar, Tag, User as UserIcon } from "lucide-react";

interface Props {
  task: TaskWithRelations | null;
  open: boolean;
  onClose: () => void;
  currentUser: AppUser;
  users: AppUser[];
  categories: Category[];
}

// Full task view: metadata, quick status control, the progress-note log, and
// an edit mode (for the assignee, creator, or an admin).
export function TaskDetail({ task, open, onClose, currentUser, users, categories }: Props) {
  const router = useRouter();
  const [updates, setUpdates] = useState<TaskUpdate[]>([]);
  const [note, setNote] = useState("");
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();

  const canEdit =
    !!task &&
    (currentUser.role === "admin" ||
      currentUser.id === task.assigned_to ||
      currentUser.id === task.created_by);

  // Load the update log whenever a task opens.
  useEffect(() => {
    if (!task || !open) return;
    setEditing(false);
    const supabase = createClient();
    supabase
      .from("task_updates")
      .select(`id, task_id, user_id, update_text, created_at, user:users ( id, name, initials )`)
      .eq("task_id", task.id)
      .order("created_at", { ascending: true })
      .then(({ data }) => setUpdates((data as unknown as TaskUpdate[]) ?? []));
  }, [task, open]);

  if (!task) return null;

  function changeStatus(status: TaskStatus) {
    startTransition(async () => {
      await setTaskStatus(task!.id, status);
      router.refresh();
    });
  }

  function submitNote() {
    if (!note.trim()) return;
    startTransition(async () => {
      const res = await postUpdate(task!.id, note);
      if (!res?.error) {
        setNote("");
        // optimistic append
        setUpdates((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            task_id: task!.id,
            user_id: currentUser.id,
            update_text: note.trim(),
            created_at: new Date().toISOString(),
            user: { id: currentUser.id, name: currentUser.name, initials: currentUser.initials },
          },
        ]);
        router.refresh();
      }
    });
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={editing ? "Edit task" : task.title}
      className="max-w-2xl"
    >
      {editing ? (
        <TaskForm
          task={task}
          users={users}
          categories={categories}
          currentUserId={currentUser.id}
          onDone={() => {
            setEditing(false);
            router.refresh();
          }}
        />
      ) : (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={task.status} />
            <PriorityBadge priority={task.priority} />
            {canEdit && (
              <Button
                variant="outline"
                size="sm"
                className="ml-auto"
                onClick={() => setEditing(true)}
              >
                Edit
              </Button>
            )}
          </div>

          {task.description && (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">
              {task.description}
            </p>
          )}

          <div className="grid gap-3 rounded-md bg-muted/50 p-4 text-sm sm:grid-cols-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <UserIcon className="h-4 w-4" />
              <span>
                Assigned to{" "}
                <span className="font-medium text-ink">
                  {task.assignee?.name ?? "Unassigned"}
                </span>
              </span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Tag className="h-4 w-4" />
              <span className="font-medium text-ink">{task.category?.name ?? "—"}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>
                {task.due_date
                  ? `Due ${format(new Date(task.due_date), "d MMM yyyy")}`
                  : "No due date"}
              </span>
            </div>
            <div className="text-muted-foreground">
              Created by{" "}
              <span className="font-medium text-ink">{task.creator?.name ?? "—"}</span>
            </div>
          </div>

          {/* Quick status control for whoever can edit */}
          {canEdit && (
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-ink">Update status</span>
              <Select
                value={task.status}
                onChange={(e) => changeStatus(e.target.value as TaskStatus)}
                disabled={pending}
                className="max-w-[180px]"
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In progress</option>
                <option value="done">Done</option>
              </Select>
            </div>
          )}

          {/* Progress log */}
          <div>
            <h3 className="mb-3 font-display text-base font-semibold text-ink">
              Progress log
            </h3>
            <div className="space-y-3">
              {updates.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No updates yet. Post the first progress note below.
                </p>
              )}
              {updates.map((u) => (
                <div key={u.id} className="flex gap-3">
                  <Avatar initials={u.user?.initials} name={u.user?.name} className="h-8 w-8" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-medium text-ink">
                        {u.user?.name ?? "Someone"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(u.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap text-sm text-ink">{u.update_text}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-2">
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Post a progress update instead of messaging WhatsApp…"
                className="min-h-[64px]"
              />
              <div className="flex justify-end">
                <Button size="sm" onClick={submitNote} disabled={pending || !note.trim()}>
                  Post update
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Dialog>
  );
}
