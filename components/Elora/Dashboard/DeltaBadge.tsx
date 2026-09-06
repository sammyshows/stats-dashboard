export default function DeltaBadge({ pct, prior }: {
  pct: number
  current?: number
  prior?: number
}) {
  if (prior === 0) {
    return <span className="elora-delta elora-delta-flat"><span>—</span></span>
  }
  const cls = pct > 0 ? 'elora-delta elora-delta-up' : pct < 0 ? 'elora-delta elora-delta-down' : 'elora-delta elora-delta-flat'
  const arrow = pct > 0 ? '▲' : pct < 0 ? '▼' : '—'
  return <span className={cls}><span>{arrow}</span><span>{Math.abs(pct)}%</span></span>
}