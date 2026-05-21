"use client";
import { useEffect, useState } from "react";
import { ownerApi } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import { StatCard } from "@/components/dashboard/stat-card";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCardSkeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate, daysUntilExpiry } from "@/lib/utils";
import { Users, TrendingUp, AlertTriangle, Calendar, Bell } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface DashData { active_members:number; expired_members:number; total_revenue:number; expiring_soon:number; today_expired:number; }

export default function OwnerDashboardPage() {
  const { gymName, subscriptionStatus } = useAuthStore();
  const [data, setData]       = useState<DashData | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    Promise.all([ownerApi.dashboard(), ownerApi.listMembers({ status: "active" })])
      .then(([d, m]) => { setData(d.data); setMembers(m.data.slice(0, 6)); })
      .catch(() => toast.error("Failed to load dashboard"))
      .finally(() => setLoading(false));
  }, []);

  const runReminders = async () => {
    setRunning(true);
    try {
      const { data: r } = await ownerApi.runReminders();
      toast.success("Sent: " + r.reminders_sent + " | Skipped: " + r.duplicates_skipped);
    } catch { toast.error("Failed to run reminders"); }
    finally { setRunning(false); }
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div>
      <PageHeader
        title={greeting + ", " + (gymName?.split(" ")[0] || "") + " 👋"}
        subtitle="Here is what is happening at your gym today."
        action={<Button onClick={runReminders} loading={running} variant="secondary" size="sm"><Bell className="w-3.5 h-3.5" /> Run Reminders</Button>}
      />

      {subscriptionStatus === "expired" && (
        <div className="mb-6 px-4 py-3 rounded-xl text-sm flex items-center gap-3"
             style={{ background:"rgba(244,63,94,0.08)", border:"1px solid rgba(244,63,94,0.2)", color:"#f43f5e" }}>
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          Your subscription has expired. Contact admin to renew and unlock all features.
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {loading ? Array.from({length:4}).map((_,i) => <StatCardSkeleton key={i} />) : (<>
          <StatCard label="Active Members"  value={data?.active_members ?? 0}                    icon={Users}         accent="var(--accent)" delay={0}   />
          <StatCard label="Revenue (Active)" value={formatCurrency(data?.total_revenue ?? 0)}    icon={TrendingUp}    accent="#10b981"       delay={50}  />
          <StatCard label="Expiring Soon"   value={data?.expiring_soon ?? 0}  sub="Within 5 days" icon={AlertTriangle} accent="#f59e0b"       delay={100} />
          <StatCard label="Expired Today"   value={data?.today_expired ?? 0}                     icon={Calendar}      accent="#f43f5e"       delay={150} />
        </>)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Active Members</CardTitle>
              <Link href="/owner/members"><Button variant="ghost" size="sm">View All</Button></Link>
            </div>
          </CardHeader>
          {loading
            ? <div className="space-y-3">{Array.from({length:4}).map((_,i) => <div key={i} className="h-12 rounded-xl animate-shimmer" />)}</div>
            : members.length === 0
            ? <div className="text-center py-8" style={{ color:"var(--muted)" }}><Users className="w-8 h-8 mx-auto mb-2 opacity-40" /><p className="text-sm">No active members yet</p></div>
            : <div className="space-y-2">
                {members.map((m, i) => {
                  const days = daysUntilExpiry(m.expiry_date);
                  const v = days < 0 ? "expired" : days <= 5 ? "warning" : "active";
                  return (
                    <div key={m.id} className="flex items-center justify-between px-3 py-2.5 rounded-xl animate-fade-in"
                         style={{ background:"var(--bg-hover)", animationDelay:`${i*40}ms` }}>
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                             style={{ background:"var(--accent)", color:"white" }}>{m.name[0].toUpperCase()}</div>
                        <div>
                          <div className="text-sm font-medium" style={{ color:"var(--text)" }}>{m.name}</div>
                          <div className="text-xs" style={{ color:"var(--muted)" }}>{m.plan_name}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={v}>{days < 0 ? "Expired" : days === 0 ? "Today" : days + "d"}</Badge>
                        <div className="text-xs mt-0.5" style={{ color:"var(--muted)" }}>{formatDate(m.expiry_date)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
          }
        </Card>

        <Card>
          <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
          <div className="grid grid-cols-2 gap-3">
            {[
              { href:"/owner/members?action=add",     label:"Add Member",   icon:"👤", desc:"Register new member" },
              { href:"/owner/messages",               label:"Bulk Message", icon:"📲", desc:"WhatsApp all members" },
              { href:"/owner/sheet",                  label:"Sync Sheet",   icon:"📊", desc:"Google Sheet import" },
              { href:"/owner/members?filter=expired", label:"View Expired", icon:"⏰", desc:(data?.expired_members ?? 0) + " expired" },
            ].map(({ href, label, icon, desc }) => (
              <Link key={href} href={href} className="p-4 rounded-xl transition-all hover:scale-[1.02] block"
                    style={{ background:"var(--bg-hover)", border:"1px solid var(--border)" }}>
                <div className="text-2xl mb-2">{icon}</div>
                <div className="text-sm font-medium" style={{ color:"var(--text)" }}>{label}</div>
                <div className="text-xs" style={{ color:"var(--muted)" }}>{desc}</div>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
