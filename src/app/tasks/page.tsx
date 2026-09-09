import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAllTasks, getCategories, getCurrentUser, getUsers } from "@/lib/queries";
import { TasksView } from "@/components/tasks-view";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const supabase = createClient();
  const currentUser = await getCurrentUser(supabase);
  if (!currentUser) redirect("/login");

  const [tasks, users, categories] = await Promise.all([
    getAllTasks(supabase),
    getUsers(supabase),
    getCategories(supabase),
  ]);

  return (
    <TasksView
      currentUser={currentUser}
      tasks={tasks}
      users={users}
      categories={categories}
    />
  );
}
