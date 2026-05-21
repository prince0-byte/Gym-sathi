"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth";
import { authApi } from "@/lib/api";
import { toast } from "sonner";
import { Eye, EyeOff, Dumbbell, ArrowRight, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router  = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [form, setForm]     = useState({ username: "", password: "" });
  const [show, setShow]     = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username || !form.password) { toast.error("Enter username and password"); return; }
    setLoading(true);
    try {
      const { data } = await authApi.login(form.username, form.password);
      setAuth(data);
      toast.success("Welcome back, " + data.gym_name + "!");
      router.push(data.role === "admin" ? "/admin/dashboard" : "/owner/dashboard");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Login failed";
      toast.error(msg);
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg)" }}>
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden"
           style={{ background: "linear-gradient(135deg,#042f2e 0%,#0f766e 60%,#14b8a6 100%)" }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 20% 80%,#14b8a6 0%,transparent 50%)" }} />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.15)" }}>
              <Dumbbell className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-xl" style={{ fontFamily: "var(--font-display)" }}>GymSathi</span>
          </div>
          <h1 className="text-5xl font-bold text-white leading-tight mb-6" style={{ fontFamily: "var(--font-display)" }}>
            Manage your gym<br />like never before
          </h1>
          <p className="text-teal-100 text-lg max-w-sm">
            WhatsApp reminders, member tracking, Google Sheet sync — everything your gym needs.
          </p>
        </div>
        <div className="relative z-10 grid grid-cols-3 gap-4">
          {[["500+","Gyms"],["10K+","Members"],["99%","Delivery"]].map(([val,label]) => (
            <div key={label} className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.1)" }}>
              <div className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>{val}</div>
              <div className="text-teal-200 text-sm">{label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm animate-fade-in">
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--accent)" }}>
              <Dumbbell className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg" style={{ fontFamily: "var(--font-display)", color: "var(--text)" }}>GymSathi</span>
          </div>
          <h2 className="text-3xl font-bold mb-2" style={{ fontFamily: "var(--font-display)", color: "var(--text)" }}>Welcome back</h2>
          <p className="mb-8" style={{ color: "var(--muted)" }}>Sign in to your account</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--muted)" }}>Username</label>
              <input value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl outline-none transition-all text-sm"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text)" }}
                onFocus={e => e.target.style.borderColor = "var(--accent)"}
                onBlur={e => e.target.style.borderColor = "var(--border)"}
                placeholder="Enter username" autoComplete="username" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--muted)" }}>Password</label>
              <div className="relative">
                <input type={show ? "text" : "password"} value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  className="w-full px-4 py-3 pr-11 rounded-xl outline-none transition-all text-sm"
                  style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text)" }}
                  onFocus={e => e.target.style.borderColor = "var(--accent)"}
                  onBlur={e => e.target.style.borderColor = "var(--border)"}
                  placeholder="Enter password" autoComplete="current-password" />
                <button type="button" onClick={() => setShow(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted)" }}>
                  {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all text-sm mt-2"
              style={{ background: "var(--accent)", color: "white", opacity: loading ? 0.8 : 1 }}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span>Sign In</span><ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>
          <p className="mt-8 text-center text-xs" style={{ color: "var(--muted)" }}>
            GymSathi — Trusted by gym owners across India
          </p>
        </div>
      </div>
    </div>
  );
}
