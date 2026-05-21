"use client";
import { Shell } from "@/components/layout/shell";
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <Shell requiredRole="admin">{children}</Shell>;
}
