"use client";
import { Shell } from "@/components/layout/shell";
export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  return <Shell requiredRole="owner">{children}</Shell>;
}
