"use client";
import { cn } from "@/lib/utils";
import { forwardRef } from "react";
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> { label?: string; error?: string; }
export const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, className, ...props }, ref) => (
  <div className="w-full">
    {label && <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--muted)" }}>{label}</label>}
    <input ref={ref} className={cn("w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all", className)}
      style={{ background:"var(--bg-card)", border:`1px solid ${error?"var(--danger)":"var(--border)"}`, color:"var(--text)" }}
      onFocus={e => e.target.style.borderColor = error?"var(--danger)":"var(--accent)"}
      onBlur={e => e.target.style.borderColor = error?"var(--danger)":"var(--border)"} {...props} />
    {error && <p className="mt-1 text-xs" style={{ color:"var(--danger)" }}>{error}</p>}
  </div>
));
Input.displayName = "Input";
