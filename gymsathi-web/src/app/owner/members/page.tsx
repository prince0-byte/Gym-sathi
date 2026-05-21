"use client";
import { useEffect, useState, useCallback } from "react";
import { ownerApi } from "@/lib/api";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { TableRowSkeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate, daysUntilExpiry } from "@/lib/utils";
import { Plus, Search, Trash2, UserCheck } from "lucide-react";
import { toast } from "sonner";

const PLANS = [
  { value:"monthly",   label:"Monthly" },
  { value:"quarterly", label:"Quarterly" },
  { value:"yearly",    label:"Yearly" },
];

export default function MembersPage() {
  const [members, setMembers]   = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [filter, setFilter]     = useState("active");
  const [addOpen, setAddOpen]   = useState(false);
  const [renewOpen, setRenewOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [renewPlan, setRenewPlan] = useState("monthly");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name:"", phone:"", plan_name:"", join_date:"", expiry_date:"", fees_amount:"" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await ownerApi.listMembers({ status: filter || undefined, search: search || undefined });
      setMembers(data);
    } catch { toast.error("Failed to load members"); }
    finally { setLoading(false); }
  }, [filter, search]);

  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [load]);

  const handleAdd = async () => {
    if (!form.name || !form.phone || !form.expiry_date) { toast.error("Name, phone and expiry are required"); return; }
    setSubmitting(true);
    try {
      await ownerApi.createMember({ ...form, fees_amount: parseFloat(form.fees_amount) || 0 });
      toast.success("Member added!");
      setAddOpen(false);
      setForm({ name:"", phone:"", plan_name:"", join_date:"", expiry_date:"", fees_amount:"" });
      load();
    } catch (e: any) { toast.error(e?.response?.data?.detail || "Failed to add member"); }
    finally { setSubmitting(false); }
  };

  const handleRenew = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      await ownerApi.renewMember(selected.id, renewPlan);
      toast.success(selected.name + " membership renewed!");
      setRenewOpen(false); load();
    } catch (e: any) { toast.error(e?.response?.data?.detail || "Renewal failed"); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (m: any) => {
    if (!confirm("Delete " + m.name + "? This cannot be undone.")) return;
    try { await ownerApi.deleteMember(m.id); toast.success("Member deleted"); load(); }
    catch { toast.error("Failed to delete member"); }
  };

  return (
    <div>
      <PageHeader title="Members" subtitle={members.length + " members"}
        action={<Button onClick={() => setAddOpen(true)} size="sm"><Plus className="w-3.5 h-3.5" /> Add Member</Button>} />

      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color:"var(--muted)" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search members..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
            style={{ background:"var(--bg-card)", border:"1px solid var(--border)", color:"var(--text)" }} />
        </div>
        {["active","expired",""].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-3 py-2 rounded-xl text-xs font-medium transition-all"
            style={filter===f ? { background:"var(--accent)", color:"white" } : { background:"var(--bg-card)", color:"var(--muted)", border:"1px solid var(--border)" }}>
            {f === "" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background:"var(--bg-card)", border:"1px solid var(--border)" }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom:"1px solid var(--border)" }}>
              {["Member","Phone","Plan","Expiry","Fee","Status",""].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold" style={{ color:"var(--muted)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({length:5}).map((_,i) => <TableRowSkeleton key={i} cols={7} />)
              : members.length === 0
              ? <tr><td colSpan={7} className="text-center py-12 text-sm" style={{ color:"var(--muted)" }}>No members found</td></tr>
              : members.map((m, i) => {
                  const days = daysUntilExpiry(m.expiry_date);
                  const v = days < 0 ? "expired" : days <= 5 ? "warning" : "active";
                  return (
                    <tr key={m.id} className="animate-fade-in transition-colors hover:bg-white/[0.02]"
                        style={{ borderBottom:"1px solid var(--border)", animationDelay:`${i*30}ms` }}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                               style={{ background:"var(--accent)", color:"white" }}>{m.name[0].toUpperCase()}</div>
                          <span className="text-sm font-medium" style={{ color:"var(--text)" }}>{m.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color:"var(--muted)" }}>{m.phone}</td>
                      <td className="px-4 py-3 text-sm" style={{ color:"var(--muted)" }}>{m.plan_name || "—"}</td>
                      <td className="px-4 py-3 text-sm" style={{ color:"var(--muted)" }}>{formatDate(m.expiry_date)}</td>
                      <td className="px-4 py-3 text-sm" style={{ color:"var(--muted)" }}>{m.fees_amount ? formatCurrency(m.fees_amount) : "—"}</td>
                      <td className="px-4 py-3"><Badge variant={v}>{days < 0 ? "Expired" : days === 0 ? "Today" : days + "d left"}</Badge></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => { setSelected(m); setRenewOpen(true); }}
                            className="p-1.5 rounded-lg hover:bg-white/5" style={{ color:"var(--accent)" }} title="Renew">
                            <UserCheck className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDelete(m)}
                            className="p-1.5 rounded-lg hover:bg-rose-500/10" style={{ color:"var(--muted)" }} title="Delete">
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

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add New Member">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Full Name *" value={form.name} onChange={e => setForm(p => ({...p, name:e.target.value}))} placeholder="Rahul Sharma" />
            <Input label="Phone (10 digits) *" value={form.phone} onChange={e => setForm(p => ({...p, phone:e.target.value}))} placeholder="9876543210" maxLength={10} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Plan Name" value={form.plan_name} onChange={e => setForm(p => ({...p, plan_name:e.target.value}))} placeholder="Monthly" />
            <Input label="Fees (INR)" type="number" value={form.fees_amount} onChange={e => setForm(p => ({...p, fees_amount:e.target.value}))} placeholder="999" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Join Date" type="date" value={form.join_date} onChange={e => setForm(p => ({...p, join_date:e.target.value}))} />
            <Input label="Expiry Date *" type="date" value={form.expiry_date} onChange={e => setForm(p => ({...p, expiry_date:e.target.value}))} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button className="flex-1" onClick={handleAdd} loading={submitting}>Add Member</Button>
          </div>
        </div>
      </Modal>

      <Modal open={renewOpen} onClose={() => setRenewOpen(false)} title={"Renew — " + (selected?.name || "")}>
        <div className="space-y-4">
          <p className="text-sm" style={{ color:"var(--muted)" }}>
            Current expiry: <span style={{ color:"var(--text)" }}>{formatDate(selected?.expiry_date)}</span>
          </p>
          <Select label="Renewal Plan" value={renewPlan} onChange={e => setRenewPlan(e.target.value)} options={PLANS} />
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setRenewOpen(false)}>Cancel</Button>
            <Button className="flex-1" onClick={handleRenew} loading={submitting}>Renew Membership</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
