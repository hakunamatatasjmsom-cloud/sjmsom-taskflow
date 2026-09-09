"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { TaskPriority, TaskStatus } from "@/lib/types";

// All mutations go through these Server Actions. RLS in Postgres is the real
// authorization boundary — these just shape the input and revalidate caches.

async function requireUserId() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, userId: user.id };
}

export async function createTask(formData: FormData) {
  const { supabase, userId } = await requireUserId();

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: "A title is required." };

  const payload = {
    title,
    description: String(formData.get("description") ?? "").trim() || null,
    category_id: (formData.get("category_id") as string) || null,
    assigned_to: (formData.get("assigned_to") as string) || null,
    created_by: userId,
    priority: (formData.get("priority") as TaskPriority) || "medium",
    due_date: (formData.get("due_date") as string) || null,
    status: "pending" as TaskStatus,
  };

  const { error } = await supabase.from("tasks").insert(payload);
  if (error) return { error: error.message };

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  revalidatePath("/");
  return { ok: true };
}

export async function updateTask(taskId: string, formData: FormData) {
  const { supabase } = await requireUserId();

  const payload = {
    title: String(formData.get("title") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim() || null,
    category_id: (formData.get("category_id") as string) || null,
    assigned_to: (formData.get("assigned_to") as string) || null,
    priority: (formData.get("priority") as TaskPriority) || "medium",
    status: (formData.get("status") as TaskStatus) || "pending",
    due_date: (formData.get("due_date") as string) || null,
  };

  const { error } = await supabase.from("tasks").update(payload).eq("id", taskId);
  if (error) return { error: error.message };

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  revalidatePath("/team");
  revalidatePath("/");
  return { ok: true };
}

// Lightweight status change (used by the dashboard quick controls).
export async function setTaskStatus(taskId: string, status: TaskStatus) {
  const { supabase } = await requireUserId();
  const { error } = await supabase.from("tasks").update({ status }).eq("id", taskId);
  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  revalidatePath("/tasks");
  revalidatePath("/");
  return { ok: true };
}

export async function postUpdate(taskId: string, text: string) {
  const { supabase, userId } = await requireUserId();
  const clean = text.trim();
  if (!clean) return { error: "Write something first." };

  const { error } = await supabase
    .from("task_updates")
    .insert({ task_id: taskId, user_id: userId, update_text: clean });
  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/tasks");
  revalidatePath("/");
  return { ok: true };
}

export async function deleteTask(taskId: string) {
  const { supabase } = await requireUserId();
  const { error } = await supabase.from("tasks").delete().eq("id", taskId);
  if (error) return { error: error.message };
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  revalidatePath("/team");
  return { ok: true };
}

// Admin-only in practice (RLS enforces it): add a custom category.
export async function createCategory(name: string) {
  const { supabase } = await requireUserId();
  const clean = name.trim();
  if (!clean) return { error: "Name required." };
  const { error } = await supabase.from("categories").insert({ name: clean });
  if (error) return { error: error.message };
  revalidatePath("/tasks");
  return { ok: true };
}
