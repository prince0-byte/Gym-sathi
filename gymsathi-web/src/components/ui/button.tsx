"use client";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary"|"secondary"|"ghost"|"danger";
  size?: "sm"|"md"|"lg";
  loading?: boolean;
}
const vs = { primary: { background:"var(--accent)", color:"white", border:"none" }, secondary: { background:"var(--bg-card)", color:"var(--text)", border:"1px solid var(--border)" }, ghost: { background:"transparent", color:"var(--muted)", border:"none" }, danger: { background:"rgba(244,63,94,0.1)", color:"#f43f5e", border:"1px solid rgba(244,63,94,0.2)" } };
const ss = { sm:"px-3 py-1.5 text-xs rounded-lg gap-1.5", md:"px-4 py-2 text-sm rounded-xl gap-2", lg:"px-6 py-3 text-sm rounded-xl gap-2" };
export function Button({ variant="primary", size="md", loading, children, className, disabled, ...props }: ButtonProps) {
  return (
    <button className={cn("inline-flex items-center justify-center font-medium transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed", ss[size], className)}
      style={vs[variant]} disabled={disabled||loading} {...props}>
      {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
      {children}
    </button>
  );
}
