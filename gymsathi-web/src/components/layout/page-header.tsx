export function PageHeader({ title, subtitle, action }: { title:string; subtitle?:string; action?:React.ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-8">
      <div>
        <h1 className="text-2xl font-bold mb-1" style={{ fontFamily:"var(--font-display)", color:"var(--text)" }}>{title}</h1>
        {subtitle && <p className="text-sm" style={{ color:"var(--muted)" }}>{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
