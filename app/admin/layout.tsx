import { redirect } from "next/navigation";
import { LayoutGrid, Users, UserCog, DollarSign, Trophy } from "lucide-react";
import { getCurrentProfile } from "@/lib/supabase/profile";
import { DashboardShell, type NavItem } from "@/components/layout/shell";

export const dynamic = "force-dynamic";

const NAV_ITEMS: NavItem[] = [
  { href: "/admin", label: "Overview", icon: <LayoutGrid className="h-4 w-4" /> },
  { href: "/admin/leads", label: "Leads", icon: <Users className="h-4 w-4" /> },
  { href: "/admin/salespeople", label: "Salespeople", icon: <UserCog className="h-4 w-4" /> },
  { href: "/admin/commissions", label: "Commissions", icon: <DollarSign className="h-4 w-4" /> },
  { href: "/admin/progression", label: "Progression", icon: <Trophy className="h-4 w-4" /> },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.role !== "admin") redirect("/sales");

  return <DashboardShell navItems={NAV_ITEMS} roleLabel="Admin" userName={profile.full_name}>{children}</DashboardShell>;
}
