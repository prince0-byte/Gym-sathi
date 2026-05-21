"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";

export default function Home() {
  const router = useRouter();
  const { hydrate, role, accessToken } = useAuthStore();
  useEffect(() => { hydrate(); }, [hydrate]);
  useEffect(() => {
    if (!accessToken) { router.replace("/login"); return; }
    if (role === "admin") router.replace("/admin/dashboard");
    else if (role === "owner") router.replace("/owner/dashboard");
    else router.replace("/login");
  }, [accessToken, role, router]);
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
      <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: "var(--accent)", borderTopColor: "transparent" }} />
    </div>
  );
}
