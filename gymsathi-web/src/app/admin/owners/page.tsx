"use client";
import { useEffect, useState, useCallback } from "react";
import { adminApi } from "@/lib/api";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { TableRowSkeleton } from "@/components/ui/skeleton";
import { formatDate, daysUntilExpiry } from "@/lib/utils";
import { Plus, Trash2, RefreshCw, Search } from "lucide-react";
import { toast } from "sonner";

const PLAN_OPTS = [
  { value:"monthly",   label:"Monthly   — Rs.499" },
  { value:"quarterly", label:"Quarterly — Rs.1,299" },
  { value:"yearly",    label:"Yearly    — Rs.4,499" },
];

export default function OwnersPage() {
  const [owners, setOwners]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [renewId, setRenewId] = useState<number|null>(null);
  const [renewPlan, setRenewPlan] = useState("monthly");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name:"", owner_name:"", phone:"", city:"", username:"", password:"",
    subscription_plan:"Basic", whatsapp_mode:"admin",
    whatsapp_number:"", whatsapp_api_key:"", whatsapp_app_name:"",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try { const { data } = await adminApi.listOwners(); setOwners(data); }
    catch { toast.error("Failed to load owners"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = owners.filter(o =>
    o.name.toLowerCase().includes(search.toLowerCase()) || (o.phone || "").includes(search)
  );

  const handleAdd = async () => {
    if (!form.name || !form.username || !form.password || !form.phone) {
      toast.error("Name, phone, username and password are required"); return;
    }
    setSubmitting(true);
    try {
      await adminApi.createOwner(form);
      toast.success("Gym created!");
      setAddOpen(false);
      setForm({ name:"",owner_name:"",phone:"",city:"",username:"",password:"",subscription_plan:"Basic",whatsapp_mode:"admin",whatsapp_number:"",whatsapp_api_key:"",whatsapp_app_name:"" });
      load();
    } catch (e: any) { toast.error(e?.response?.data?.detail || "Failed to create gym"); }
    finally { setSubmitting(false); }
  };

  const handleRenew = async () => {
    if (!renewId) return;
    setSubmitting(true);
    try { await adminApi.renewOwner(renewId, renewPlan); toast.success("Subscription renewed!"); setRenewId(null); load(); }
    catch (e: any) { toast.error(e?.response?.data?.detail || "Renewal failed"); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (o: any) => {
    if (!confirm("Delete " + o.name + "? All member data will be lost.")) return;
    try { await adminApi.deleteOwner(o.id); toast.success("Gym deleted"); load(); }
    catch { toast.error("Failed to delete gym"); }
  };

  const renewTarget = owners.find(o => o.id === renewId);

  return (
    <div>
      <PageHeader title="Gym Owners" subtitle={owners.length + " registered gyms"}
        action={<Button onClick={() => setAddOpen(true)} size="sm"><Plus className="w-3.5 h-3.5" /> Add Gym</Button>} />

      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color:"var(--muted)" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search gyms..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
            style={{ background:"var(--bg-card)", border:"1px solid var(--border)", color:"var(--text)" }} />
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background:"var(--bg-card)", border:"1px solid var(--border)" }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom:"1px solid var(--border)" }}>
              {["Gym","Owner","Phone","Plan","Expiry","Status",""].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color:"var(--muted)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({length:5}).map((_,i) => <TableRowSkeleton key={i} cols={7} />)
              : filtered.length === 0
              ? <tr><td colSpan={7} className="text-center py-12 text-sm" style={{ color:"var(--muted)" }}>No gym owners found</td></tr>
              : filtered.map((o, i) => {
                  const days = o.subscription_expiry ? daysUntilExpiry(o.subscription_expiry) : null;
                  const v = days===null ? "default" : days<0 ? "expired" : days<=5 ? "warning" : "active";
                  return (
                    <tr key={o.id} className="animate-fade-in transition-colors hover:bg-white/[0.02]"
                        style={{ borderBottom:"1px solid var(--border)", animationDelay:`${i*30}ms` }}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                               style={{ background:"var(--accent)", color:"white" }}>{o.name[0].toUpperCase()}</div>
                          <span className="text-sm font-medium" style={{ color:"var(--text)" }}>{o.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color:"var(--muted)" }}>{o.owner_name || "—"}</td>
                      <td className="px-4 py-3 text-sm" style={{ color:"var(--muted)" }}>{o.phone || "—"}</td>
                      <td className="px-4 py-3 text-sm" style={{ color:"var(--muted)" }}>{o.subscription_plan || "—"}</td>
                      <td className="px-4 py-3 text-sm" style={{ color:"var(--muted)" }}>{o.subscription_expiry ? formatDate(o.subscription_expiry) : "—"}</td>
                      <td className="px-4 py-3"><Badge variant={v as any}>{o.subscription_status}</Badge></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => setRenewId(o.id)} className="p-1.5 rounded-lg hover:bg-white/5" style={{ color:"var(--accent)" }} title="Renew">
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDelete(o)} className="p-1.5 rounded-lg hover:bg-rose-500/10" style={{ color:"var(--muted)" }} title="Delete">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
            }
          </tbody>
        </table>
      </div>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Gym Owner" width="max-w-2xl">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Gym Name *" value={form.name} onChange={e => setForm(p=>({...p,name:e.target.value}))} placeholder="FitZone Gym" />
            <Input label="Owner Name" value={form.owner_name} onChange={e => setForm(p=>({...p,owner_name:e.target.value}))} placeholder="Rajesh Kumar" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Phone *" value={form.phone} onChange={e => setForm(p=>({...p,phone:e.target.value}))} placeholder="9876543210" maxLength={10} />
            <Input label="City" value={form.city} onChange={e => setForm(p=>({...p,city:e.target.value}))} placeholder="Mumbai" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Username *" value={form.username} onChange={e => setForm(p=>({...p,username:e.target.value}))} placeholder="fitzone_gym" />
            <Input label="Password *" type="password" value={form.password} onChange={e => setForm(p=>({...p,password:e.target.value}))} placeholder="Min 6 characters" />
          </div>
          <Select label="WhatsApp Mode" value={form.whatsapp_mode} onChange={e => setForm(p=>({...p,whatsapp_mode:e.target.value}))}
            options={[{value:"admin",label:"Use Admin WhatsApp"},{value:"self",label:"Use Own WhatsApp (Gupshup)"}]} />
          {form.whatsapp_mode === "self" && (
            <div className="grid grid-cols-3 gap-3 animate-fade-in">
              <Input label="WA Number" value={form.whatsapp_number} onChange={e => setForm(p=>({...p,whatsapp_number:e.target.value}))} placeholder="91XXXXXXXXXX" />
              <Input label="API Key" value={form.whatsapp_api_key} onChange={e => setForm(p=>({...p,whatsapp_api_key:e.target.value}))} placeholder="Gupshup key" />
              <Input label="App Name" value={form.whatsapp_app_name} onChange={e => setForm(p=>({...p,whatsapp_app_name:e.target.value}))} placeholder="App name" />
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button className="flex-1" onClick={handleAdd} loading={submitting}>Create Gym</Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!renewId} onClose={() => setRenewId(null)} title={"Renew — " + (renewTarget?.name || "")}>
        <div className="space-y-4">
          <p className="text-sm" style={{ color:"var(--muted)" }}>
            Current expiry: <span style={{ color:"var(--text)" }}>{renewTarget ? formatDate(renewTarget.subscription_expiry) : "—"}</span>
          </p>
          <Select label="Renewal Plan" value={renewPlan} onChange={e => setRenewPlan(e.target.value)} options={PLAN_OPTS} />
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setRenewId(null)}>Cancel</Button>
            <Button className="flex-1" onClick={handleRenew} loading={submitting}>Renew Subscription</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
