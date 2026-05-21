"use client";
import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import { StatCard } from "@/components/dashboard/stat-card";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCardSkeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { Building2, TrendingUp, AlertTriangle, Users } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function AdminDashboardPage() {
  const [data, setData]         = useState<any>(null);
  const [expiring, setExpiring] = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([adminApi.dashboard(), adminApi.expiringGyms()])
      .then(([d, e]) => { setData(d.data); setExpiring(e.data); })
      .catch(() => toast.error("Failed to load dashboard"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader title="Admin Dashboard" subtitle="Platform-wide overview and analytics" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {loading ? Array.from({length:4}).map((_,i) => <StatCardSkeleton key={i} />) : (<>
          <StatCard label="Total Gym Owners" value={data?.total_owners  ?? 0}                     icon={Building2}     accent="var(--accent)" delay={0}   />
          <StatCard label="Active Owners"    value={data?.active_owners ?? 0}                     icon={Users}         accent="#10b981"       delay={50}  />
          <StatCard label="This Month"       value={formatCurrency(data?.month_revenue ?? 0)}     icon={TrendingUp}    accent="#8b5cf6"       delay={100} />
          <StatCard label="Expired Today"    value={data?.members_expired_today ?? 0}             icon={AlertTriangle} accent="#f43f5e"       delay={150} />
        </>)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Revenue Overview</CardTitle></CardHeader>
          <div className="space-y-3">
            {[
              { label:"This Month",    value:formatCurrency(data?.month_revenue    ?? 0), color:"#8b5cf6" },
              { label:"Lifetime Total",value:formatCurrency(data?.lifetime_revenue ?? 0), color:"var(--accent)" },
              { label:"Active Owners", value:data?.active_owners  ?? 0,                  color:"#10b981" },
              { label:"Expired Owners",value:data?.expired_owners ?? 0,                  color:"#f43f5e" },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center justify-between p-3 rounded-xl" style={{ background:"var(--bg-hover)" }}>
                <span className="text-sm" style={{ color:"var(--muted)" }}>{label}</span>
                <span className="text-sm font-bold" style={{ fontFamily:"var(--font-display)", color }}>{value}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Expiring Subscriptions</CardTitle>
              <Link href="/admin/expiring"><Button variant="ghost" size="sm">View All</Button></Link>
            </div>
          </CardHeader>
          {loading
            ? <div className="space-y-3">{Array.from({length:3}).map((_,i) => <div key={i} className="h-12 rounded-xl animate-shimmer" />)}</div>
            : expiring.length === 0
            ? <div className="text-center py-8" style={{ color:"var(--muted)" }}>
                <Building2 className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No gyms expiring soon</p>
              </div>
            : <div className="space-y-2">
                {expiring.slice(0,5).map((g, i) => (
                  <div key={g.id} className="flex items-center justify-between px-3 py-2.5 rounded-xl animate-fade-in"
                       style={{ background:"var(--bg-hover)", animationDelay:`${i*40}ms` }}>
                    <div>
                      <div className="text-sm font-medium" style={{ color:"var(--text)" }}>{g.name}</div>
                      <div className="text-xs" style={{ color:"var(--muted)" }}>{g.phone}</div>
                    </div>
                    <Badge variant={g.days_left === 0 ? "expired" : "warning"}>{g.days_left}d left</Badge>
                  </div>
                ))}
              </div>
          }
        </Card>
      </div>
    </div>
  );
}
