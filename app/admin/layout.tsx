import { redirect } from "next/navigation";
import { LayoutGrid, Users, UserCog, DollarSign } from "lucide-react";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { DashboardShell, type NavItem } from "@/components/layout/shell";

export const dynamic = "force-dynamic";

const NAV_ITEMS: NavItem[] = [
  { href: "/admin", label: "Overview", icon: LayoutGrid },
  { href: "/admin/leads", label: "Leads", icon: Users },
  { href: "/admin/salespeople", label: "Salespeople", icon: UserCog },
  { href: "/admin/commissions", label: "Commissions", icon: DollarSign },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "admin") redirect("/sales");

  return <DashboardShell navItems={NAV_ITEMS} roleLabel="Admin" userName={profile.full_name}>{children}</DashboardShell>;
}
