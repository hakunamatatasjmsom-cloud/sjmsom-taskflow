import Link from "next/link";
import { redirect } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getAllTasks, getCurrentUser, getRecentActivity, getUsers } from "@/lib/queries";
import { Avatar } from "@/components/ui/avatar";
import type { TaskStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

// Team overview: per-member task counts + last activity. Click through for
// a member's full history.
export default async function TeamPage() {
  const supabase = createClient();
  const currentUser = await getCurrentUser(supabase);
  if (!currentUser) redirect("/login");

  const [users, tasks, activity] = await Promise.all([
    getUsers(supabase),
    getAllTasks(supabase),
    getRecentActivity(supabase, 100),
  ]);

  // Build per-user aggregates.
  const rows = users.map((u) => {
    const mine = tasks.filter((t) => t.assigned_to === u.id);
    const count = (s: TaskStatus) => mine.filter((t) => t.status === s).length;
    const lastActivity = activity.find((a) => a.user?.id === u.id)?.created_at ?? null;
    return {
      user: u,
      total: mine.length,
      pending: count("pending"),
      in_progress: count("in_progress"),
      done: count("done"),
      lastActivity,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-ink">Team overview</h1>
        <p className="mt-1 text-muted-foreground">
          Workload and recent activity across the core team.
        </p>
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-lg border border-border bg-card shadow-sm md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left text-xs font-semibold text-muted-foreground">
              <th className="px-5 py-3">Member</th>
              <th className="px-3 py-3 text-center">Pending</th>
              <th className="px-3 py-3 text-center">In progress</th>
              <th className="px-3 py-3 text-center">Done</th>
              <th className="px-3 py-3 text-center">Total</th>
              <th className="px-5 py-3">Last activity</th>
              <th className="px-3 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((r) => (
              <tr key={r.user.id} className="hover:bg-muted/30">
                <td className="px-5 py-3">
                  <Link href={`/team/${r.user.id}`} className="flex items-center gap-3">
                    <Avatar initials={r.user.initials} name={r.user.name} />
                    <div>
                      <div className="font-medium text-ink">
                        {r.user.name}
                        {r.user.role === "admin" && (
                          <span className="ml-2 rounded bg-gold/20 px-1.5 py-0.5 text-[10px] font-semibold text-gold-600">
                            ADMIN
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">{r.user.email}</div>
                    </div>
                  </Link>
                </td>
                <td className="px-3 py-3 text-center font-medium text-amber-600">{r.pending}</td>
                <td className="px-3 py-3 text-center font-medium text-blue-600">{r.in_progress}</td>
                <td className="px-3 py-3 text-center font-medium text-emerald-600">{r.done}</td>
                <td className="px-3 py-3 text-center font-semibold text-ink">{r.total}</td>
                <td className="px-5 py-3 text-muted-foreground">
                  {r.lastActivity
                    ? formatDistanceToNow(new Date(r.lastActivity), { addSuffix: true })
                    : "—"}
                </td>
                <td className="px-3 py-3 text-right">
                  <Link href={`/team/${r.user.id}`} className="text-muted-foreground hover:text-navy">
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="grid gap-3 md:hidden">
        {rows.map((r) => (
          <Link
            key={r.user.id}
            href={`/team/${r.user.id}`}
            className="rounded-lg border border-border bg-card p-4 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <Avatar initials={r.user.initials} name={r.user.name} />
              <div className="min-w-0 flex-1">
                <div className="font-medium text-ink">{r.user.name}</div>
                <div className="truncate text-xs text-muted-foreground">{r.user.email}</div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs">
              <div>
                <div className="font-semibold text-amber-600">{r.pending}</div>
                <div className="text-muted-foreground">Pending</div>
              </div>
              <div>
                <div className="font-semibold text-blue-600">{r.in_progress}</div>
                <div className="text-muted-foreground">Active</div>
              </div>
              <div>
                <div className="font-semibold text-emerald-600">{r.done}</div>
                <div className="text-muted-foreground">Done</div>
              </div>
              <div>
                <div className="font-semibold text-ink">{r.total}</div>
                <div className="text-muted-foreground">Total</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
