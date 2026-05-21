"use client";
import { useEffect, useState } from "react";
import { ownerApi } from "@/lib/api";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Send, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function MessagesPage() {
  const [templates, setTemplates] = useState<Record<string,string>>({});
  const [selected, setSelected]   = useState<string | null>(null);
  const [loading, setLoading]     = useState(false);
  const [result, setResult]       = useState<any>(null);

  useEffect(() => {
    ownerApi.getTemplates().then(r => setTemplates(r.data)).catch(() => {});
  }, []);

  const send = async () => {
    if (!selected) { toast.error("Select a template first"); return; }
    if (!confirm("Send this message to all active members?")) return;
    setLoading(true);
    try {
      const { data } = await ownerApi.bulkMessage(selected);
      setResult(data);
      toast.success("Sent to " + data.sent + " members!");
    } catch { toast.error("Failed to send bulk message"); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <PageHeader title="Bulk Messaging" subtitle="Send WhatsApp messages to all active members" />
      <div className="max-w-2xl space-y-4">
        <Card>
          <h3 className="text-sm font-semibold mb-4" style={{ fontFamily:"var(--font-display)", color:"var(--text)" }}>Select Template</h3>
          <div className="space-y-2">
            {Object.entries(templates).map(([id, msg]) => (
              <button key={id} onClick={() => setSelected(id)} className="w-full text-left p-4 rounded-xl transition-all"
                style={{ background: selected===id ? "rgba(20,184,166,0.08)" : "var(--bg-hover)",
                         border:`1px solid ${selected===id ? "var(--accent)" : "var(--border)"}` }}>
                <div className="flex items-start gap-3">
                  <div className="w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5"
                       style={{ borderColor: selected===id ? "var(--accent)" : "var(--border)",
                                background: selected===id ? "var(--accent)" : "transparent" }} />
                  <p className="text-sm whitespace-pre-wrap" style={{ color:"var(--text)", opacity:0.9 }}>{msg}</p>
                </div>
              </button>
            ))}
          </div>
        </Card>
        {selected && (
          <Card className="animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium" style={{ color:"var(--text)" }}>Ready to send</div>
                <div className="text-xs" style={{ color:"var(--muted)" }}>Template {selected} selected — All active members will receive this</div>
              </div>
              <Button onClick={send} loading={loading}><Send className="w-3.5 h-3.5" /> Send Now</Button>
            </div>
          </Card>
        )}
        {result && (
          <Card className="animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background:"rgba(16,185,129,0.1)" }}>
                <CheckCircle2 className="w-5 h-5" style={{ color:"#10b981" }} />
              </div>
              <div>
                <div className="text-sm font-semibold" style={{ color:"var(--text)" }}>Messages Delivered</div>
                <div className="text-xs" style={{ color:"var(--muted)" }}>{result.sent} of {result.total} members received the message</div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
