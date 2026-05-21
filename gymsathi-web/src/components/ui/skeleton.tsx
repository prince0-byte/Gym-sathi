export function Skeleton({ className="" }: { className?: string }) {
  return <div className={`rounded-xl animate-shimmer ${className}`} style={{ minHeight:20 }} />;
}
export function StatCardSkeleton() {
  return (
    <div className="rounded-2xl p-5" style={{ background:"var(--bg-card)", border:"1px solid var(--border)" }}>
      <Skeleton className="w-9 h-9 mb-4" /><Skeleton className="w-16 h-7 mb-2" /><Skeleton className="w-24 h-3" />
    </div>
  );
}
export function TableRowSkeleton({ cols=5 }: { cols?: number }) {
  return <tr>{Array.from({length:cols}).map((_,i) => <td key={i} className="px-4 py-3"><Skeleton className="h-3 w-full" /></td>)}</tr>;
}
