// =============================================================
// Seed script — creates 4 sample auth users + sample tasks/updates
// so the UI is populated on first run.
//
// Usage:
//   1. Run supabase/schema.sql in the Supabase SQL editor first.
//   2. Fill .env.local (needs SUPABASE_SERVICE_ROLE_KEY).
//   3. npm run seed
//
// Login for every sample user: password "password123"
// Emails: aarav@sjmsom.in, diya@sjmsom.in, kabir@sjmsom.in, ananya@sjmsom.in
// (aarav is the admin)
//
// To clear before going live, see README ("Going live").
// =============================================================

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

// Load .env.local without extra deps.
try {
  const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  for (const line of env.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, "");
  }
} catch {
  console.error("Could not read .env.local — create it from .env.example first.");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

const PASSWORD = "password123";
const PEOPLE = [
  { name: "Aarav Mehta", email: "aarav@sjmsom.in", role: "admin", initials: "AM" },
  { name: "Diya Sharma", email: "diya@sjmsom.in", role: "member", initials: "DS" },
  { name: "Kabir Rao", email: "kabir@sjmsom.in", role: "member", initials: "KR" },
  { name: "Ananya Nair", email: "ananya@sjmsom.in", role: "member", initials: "AN" },
];

async function ensureUser(p) {
  // Create the auth user (idempotent-ish: ignores "already registered").
  const { data, error } = await admin.auth.admin.createUser({
    email: p.email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { name: p.name },
  });
  let id = data?.user?.id;
  if (error) {
    if (!/registered|exists/i.test(error.message)) throw error;
    // Fetch existing id.
    const { data: list } = await admin.auth.admin.listUsers();
    id = list.users.find((u) => u.email === p.email)?.id;
  }
  // Ensure profile row + role/initials (the trigger creates a base row).
  await admin.from("users").upsert({
    id,
    name: p.name,
    email: p.email,
    role: p.role,
    initials: p.initials,
  });
  return id;
}

async function main() {
  console.log("Seeding users…");
  const ids = {};
  for (const p of PEOPLE) ids[p.email] = await ensureUser(p);

  const { data: cats } = await admin.from("categories").select("id, name");
  const cat = (name) => cats.find((c) => c.name === name)?.id ?? null;

  const A = ids["aarav@sjmsom.in"];
  const D = ids["diya@sjmsom.in"];
  const K = ids["kabir@sjmsom.in"];
  const N = ids["ananya@sjmsom.in"];

  const today = new Date();
  const day = (n) => new Date(today.getTime() + n * 864e5).toISOString().slice(0, 10);

  console.log("Seeding tasks…");
  // Clear previous sample tasks (safe: only removes seeded titles) then insert.
  const tasks = [
    { title: "Confirm title sponsor MoU", description: "Get the signed MoU back from the brand team and file it.", category_id: cat("Sponsorship"), assigned_to: A, created_by: A, status: "in_progress", priority: "high", due_date: day(4) },
    { title: "Cold outreach to 20 fintech brands", description: "Send the sponsorship deck to the shortlisted fintech contacts.", category_id: cat("Emails/Outreach"), assigned_to: D, created_by: A, status: "in_progress", priority: "high", due_date: day(2) },
    { title: "Physical visit — Powai retail partners", description: "Walk-in meetings with 3 retail partners for stalls.", category_id: cat("Physical Visits"), assigned_to: K, created_by: A, status: "pending", priority: "medium", due_date: day(6) },
    { title: "Book main auditorium", description: "Confirm dates and get the booking letter from admin.", category_id: cat("Venue Booking"), assigned_to: A, created_by: A, status: "done", priority: "urgent", due_date: day(-3) },
    { title: "Design Instagram teaser set", description: "3-post teaser series for the announcement.", category_id: cat("Social Media"), assigned_to: N, created_by: D, status: "in_progress", priority: "medium", due_date: day(3) },
    { title: "Finalize stage & sound vendor", description: "Compare two quotes and lock the vendor.", category_id: cat("Logistics"), assigned_to: K, created_by: A, status: "pending", priority: "high", due_date: day(8) },
    { title: "Print standees and banners", description: "Send final artwork to the printer.", category_id: cat("Marketing"), assigned_to: N, created_by: N, status: "pending", priority: "low", due_date: day(10) },
    { title: "Sponsor deck v2", description: "Incorporate feedback and refresh the numbers.", category_id: cat("Sponsorship"), assigned_to: D, created_by: A, status: "done", priority: "medium", due_date: day(-1) },
    { title: "Hospitality plan for guest speakers", description: "Travel + stay for 4 external speakers.", category_id: cat("Logistics"), assigned_to: A, created_by: A, status: "pending", priority: "medium", due_date: day(9) },
    { title: "Set up registration form", description: "Google form + landing section for sign-ups.", category_id: cat("Other/Manual"), assigned_to: K, created_by: D, status: "in_progress", priority: "low", due_date: day(5) },
  ];

  // Remove any prior rows with these titles to keep re-runs clean.
  await admin.from("tasks").delete().in("title", tasks.map((t) => t.title));
  const { data: inserted, error: tErr } = await admin.from("tasks").insert(tasks).select("id, title, assigned_to");
  if (tErr) throw tErr;

  console.log("Seeding progress updates…");
  const byTitle = (t) => inserted.find((r) => r.title === t);
  const updates = [
    { task: "Cold outreach to 20 fintech brands", user_id: D, update_text: "Sent decks to 12 so far. 3 replies, one wants a call this week." },
    { task: "Confirm title sponsor MoU", user_id: A, update_text: "Legal reviewing the MoU. Expecting sign-off by Thursday." },
    { task: "Book main auditorium", user_id: A, update_text: "Booking confirmed for the fest dates. Letter received." },
    { task: "Design Instagram teaser set", user_id: N, update_text: "First two posts drafted — sharing for review tomorrow." },
    { task: "Sponsor deck v2", user_id: D, update_text: "Done — updated the reach numbers and added the new tiers." },
  ]
    .map((u) => {
      const row = byTitle(u.task);
      return row ? { task_id: row.id, user_id: u.user_id, update_text: u.update_text } : null;
    })
    .filter(Boolean);

  if (updates.length) {
    await admin.from("task_updates").insert(updates);
  }

  console.log("\n✅ Seed complete.");
  console.log("Log in with any of:");
  PEOPLE.forEach((p) => console.log(`   ${p.email}  /  ${PASSWORD}${p.role === "admin" ? "  (admin)" : ""}`));
}

main().catch((e) => {
  console.error("Seed failed:", e.message);
  process.exit(1);
});
