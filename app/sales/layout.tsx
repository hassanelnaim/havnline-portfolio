import { redirect } from "next/navigation";
import { LayoutGrid, Users, DollarSign } from "lucide-react";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { DashboardShell, type NavItem } from "@/components/layout/shell";

export const dynamic = "force-dynamic";

const NAV_ITEMS: NavItem[] = [
  { href: "/sales", label: "Overview", icon: LayoutGrid },
  { href: "/sales/leads", label: "My Leads", icon: Users },
  { href: "/sales/earnings", label: "Earnings", icon: DollarSign },
];

export default async function SalesLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "salesperson") redirect("/admin");

  return <DashboardShell navItems={NAV_ITEMS} roleLabel="Salesperson" userName={profile.full_name}>{children}</DashboardShell>;
}
