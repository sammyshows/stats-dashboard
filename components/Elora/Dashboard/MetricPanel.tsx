import { useId } from 'react'
import AnimatedNumber from '../AnimatedNumber'
import DeltaBadge from './DeltaBadge'
import LineChart from './LineChart'

interface SeriesData { current: number[]; prior: number[] }
interface MetricData { count: number; prior: number; pct: number; series: SeriesData }

function MetricPanel({ label, data, color, showLine = true, onOpen }: {
  label: string
  data: MetricData
  color: string
  showLine?: boolean
  onOpen?: () => void
}) {
  const id = useId().replace(/:/g, '')
  const clickable = !!onOpen
  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-2">
        {clickable ? (
          <button
            onClick={onOpen}
            className="flex items-center gap-1.5 text-[0.65rem] uppercase tracking-widest text-slate-400 hover:text-violet-300 font-medium transition-colors group"
            title="View users"
          >
            {label}
            <svg className="opacity-0 group-hover:opacity-100 transition-opacity" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h6v6" /><path d="M10 14 21 3" /><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            </svg>
          </button>
        ) : (
          <span className="text-[0.65rem] uppercase tracking-widest text-slate-400 font-medium">{label}</span>
        )}
        <DeltaBadge pct={data.pct} current={data.count} prior={data.prior} />
      </div>
      {clickable ? (
        <button onClick={onOpen} className="flex items-baseline gap-2 mb-3 group text-left" title="View users">
          <span className="text-3xl font-bold text-white tabular-nums group-hover:text-violet-300 transition-colors">
            <AnimatedNumber value={data.count} />
          </span>
          <span className="text-sm text-slate-500 tabular-nums group-hover:text-slate-400 transition-colors">vs {data.prior.toLocaleString()}</span>
        </button>
      ) : (
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-3xl font-bold text-white tabular-nums">
            <AnimatedNumber value={data.count} />
          </span>
          <span className="text-sm text-slate-500 tabular-nums">vs {data.prior.toLocaleString()}</span>
        </div>
      )}
      {showLine && (
        <>
          <LineChart current={data.series.current} prior={data.series.prior} color={color} id={`${label}-${id}`} />
          <div className="flex items-center gap-4 mt-1.5">
            <span className="flex items-center gap-1 text-[0.6rem] text-slate-500">
              <span className="w-2 h-0.5 rounded-full" style={{ backgroundColor: color }} />
              Current
            </span>
            <span className="flex items-center gap-1 text-[0.6rem] text-slate-500">
              <span className="w-2 h-0.5 rounded-full opacity-30" style={{ backgroundColor: color }} />
              Prior
            </span>
          </div>
        </>
      )}
    </div>
  )
}

export default MetricPanel
export type { MetricData }