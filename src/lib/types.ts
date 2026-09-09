// Shared domain types. Kept hand-written (rather than generated) so the
// codebase reads clearly for anyone picking it up on GitHub.

export type TaskStatus = "pending" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type UserRole = "admin" | "member";

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  initials: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  category_id: string | null;
  assigned_to: string | null;
  created_by: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

// Task joined with the names it references — what the UI actually renders.
export interface TaskWithRelations extends Task {
  category: Pick<Category, "id" | "name"> | null;
  assignee: Pick<AppUser, "id" | "name" | "initials"> | null;
  creator: Pick<AppUser, "id" | "name" | "initials"> | null;
}

export interface TaskUpdate {
  id: string;
  task_id: string;
  user_id: string | null;
  update_text: string;
  created_at: string;
  user?: Pick<AppUser, "id" | "name" | "initials"> | null;
}

export const STATUS_LABELS: Record<TaskStatus, string> = {
  pending: "Pending",
  in_progress: "In progress",
  done: "Done",
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

export const PRIORITY_ORDER: Record<TaskPriority, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};
