import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCategories, getCurrentUser, getTasksForUser, getUsers } from "@/lib/queries";
import { overallProgress } from "@/lib/stats";
import { Avatar } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { MemberTasks } from "@/components/member-tasks";

export const dynamic = "force-dynamic";

// A single member's full task history. Opening a task here reuses the same
// detail dialog as elsewhere.
export default async function MemberPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const currentUser = await getCurrentUser(supabase);
  if (!currentUser) redirect("/login");

  const [users, categories, tasks] = await Promise.all([
    getUsers(supabase),
    getCategories(supabase),
    getTasksForUser(supabase, params.id),
  ]);

  const member = users.find((u) => u.id === params.id);
  if (!member) notFound();

  const stat = overallProgress(tasks);

  return (
    <div className="space-y-6">
      <Link
        href="/team"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" /> Back to team
      </Link>

      <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar initials={member.initials} name={member.name} className="h-14 w-14 text-lg" />
            <div>
              <h1 className="font-display text-2xl font-semibold text-ink">{member.name}</h1>
              <p className="text-sm text-muted-foreground">
                {member.email} · <span className="capitalize">{member.role}</span>
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="font-display text-3xl font-semibold text-navy">{stat.percent}%</div>
            <div className="text-xs text-muted-foreground">complete</div>
          </div>
        </div>
        <Progress value={stat.percent} className="mt-5" barClassName="bg-navy" />
        <div className="mt-3 grid grid-cols-4 gap-2 text-center text-sm">
          <Metric value={stat.pending} label="Pending" tint="text-amber-600" />
          <Metric value={stat.in_progress} label="In progress" tint="text-blue-600" />
          <Metric value={stat.done} label="Done" tint="text-emerald-600" />
          <Metric value={stat.total} label="Total" tint="text-ink" />
        </div>
      </div>

      <MemberTasks
        tasks={tasks}
        currentUser={currentUser}
        users={users}
        categories={categories}
      />
    </div>
  );
}

function Metric({ value, label, tint }: { value: number; label: string; tint: string }) {
  return (
    <div>
      <div className={`font-display text-xl font-semibold ${tint}`}>{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
