"use client";
import { LucideIcon } from "lucide-react";
export function StatCard({ label, value, sub, icon:Icon, accent="var(--accent)", delay=0 }: { label:string; value:string|number; sub?:string; icon:LucideIcon; accent?:string; delay?:number }) {
  return (
    <div className="rounded-2xl p-5 animate-fade-in transition-all hover:scale-[1.01]"
         style={{ background:"var(--bg-card)", border:"1px solid var(--border)", animationDelay:`${delay}ms` }}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-4" style={{ background:`${accent}18` }}>
        <Icon className="w-4 h-4" style={{ color:accent }} />
      </div>
      <div className="text-2xl font-bold mb-1" style={{ fontFamily:"var(--font-display)", color:"var(--text)" }}>{value}</div>
      <div className="text-xs font-medium" style={{ color:"var(--muted)" }}>{label}</div>
      {sub && <div className="text-xs mt-0.5" style={{ color:"var(--muted)", opacity:0.7 }}>{sub}</div>}
    </div>
  );
}
