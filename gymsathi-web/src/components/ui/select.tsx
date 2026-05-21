"use client";
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> { label?: string; options: { value: string; label: string }[]; }
export function Select({ label, options, ...props }: SelectProps) {
  return (
    <div className="w-full">
      {label && <label className="block text-xs font-medium mb-1.5" style={{ color:"var(--muted)" }}>{label}</label>}
      <select className="w-full px-3 py-2.5 rounded-xl text-sm outline-none appearance-none"
        style={{ background:"var(--bg-card)", border:"1px solid var(--border)", color:"var(--text)" }} {...props}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}
