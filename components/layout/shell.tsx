"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { signOutAction } from "@/app/actions/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { initials } from "@/lib/format";

export interface NavItem { href: string; label: string; icon: LucideIcon; }

export function DashboardShell({ navItems, roleLabel, userName, children }: { navItems: NavItem[]; roleLabel: string; userName: string; children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-paper">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-ink py-6 lg:flex">
        <div className="mb-1 px-4">
          <div className="font-display text-[15px] font-semibold text-white">HavnLine</div>
          <div className="text-[11px] uppercase tracking-wide text-[#8A90A0]">{roleLabel}</div>
        </div>
        <nav className="mt-5 space-y-0.5 px-2">
          {navItems.map((item) => {
            const active = item.href === navItems[0].href ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} className={cn("flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors", active ? "bg-brand text-white" : "text-[#B8C0D0] hover:bg-white/5 hover:text-white")}>
                <item.icon className="h-4 w-4" />{item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto px-4 pt-4">
          <div className="flex items-center justify-between rounded-xl bg-ink-soft p-3">
            <div className="flex items-center gap-2">
              <Avatar className="h-7 w-7"><AvatarFallback className="text-[11px]">{initials(userName)}</AvatarFallback></Avatar>
              <span className="truncate text-[12.5px] font-medium text-white">{userName}</span>
            </div>
            <form action={signOutAction}><button type="submit" className="text-[#8A90A0] hover:text-white"><LogOut className="h-4 w-4" /></button></form>
          </div>
        </div>
      </aside>
      <div className="lg:pl-64"><main className="p-4 lg:p-8">{children}</main></div>
    </div>
  );
}
