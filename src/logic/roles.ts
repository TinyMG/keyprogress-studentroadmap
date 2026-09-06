// Role-based nav/home logic. Pure so it can be self-checked without a DB.
// The real access boundary is RLS in supabase/schema.sql; this only
// drives what the UI shows.

export type Role = "admin" | "teacher" | "student";

export type View =
  | "dashboard"
  | "students"
  | "student"
  | "curriculum"
  | "roadmap"
  | "resources"
  | "admin";

export type NavItem = { id: View; label: string; adminOnly?: boolean };

export const NAV: NavItem[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "students", label: "Students" },
  { id: "curriculum", label: "Curriculum" },
  { id: "roadmap", label: "Skill Pathway" },
  { id: "resources", label: "Resources" },
  { id: "admin", label: "Admin", adminOnly: true },
];

export function visibleNav(role: Role): NavItem[] {
  return NAV.filter((n) => !n.adminOnly || role === "admin");
}

export function homeView(role: Role): View {
  return role === "student" ? "students" : "dashboard";
}
