import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}
export function formatDate(dateStr: string) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
export function daysUntilExpiry(expiryStr: string): number {
  const today = new Date(); today.setHours(0,0,0,0);
  const expiry = new Date(expiryStr); expiry.setHours(0,0,0,0);
  return Math.floor((expiry.getTime() - today.getTime()) / 86400000);
}
export function getExpiryBadgeVariant(expiryStr: string): "active" | "warning" | "expired" {
  const days = daysUntilExpiry(expiryStr);
  if (days < 0) return "expired";
  if (days <= 5) return "warning";
  return "active";
}
