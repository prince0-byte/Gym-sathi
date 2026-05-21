"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Users, Building2, TrendingUp, AlertCircle, Bell, MessageSquare, FileSpreadsheet, Settings, LogOut, Dumbbell, ChevronRight } from "lucide-react";

const adminLinks = [
  { href:"/admin/dashboard", label:"Dashboard",  icon:LayoutDashboard },
  { href:"/admin/owners",    label:"Gym Owners", icon:Building2 },
  { href:"/admin/revenue",   label:"Revenue",    icon:TrendingUp },
  { href:"/admin/expiring",  label:"Expiring",   icon:AlertCircle },
];
const ownerLinks = [
  { href:"/owner/dashboard", label:"Dashboard",    icon:LayoutDashboard },
  { href:"/owner/members",   label:"Members",      icon:Users },
  { href:"/owner/reminders", label:"Reminders",    icon:Bell },
  { href:"/owner/messages",  label:"Bulk Message", icon:MessageSquare },
  { href:"/owner/sheet",     label:"Google Sheet", icon:FileSpreadsheet },
  { href:"/owner/settings",  label:"Settings",     icon:Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router   = useRouter();
  const { role, gymName, subscriptionStatus, logout } = useAuthStore();
  const links    = role === "admin" ? adminLinks : ownerLinks;
  const isExpired = subscriptionStatus === "expired";
  const handleLogout = () => { logout(); router.push("/login"); };

  return (
    <aside className="fixed inset-y-0 left-0 w-60 flex flex-col z-40" style={{ background:"var(--bg-card)", borderRight:"1px solid var(--border)" }}>
      <div className="flex items-center gap-3 px-5 py-5 border-b" style={{ borderColor:"var(--border)" }}>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background:"linear-gradient(135deg,var(--accent),var(--accent-2))" }}>
          <Dumbbell className="w-4 h-4 text-white" />
        </div>
        <div>
          <div className="font-bold text-sm" style={{ fontFamily:"var(--font-display)", color:"var(--text)" }}>GymSathi</div>
          <div className="text-xs capitalize" style={{ color:"var(--muted)" }}>{role} panel</div>
        </div>
      </div>
      {isExpired && (
        <div className="mx-3 mt-3 px-3 py-2 rounded-xl text-xs" style={{ background:"rgba(244,63,94,0.08)", border:"1px solid rgba(244,63,94,0.2)", color:"#f43f5e" }}>
          ⚠ Subscription expired
        </div>
      )}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {links.map(({ href, label, icon: Icon }) => {
          const active   = pathname === href || pathname.startsWith(href + "/");
          const disabled = isExpired && href !== "/owner/dashboard" && href !== "/owner/members";
          return (
            <Link key={href} href={disabled ? "#" : href}
              className={cn("flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all", active?"text-white":"hover:bg-white/5", disabled&&"opacity-40 cursor-not-allowed")}
              style={active ? { background:"linear-gradient(135deg,var(--accent),var(--accent-2))", color:"white" } : { color:"var(--muted)" }}
              onClick={e => disabled && e.preventDefault()}>
              <Icon className="w-4 h-4 flex-shrink-0" /><span className="flex-1">{label}</span>
              {active && <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
            </Link>
          );
        })}
      </nav>
      <div className="px-3 py-4 border-t" style={{ borderColor:"var(--border)" }}>
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1" style={{ background:"var(--bg-hover)" }}>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold" style={{ background:"var(--accent)", color:"white" }}>
            {gymName?.[0]?.toUpperCase() || "G"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium truncate" style={{ color:"var(--text)" }}>{gymName}</div>
            <div className="text-xs capitalize" style={{ color:"var(--muted)" }}>{role}</div>
          </div>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm w-full hover:bg-white/5" style={{ color:"var(--muted)" }}>
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </div>
    </aside>
  );
}
