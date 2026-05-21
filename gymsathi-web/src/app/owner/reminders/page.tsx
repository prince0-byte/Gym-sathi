"use client";
import { useState } from "react";
import { ownerApi } from "@/lib/api";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, CheckCircle2, SkipForward, Users } from "lucide-react";
import { toast } from "sonner";

export default function RemindersPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState<any>(null);

  const run = async () => {
    setLoading(true);
    try {
      const { data } = await ownerApi.runReminders();
      setResult(data);
      toast.success("Reminder engine completed!");
    } catch { toast.error("Failed to run reminder engine"); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <PageHeader title="Reminder Engine" subtitle="Send WhatsApp reminders based on expiry dates" />
      <div className="max-w-xl space-y-4">
        <Card>
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
                 style={{ background:"rgba(20,184,166,0.1)" }}>
              <Bell className="w-8 h-8" style={{ color:"var(--accent)" }} />
            </div>
            <h2 className="text-lg font-bold mb-2" style={{ fontFamily:"var(--font-display)", color:"var(--text)" }}>Smart Reminder System</h2>
            <p className="text-sm mb-6 max-w-sm mx-auto" style={{ color:"var(--muted)" }}>
              Sends WhatsApp messages at 4 key moments: 5 days before, on expiry day, 1 day after, and 5 days after expiry.
            </p>
            <Button onClick={run} loading={loading} size="lg"><Bell className="w-4 h-4" /> Run Reminder Engine</Button>
          </div>
          {result && (
            <div className="mt-6 pt-6 border-t animate-fade-in" style={{ borderColor:"var(--border)" }}>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon:Users,        label:"Checked", value:result.members_checked,    color:"var(--accent)" },
                  { icon:CheckCircle2, label:"Sent",    value:result.reminders_sent,     color:"#10b981" },
                  { icon:SkipForward,  label:"Skipped", value:result.duplicates_skipped, color:"var(--muted)" },
                ].map(({ icon:Icon, label, value, color }) => (
                  <div key={label} className="text-center p-4 rounded-xl" style={{ background:"var(--bg-hover)" }}>
                    <Icon className="w-5 h-5 mx-auto mb-2" style={{ color }} />
                    <div className="text-xl font-bold" style={{ fontFamily:"var(--font-display)", color:"var(--text)" }}>{value}</div>
                    <div className="text-xs" style={{ color:"var(--muted)" }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
        <Card>
          <h3 className="text-sm font-semibold mb-4" style={{ fontFamily:"var(--font-display)", color:"var(--text)" }}>Reminder Schedule</h3>
          <div className="space-y-3">
            {[
              { days:"+5",  label:"5 days before expiry",  color:"#f59e0b" },
              { days:"0",   label:"On expiry day",         color:"#f43f5e" },
              { days:"-1",  label:"1 day after expiry",    color:"#f43f5e" },
              { days:"-5",  label:"5 days after expiry",   color:"var(--muted)" },
            ].map(({ days, label, color }) => (
              <div key={days} className="flex items-center gap-3 p-3 rounded-xl" style={{ background:"var(--bg-hover)" }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                     style={{ background:`${color}20`, color }}>{days}</div>
                <div className="text-sm" style={{ color:"var(--text)" }}>{label}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
