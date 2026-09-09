import { createClient } from "@/lib/supabase/server";
import type { AppUser, Category, TaskUpdate, TaskWithRelations } from "@/lib/types";

// Central place for the DB reads used across pages. Each function takes a
// server Supabase client so it works inside Server Components.

// The select string that hydrates a task with its related names.
const TASK_SELECT = `
  id, title, description, category_id, assigned_to, created_by,
  status, priority, due_date, created_at, updated_at,
  category:categories ( id, name ),
  assignee:users!tasks_assigned_to_fkey ( id, name, initials ),
  creator:users!tasks_created_by_fkey ( id, name, initials )
`;

type SB = ReturnType<typeof createClient>;

export async function getCurrentUser(supabase: SB): Promise<AppUser | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("users").select("*").eq("id", user.id).single();
  return (data as AppUser) ?? null;
}

export async function getAllTasks(supabase: SB): Promise<TaskWithRelations[]> {
  const { data } = await supabase
    .from("tasks")
    .select(TASK_SELECT)
    .order("created_at", { ascending: false });
  return (data as unknown as TaskWithRelations[]) ?? [];
}

export async function getTasksForUser(
  supabase: SB,
  userId: string
): Promise<TaskWithRelations[]> {
  const { data } = await supabase
    .from("tasks")
    .select(TASK_SELECT)
    .eq("assigned_to", userId)
    .order("created_at", { ascending: false });
  return (data as unknown as TaskWithRelations[]) ?? [];
}

export async function getUsers(supabase: SB): Promise<AppUser[]> {
  const { data } = await supabase.from("users").select("*").order("name");
  return (data as AppUser[]) ?? [];
}

export async function getCategories(supabase: SB): Promise<Category[]> {
  const { data } = await supabase.from("categories").select("*").order("name");
  return (data as Category[]) ?? [];
}

export async function getTaskUpdates(
  supabase: SB,
  taskId: string
): Promise<TaskUpdate[]> {
  const { data } = await supabase
    .from("task_updates")
    .select(`id, task_id, user_id, update_text, created_at, user:users ( id, name, initials )`)
    .eq("task_id", taskId)
    .order("created_at", { ascending: true });
  return (data as unknown as TaskUpdate[]) ?? [];
}

// Recent activity feed for the public home page (latest progress notes).
export async function getRecentActivity(supabase: SB, limit = 12) {
  const { data } = await supabase
    .from("task_updates")
    .select(
      `id, update_text, created_at,
       user:users ( id, name, initials ),
       task:tasks ( id, title, status )`
    )
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data as unknown as {
    id: string;
    update_text: string;
    created_at: string;
    user: { id: string; name: string; initials: string | null } | null;
    task: { id: string; title: string; status: string } | null;
  }[]) ?? [];
}
