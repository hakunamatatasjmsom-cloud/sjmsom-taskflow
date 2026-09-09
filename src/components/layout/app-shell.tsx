import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/queries";
import { AppNav } from "@/components/layout/app-nav";

// Wraps every authenticated page: guarantees a logged-in user and renders the
// nav. Used by dashboard / tasks / team layouts.
export async function AppShell({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const user = await getCurrentUser(supabase);
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-paper">
      <AppNav user={user} />
      <main className="container py-8">{children}</main>
    </div>
  );
}
