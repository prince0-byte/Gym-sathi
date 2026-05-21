"use client";
import { cn } from "@/lib/utils";
export function Card({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-2xl p-6", className)} style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }} {...props}>{children}</div>;
}
export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("mb-4", className)}>{children}</div>;
}
export function CardTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-base font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--text)" }}>{children}</h3>;
}
