import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ArrowRight, CheckCircle2, CircleDashed, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getAllTasks, getRecentActivity, getCurrentUser } from "@/lib/queries";
import { overallProgress, progressByCategory } from "@/lib/stats";
import { Brand } from "@/components/layout/brand";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/ui/badge";
import { CountUp } from "@/components/count-up";

export const dynamic = "force-dynamic";

// Public showcase page — no login required. Presentable to faculty/sponsors.
export default async function HomePage() {
  const supabase = createClient();
  const [tasks, activity, me] = await Promise.all([
    getAllTasks(supabase),
    getRecentActivity(supabase, 10),
    getCurrentUser(supabase),
  ]);

  const overall = overallProgress(tasks);
  const byCategory = progressByCategory(tasks);
  const recentlyDone = tasks
    .filter((t) => t.status === "done")
    .sort((a, b) => +new Date(b.updated_at) - +new Date(a.updated_at))
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-paper">
      {/* Top bar */}
      <header className="border-b border-border bg-white">
        <div className="container flex h-16 items-center justify-between">
          <Brand />
          <Button asChild variant="default">
            <Link href={me ? "/dashboard" : "/login"}>
              {me ? "Go to dashboard" : "Team login"}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </header>

      {/* Hero — the completion figure is the masthead */}
      <section className="hero-navy text-white">
        <div className="container grid gap-10 py-16 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:py-24">
          <div>
            <p className="mb-4 text-sm font-medium tracking-wide text-gold">
              Fest Core Team · Live progress
            </p>
            <h1 className="font-display text-4xl font-semibold leading-[1.05] sm:text-5xl">
              Where the core team&rsquo;s work
              <br />
              actually gets tracked.
            </h1>
            <p className="mt-5 max-w-md text-white/70">
              Every task, owner and update in one place — so nothing slips through a
              WhatsApp thread again.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="gold" size="lg">
                <Link href={me ? "/dashboard" : "/login"}>
                  {me ? "Open my tasks" : "Team member login"}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Big number */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-8 backdrop-blur">
            <div className="flex items-end gap-3">
              <span className="font-display text-7xl font-semibold leading-none text-white sm:text-8xl">
                <CountUp to={overall.percent} />
                <span className="text-gold">%</span>
              </span>
              <span className="mb-2 text-sm text-white/60">of all tasks complete</span>
            </div>
            <div className="mt-5">
              <Progress
                value={overall.percent}
                className="h-2.5 bg-white/15"
                barClassName="bg-gold"
              />
            </div>
            <div className="mt-6 grid grid-cols-3 gap-4 text-center">
              <Stat icon={<CheckCircle2 className="h-4 w-4" />} label="Done" value={overall.done} tint="text-emerald-300" />
              <Stat icon={<Loader2 className="h-4 w-4" />} label="In progress" value={overall.in_progress} tint="text-sky-300" />
              <Stat icon={<CircleDashed className="h-4 w-4" />} label="Pending" value={overall.pending} tint="text-amber-300" />
            </div>
          </div>
        </div>
      </section>

      <div className="rule-gold" />

      {/* Category breakdown */}
      <section className="container py-14">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl font-semibold text-ink">Progress by workstream</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              How each area of the fest is tracking.
            </p>
          </div>
        </div>

        {byCategory.length === 0 ? (
          <EmptyNote text="No tasks yet. Once the team adds tasks, workstream progress shows up here." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {byCategory.map(({ name, stat }) => (
              <div key={name} className="rounded-lg border border-border bg-card p-5 shadow-sm">
                <div className="flex items-baseline justify-between">
                  <h3 className="font-medium text-ink">{name}</h3>
                  <span className="font-display text-2xl font-semibold text-navy">
                    {stat.percent}%
                  </span>
                </div>
                <Progress value={stat.percent} className="mt-3" barClassName="bg-navy" />
                <p className="mt-2.5 text-xs text-muted-foreground">
                  {stat.done} done · {stat.in_progress} in progress · {stat.pending} pending
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Activity + recently completed */}
      <section className="container grid gap-8 pb-20 lg:grid-cols-2">
        <div>
          <h2 className="mb-5 font-display text-2xl font-semibold text-ink">Recent updates</h2>
          <div className="rounded-lg border border-border bg-card shadow-sm">
            {activity.length === 0 ? (
              <div className="p-6">
                <EmptyNote text="Progress notes the team posts will appear here as a live feed." />
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {activity.map((a) => (
                  <li key={a.id} className="flex gap-3 p-4">
                    <Avatar initials={a.user?.initials} name={a.user?.name} className="h-8 w-8" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-ink">
                        <span className="font-medium">{a.user?.name ?? "Someone"}</span>{" "}
                        on <span className="font-medium">{a.task?.title ?? "a task"}</span>
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
                        {a.update_text}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div>
          <h2 className="mb-5 font-display text-2xl font-semibold text-ink">Recently completed</h2>
          <div className="rounded-lg border border-border bg-card shadow-sm">
            {recentlyDone.length === 0 ? (
              <div className="p-6">
                <EmptyNote text="Finished work shows up here — a running record of what's shipped." />
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {recentlyDone.map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">{t.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.category?.name ?? "—"} · {t.assignee?.name ?? "Unassigned"}
                      </p>
                    </div>
                    <StatusBadge status={t.status} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-white">
        <div className="container flex flex-col items-center justify-between gap-3 py-6 text-sm text-muted-foreground sm:flex-row">
          <Brand />
          <p>Built for the SJMSOM, IIT Bombay fest core team.</p>
        </div>
      </footer>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  tint,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tint: string;
}) {
  return (
    <div>
      <div className={`flex items-center justify-center gap-1.5 ${tint}`}>
        {icon}
        <span className="font-display text-xl font-semibold">{value}</span>
      </div>
      <p className="mt-1 text-xs text-white/60">{label}</p>
    </div>
  );
}

function EmptyNote({ text }: { text: string }) {
  return <p className="text-sm text-muted-foreground">{text}</p>;
}
