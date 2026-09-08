import { useId } from 'react'
import AnimatedNumber from '../AnimatedNumber'
import LineChart from './LineChart'

interface SeriesData { current: number[]; prior: number[] }
interface PeriodData { count: number; prior: number; pct: number; series: SeriesData }

function DeltaBadge({ pct }: { pct: number }) {
  const cls = pct > 0 ? 'elora-delta elora-delta-up' : pct < 0 ? 'elora-delta elora-delta-down' : 'elora-delta elora-delta-flat'
  const arrow = pct > 0 ? '▲' : pct < 0 ? '▼' : '—'
  return <span className={cls}><span>{arrow}</span><span>{Math.abs(pct)}%</span></span>
}

function PeriodPanel({ label, data, color, onOpen }: {
  label: string
  data: PeriodData
  color: string
  onOpen?: () => void
}) {
  const id = useId().replace(/:/g, '')
  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[0.65rem] uppercase tracking-widest text-slate-400 font-medium">{label}</span>
        <DeltaBadge pct={data.pct} />
      </div>
      {onOpen ? (
        <button
          onClick={onOpen}
          className="flex items-baseline gap-2 text-left group cursor-pointer transition-colors tabular-nums"
          title="View users"
        >
          <span className="text-3xl font-bold text-white group-hover:text-violet-300 tabular-nums">
            <AnimatedNumber value={data.count} />
          </span>
          <span className="text-sm text-slate-500 group-hover:text-slate-400 tabular-nums">
            vs {data.prior.toLocaleString()}
          </span>
        </button>
      ) : (
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-3xl font-bold text-white tabular-nums">
            <AnimatedNumber value={data.count} />
          </span>
          <span className="text-sm text-slate-500 tabular-nums">vs {data.prior.toLocaleString()}</span>
        </div>
      )}
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
    </div>
  )
}

export default function ComparisonChart({ title, icon, color, week, month, onOpen }: {
  title: string
  icon: React.ReactNode
  color: string
  week: PeriodData
  month: PeriodData
  onOpen?: () => void
}) {
  return (
    <div className="elora-card elora-card-hover p-5 sm:p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-lg">{icon}</div>
        <div>
          <h3 className="text-base font-semibold text-slate-100">{title}</h3>
          <p className="text-[0.65rem] text-slate-500">
            {onOpen ? 'click count to view users' : 'rolling period'}
          </p>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-5 sm:gap-8 sm:divide-x sm:divide-slate-800">
        <PeriodPanel label="7 Days" data={week} color={color} onOpen={onOpen} />
        <PeriodPanel label="30 Days" data={month} color={color} onOpen={onOpen} />
      </div>
      {onOpen && (
        <div className="mt-3 flex justify-end">
          <button
            onClick={onOpen}
            className="text-[0.65rem] text-slate-500 hover:text-violet-300 font-medium transition-colors"
          >
            View users →
          </button>
        </div>
      )}
    </div>
  )
}