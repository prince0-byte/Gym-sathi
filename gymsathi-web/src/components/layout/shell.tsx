"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { Sidebar } from "./sidebar";

export function Shell({ children, requiredRole }: { children: React.ReactNode; requiredRole?: "admin"|"owner" }) {
  const router = useRouter();
  const { hydrate, accessToken, role, isHydrated } = useAuthStore();
  useEffect(() => { hydrate(); }, [hydrate]);
  useEffect(() => {
    if (!isHydrated) return;
    if (!accessToken) { router.replace("/login"); return; }
    if (requiredRole && role !== requiredRole)
      router.replace(role === "admin" ? "/admin/dashboard" : "/owner/dashboard");
  }, [isHydrated, accessToken, role, requiredRole, router]);
  if (!isHydrated || !accessToken) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background:"var(--bg)" }}>
      <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor:"var(--accent)", borderTopColor:"transparent" }} />
    </div>
  );
  return (
    <div className="min-h-screen flex" style={{ background:"var(--bg)" }}>
      <Sidebar />
      <main className="flex-1 ml-60 min-h-screen">
        <div className="max-w-6xl mx-auto px-8 py-8">{children}</div>
      </main>
    </div>
  );
}
