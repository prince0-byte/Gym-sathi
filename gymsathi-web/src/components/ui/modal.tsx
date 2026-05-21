"use client";
import { X } from "lucide-react";
import { useEffect } from "react";
export function Modal({ open, onClose, title, children, width="max-w-lg" }: { open:boolean; onClose:()=>void; title:string; children:React.ReactNode; width?:string }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key==="Escape") onClose(); };
    if (open) window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0" style={{ background:"rgba(0,0,0,0.7)", backdropFilter:"blur(4px)" }} onClick={onClose} />
      <div className={`relative w-full ${width} rounded-2xl animate-fade-in`} style={{ background:"var(--bg-card)", border:"1px solid var(--border-2)" }}>
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor:"var(--border)" }}>
          <h2 className="text-base font-semibold" style={{ fontFamily:"var(--font-display)", color:"var(--text)" }}>{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5" style={{ color:"var(--muted)" }}><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
