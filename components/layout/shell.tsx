"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { LogOut, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { signOutAction } from "@/app/actions/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogoMark } from "@/components/brand/logo";
import { initials } from "@/lib/format";

export interface NavItem { href: string; label: string; icon: ReactNode; }

function NavLinks({ navItems, pathname, onNavigate }: { navItems: NavItem[]; pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="mt-5 space-y-0.5 px-2">
      {navItems.map((item) => {
        const active = item.href === navItems[0].href ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors",
              active ? "bg-brand text-white" : "text-[#B8C0D0] hover:bg-white/5 hover:text-white"
            )}
          >
            {item.icon}{item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function DashboardShell({ navItems, roleLabel, userName, children }: { navItems: NavItem[]; roleLabel: string; userName: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-paper">
      {/* Desktop sidebar — unchanged. */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-ink py-6 lg:flex">
        <div className="mb-1 flex items-center gap-2.5 px-4">
          <LogoMark className="h-8 w-8" />
          <div>
            <div className="font-display text-[14px] font-semibold text-white">HavnLine</div>
            <div className="text-[11px] text-[#8A90A0]">{roleLabel} portfolio</div>
          </div>
        </div>
        <NavLinks navItems={navItems} pathname={pathname} />
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

      {/* Mobile topbar — the piece that was completely missing before. */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-card px-4 py-3 lg:hidden">
        <button onClick={() => setMobileOpen(true)} className="text-text-muted" aria-label="Open menu"><Menu className="h-5 w-5" /></button>
        <div className="flex items-center gap-2">
          <LogoMark className="h-6 w-6" />
          <span className="font-display text-[13px] font-semibold text-ink">HavnLine</span>
        </div>
        <Avatar className="h-7 w-7"><AvatarFallback className="text-[11px]">{initials(userName)}</AvatarFallback></Avatar>
      </header>

      {/* Mobile slide-out drawer with the same nav as desktop. */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-ink py-6">
            <div className="mb-1 flex items-center justify-between px-4">
              <div className="flex items-center gap-2.5">
                <LogoMark className="h-8 w-8" />
                <div>
                  <div className="font-display text-[14px] font-semibold text-white">HavnLine</div>
                  <div className="text-[11px] text-[#8A90A0]">{roleLabel} portfolio</div>
                </div>
              </div>
              <button onClick={() => setMobileOpen(false)} className="text-white" aria-label="Close menu"><X className="h-5 w-5" /></button>
            </div>
            <NavLinks navItems={navItems} pathname={pathname} onNavigate={() => setMobileOpen(false)} />
            <div className="mt-auto px-4 pt-4">
              <form action={signOutAction}>
                <button type="submit" className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-[#B8C0D0] hover:bg-white/5 hover:text-white">
                  <LogOut className="h-4 w-4" /> Log out
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      <div className="lg:pl-64"><main className="p-4 lg:p-8">{children}</main></div>
    </div>
  );
}
