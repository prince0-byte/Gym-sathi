"use client";
import { cn } from "@/lib/utils";
const styles = { active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", warning: "bg-amber-500/10 text-amber-400 border-amber-500/20", expired: "bg-rose-500/10 text-rose-400 border-rose-500/20", default: "bg-white/5 text-white/60 border-white/10" };
export function Badge({ variant = "default", children, className }: { variant?: "active"|"warning"|"expired"|"default"; children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border", styles[variant], className)}>
      {variant !== "default" && <span className={cn("w-1.5 h-1.5 rounded-full pulse-dot", variant==="active"?"bg-emerald-400":variant==="warning"?"bg-amber-400":"bg-rose-400")} />}
      {children}
    </span>
  );
}
