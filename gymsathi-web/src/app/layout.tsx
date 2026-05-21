import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "GymSathi — Gym Management Platform",
  description: "Modern gym management SaaS for Indian gym owners",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        {children}
        <Toaster position="top-right" theme="dark"
          toastOptions={{ style: { background: "#0f1614", border: "1px solid #1f2d2a", color: "#e8f0ee" } }} />
      </body>
    </html>
  );
}
