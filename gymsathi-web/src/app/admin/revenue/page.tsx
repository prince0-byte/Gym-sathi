"use client";
import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { StatCardSkeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, Building2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function RevenuePage() {
  const [data, setData]     = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.dashboard().then(r => setData(r.data)).catch(() => toast.error("Failed to load")).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader title="Revenue Dashboard" subtitle="Platform subscription revenue overview" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? Array.from({length:4}).map((_,i) => <StatCardSkeleton key={i} />) : (<>
          <StatCard label="This Month"      value={formatCurrency(data?.month_revenue    ?? 0)} icon={TrendingUp} accent="#8b5cf6" delay={0}   />
          <StatCard label="Lifetime Revenue" value={formatCurrency(data?.lifetime_revenue ?? 0)} icon={TrendingUp} accent="var(--accent)" delay={50}  />
          <StatCard label="Active Owners"   value={data?.active_owners  ?? 0}                   icon={Building2}  accent="#10b981"       delay={100} />
          <StatCard label="Expired Owners"  value={data?.expired_owners ?? 0}                   icon={AlertTriangle} accent="#f43f5e"    delay={150} />
        </>)}
      </div>
    </div>
  );
}
