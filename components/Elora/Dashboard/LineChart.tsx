export default function LineChart({ current, prior, color, id }: {
  current: number[]
  prior: number[]
  color: string
  id: string
}) {
  const ALL_ZERO = current.every(v => v === 0) && prior.every(v => v === 0)
  const max = ALL_ZERO ? 1 : Math.max(...current, ...prior, 1)
  const n = current.length
  const W = 320, H = 110, T = 6, R = 4, B = 14
  const step = n > 1 ? (W - R * 2) / (n - 1) : 0

  const toPath = (arr: number[]) =>
    arr.map((v, i) => {
      const x = R + i * step
      const y = T + (H - T - B) - ((v / max) * (H - T - B))
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    }).join(' ')

  const curPath = toPath(current)
  const priPath = prior.length ? toPath(prior) : ''
  const areaPath = `${curPath} L${R + (n - 1) * step},${H - B} L${R},${H - B} Z`

  const isShort = n <= 7
  const today = new Date()
  const labels = isShort
    ? Array.from({ length: n }, (_, i) => {
        const d = new Date(today)
        d.setDate(today.getDate() - (n - 1 - i))
        return d.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2)
      })
    : [
        (() => { const d = new Date(today); d.setDate(today.getDate() - (n - 1)); return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) })(),
        (() => { const d = new Date(today); d.setDate(today.getDate()); d.setMonth(d.getMonth()); return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) })(),
      ]

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full h-[72px] sm:h-20">
        <defs>
          <linearGradient id={`area-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#area-${id})`} className="elora-area-fade" />
        {priPath && (
          <path d={priPath} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round"
            strokeLinejoin="round" vectorEffect="non-scaling-stroke" opacity="0.3" pathLength="1" className="elora-line-draw" />
        )}
        <path d={curPath} fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round"
          strokeLinejoin="round" vectorEffect="non-scaling-stroke" pathLength="1" className="elora-line-draw" />
        {current.length > 0 && (
          <circle cx={R + (n - 1) * step} cy={T + (H - T - B) - ((current[n - 1] / max) * (H - T - B))}
            r="3" fill={color} className="elora-area-fade" />
        )}
      </svg>
      <div className="flex justify-between px-1" style={{ marginTop: '2px' }}>
        {labels.map((l, i) => (
          <span key={i} className="text-[0.58rem] text-slate-500 font-medium tabular-nums">{l}</span>
        ))}
      </div>
    </div>
  )
}