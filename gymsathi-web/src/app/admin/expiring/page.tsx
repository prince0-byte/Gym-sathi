"use client";
import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { TableRowSkeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

export default function ExpiringPage() {
  const [gyms, setGyms]     = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.expiringGyms().then(r => setGyms(r.data)).catch(() => toast.error("Failed to load")).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHeader title="Expiring Subscriptions" subtitle="Gym subscriptions expiring within 5 days" />
      <div className="rounded-2xl overflow-hidden" style={{ background:"var(--bg-card)", border:"1px solid var(--border)" }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom:"1px solid var(--border)" }}>
              {["Gym","Phone","Expiry Date","Days Left","Status"].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color:"var(--muted)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({length:4}).map((_,i) => <TableRowSkeleton key={i} cols={5} />)
              : gyms.length === 0
              ? <tr><td colSpan={5} className="text-center py-12 text-sm" style={{ color:"var(--muted)" }}>No subscriptions expiring soon</td></tr>
              : gyms.map((g, i) => (
                  <tr key={g.id} className="animate-fade-in transition-colors hover:bg-white/[0.02]"
                      style={{ borderBottom:"1px solid var(--border)", animationDelay:`${i*40}ms` }}>
                    <td className="px-4 py-3 text-sm font-medium" style={{ color:"var(--text)" }}>{g.name}</td>
                    <td className="px-4 py-3 text-sm" style={{ color:"var(--muted)" }}>{g.phone}</td>
                    <td className="px-4 py-3 text-sm" style={{ color:"var(--muted)" }}>{formatDate(g.expiry)}</td>
                    <td className="px-4 py-3"><Badge variant={g.days_left===0?"expired":"warning"}>{g.days_left}d</Badge></td>
                    <td className="px-4 py-3"><Badge variant="warning">Expiring Soon</Badge></td>
                  </tr>
                ))
            }
          </tbody>
        </table>
      </div>
    </div>
  );
}
