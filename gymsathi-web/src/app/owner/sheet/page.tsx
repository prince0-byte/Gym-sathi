"use client";
import { useEffect, useState } from "react";
import { ownerApi } from "@/lib/api";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileSpreadsheet, RefreshCw, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export default function SheetPage() {
  const [url, setUrl]         = useState("");
  const [savedUrl, setSavedUrl] = useState("");
  const [saving, setSaving]   = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);

  useEffect(() => {
    ownerApi.getSheet().then(r => { setSavedUrl(r.data.sheet_url || ""); setUrl(r.data.sheet_url || ""); }).catch(() => {});
  }, []);

  const save = async () => {
    if (!url.trim()) { toast.error("Enter a Google Sheet URL"); return; }
    setSaving(true);
    try { await ownerApi.setSheet(url.trim()); setSavedUrl(url.trim()); toast.success("Sheet URL saved!"); }
    catch { toast.error("Failed to save URL"); }
    finally { setSaving(false); }
  };

  const sync = async () => {
    if (!savedUrl) { toast.error("Save a sheet URL first"); return; }
    setSyncing(true); setSyncResult(null);
    try { const { data } = await ownerApi.syncSheet(); setSyncResult(data); toast.success("Sync complete! " + data.added_or_updated + " members updated."); }
    catch (e: any) { toast.error(e?.response?.data?.detail || "Sync failed"); }
    finally { setSyncing(false); }
  };

  return (
    <div>
      <PageHeader title="Google Sheet Sync" subtitle="Import and sync members from your Google Sheet" />
      <div className="max-w-xl space-y-4">
        <Card>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background:"rgba(20,184,166,0.1)" }}>
              <FileSpreadsheet className="w-5 h-5" style={{ color:"var(--accent)" }} />
            </div>
            <div>
              <div className="text-sm font-semibold" style={{ color:"var(--text)" }}>Connect Google Sheet</div>
              <div className="text-xs" style={{ color:"var(--muted)" }}>Columns: name, phone, plan_name, join_date, expiry_date, fees_amount</div>
            </div>
          </div>
          <div className="space-y-3">
            <Input label="Google Sheet URL" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://docs.google.com/spreadsheets/d/..." />
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => window.open(url,"_blank")} disabled={!url}>
                <ExternalLink className="w-3.5 h-3.5" /> Open Sheet
              </Button>
              <Button className="flex-1" onClick={save} loading={saving}>Save URL</Button>
            </div>
          </div>
        </Card>

        {savedUrl && (
          <Card className="animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm font-semibold" style={{ color:"var(--text)" }}>Manual Sync</div>
                <div className="text-xs" style={{ color:"var(--muted)" }}>Pull latest data from your Google Sheet now</div>
              </div>
              <Button onClick={sync} loading={syncing} variant="secondary">
                <RefreshCw className={"w-3.5 h-3.5 " + (syncing ? "animate-spin" : "")} /> Sync Now
              </Button>
            </div>
            {syncResult && (
              <div className="grid grid-cols-2 gap-3 animate-fade-in">
                <div className="p-3 rounded-xl text-center" style={{ background:"var(--bg-hover)" }}>
                  <div className="text-lg font-bold" style={{ fontFamily:"var(--font-display)", color:"var(--accent)" }}>{syncResult.added_or_updated}</div>
                  <div className="text-xs" style={{ color:"var(--muted)" }}>Added / Updated</div>
                </div>
                <div className="p-3 rounded-xl text-center" style={{ background:"var(--bg-hover)" }}>
                  <div className="text-lg font-bold" style={{ fontFamily:"var(--font-display)", color:"var(--muted)" }}>{syncResult.skipped}</div>
                  <div className="text-xs" style={{ color:"var(--muted)" }}>Skipped</div>
                </div>
              </div>
            )}
          </Card>
        )}

        <Card>
          <h3 className="text-sm font-semibold mb-3" style={{ fontFamily:"var(--font-display)", color:"var(--text)" }}>Sheet Format Guide</h3>
          <div className="rounded-xl overflow-hidden" style={{ border:"1px solid var(--border)" }}>
            <table className="w-full text-xs">
              <thead><tr style={{ background:"var(--bg-hover)" }}>
                {["Column","Format","Required"].map(h => <th key={h} className="text-left px-3 py-2 font-semibold" style={{ color:"var(--muted)" }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {[["name","Text","Yes"],["phone","10 digits","Yes"],["plan_name","Text","No"],["join_date","DD-MM-YYYY","No"],["expiry_date","DD-MM-YYYY","Yes"],["fees_amount","Number","No"]].map(([col,fmt,req]) => (
                  <tr key={col} style={{ borderTop:"1px solid var(--border)" }}>
                    <td className="px-3 py-2 font-mono" style={{ color:"var(--accent)" }}>{col}</td>
                    <td className="px-3 py-2" style={{ color:"var(--muted)" }}>{fmt}</td>
                    <td className="px-3 py-2" style={{ color: req==="Yes" ? "#10b981" : "var(--muted)" }}>{req}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
