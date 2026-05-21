"use client";
import { useState } from "react";
import { ownerApi } from "@/lib/api";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Smartphone } from "lucide-react";
import { toast } from "sonner";

export default function SettingsPage() {
  const [testNumber, setTestNumber] = useState("");
  const [testing, setTesting]       = useState(false);

  const testWhatsapp = async () => {
    if (!testNumber || testNumber.length !== 10) { toast.error("Enter a valid 10-digit number"); return; }
    setTesting(true);
    try {
      await ownerApi.testWhatsapp(testNumber);
      toast.success("WhatsApp test message sent!");
    } catch (e: any) { toast.error(e?.response?.data?.detail || "WhatsApp test failed"); }
    finally { setTesting(false); }
  };

  return (
    <div>
      <PageHeader title="Settings" subtitle="Configure your WhatsApp integration" />
      <div className="max-w-xl">
        <Card>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background:"rgba(20,184,166,0.1)" }}>
              <Smartphone className="w-5 h-5" style={{ color:"var(--accent)" }} />
            </div>
            <div>
              <div className="text-sm font-semibold" style={{ color:"var(--text)" }}>Test WhatsApp Configuration</div>
              <div className="text-xs" style={{ color:"var(--muted)" }}>Only available if using own WhatsApp mode</div>
            </div>
          </div>
          <div className="space-y-3">
            <Input label="Test Phone Number (10 digits)" value={testNumber}
              onChange={e => setTestNumber(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="9876543210" maxLength={10} />
            <Button onClick={testWhatsapp} loading={testing} className="w-full">
              <Smartphone className="w-3.5 h-3.5" /> Send Test Message
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
