import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getCurrentUser,
  getTasksForUser,
  getUsers,
  getCategories,
} from "@/lib/queries";
import { DashboardView } from "@/components/dashboard-view";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = createClient();
  const currentUser = await getCurrentUser(supabase);
  if (!currentUser) redirect("/login");

  const [tasks, users, categories] = await Promise.all([
    getTasksForUser(supabase, currentUser.id),
    getUsers(supabase),
    getCategories(supabase),
  ]);

  return (
    <DashboardView
      currentUser={currentUser}
      tasks={tasks}
      users={users}
      categories={categories}
    />
  );
}
