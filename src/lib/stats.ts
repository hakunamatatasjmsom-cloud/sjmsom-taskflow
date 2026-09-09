import type { TaskWithRelations } from "@/lib/types";

export interface ProgressStat {
  total: number;
  done: number;
  in_progress: number;
  pending: number;
  percent: number; // 0–100, rounded
}

function pct(done: number, total: number) {
  return total === 0 ? 0 : Math.round((done / total) * 100);
}

// Overall completion across all tasks.
export function overallProgress(tasks: TaskWithRelations[]): ProgressStat {
  const done = tasks.filter((t) => t.status === "done").length;
  const in_progress = tasks.filter((t) => t.status === "in_progress").length;
  const pending = tasks.filter((t) => t.status === "pending").length;
  const total = tasks.length;
  return { total, done, in_progress, pending, percent: pct(done, total) };
}

// Completion broken down by category name.
export function progressByCategory(
  tasks: TaskWithRelations[]
): { name: string; stat: ProgressStat }[] {
  const map = new Map<string, TaskWithRelations[]>();
  for (const t of tasks) {
    const name = t.category?.name ?? "Uncategorised";
    if (!map.has(name)) map.set(name, []);
    map.get(name)!.push(t);
  }
  return Array.from(map.entries())
    .map(([name, list]) => ({ name, stat: overallProgress(list) }))
    .sort((a, b) => b.stat.total - a.stat.total);
}
