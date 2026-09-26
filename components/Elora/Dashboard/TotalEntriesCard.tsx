import { useId } from 'react'
import AnimatedNumber from '../AnimatedNumber'
import LineChart from './LineChart'
import DeltaBadge from './DeltaBadge'

interface SeriesData { current: number[]; prior: number[] }
interface PeriodData { count: number; prior: number; pct: number; series: SeriesData }

function PeriodRow({ label, data, color }: { label: string; data: PeriodData; color: string }) {
  const id = useId().replace(/:/g, '')
  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[0.65rem] uppercase tracking-widest text-slate-400 font-medium">{label}</span>
        <DeltaBadge pct={data.pct} current={data.count} prior={data.prior} />
      </div>
      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-3xl font-bold text-white tabular-nums">
          <AnimatedNumber value={data.count} />
        </span>
        <span className="text-sm text-slate-500 tabular-nums">vs {data.prior.toLocaleString()}</span>
      </div>
      <LineChart current={data.series.current} prior={data.series.prior} color={color} id={`${label}-${id}`} />
    </div>
  )
}

export default function TotalEntriesCard({ regular, guided, color, onOpen }: {
  regular: PeriodData
  guided: PeriodData
  color: string
  onOpen?: () => void
}) {
  return (
    <div className="elora-card elora-card-hover p-5 sm:p-6 flex flex-col">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-lg">📄</div>
        <div>
          <h3 className="text-base font-semibold text-slate-100">Total Entries</h3>
          <p className="text-[0.65rem] text-slate-500">
            {onOpen ? 'click count to view users' : 'regular &amp; guided · 7d/30d'}
          </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-6 justify-center">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[0.65rem] uppercase tracking-widest text-slate-400 font-medium">Regular</span>
            <span className="text-[0.6rem] text-slate-500">non-guided</span>
          </div>
          <div className="flex flex-col lg:flex-row lg:gap-6">
            <PeriodRow label="7 Days" data={regular} color={color} />
            <PeriodRow label="30 Days" data={regular} color={color} />
          </div>
        </div>

        <div className="pt-5 border-t border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[0.65rem] uppercase tracking-widest text-slate-400 font-medium">Guided</span>
            <span className="text-[0.6rem] text-slate-500">guided journaling</span>
          </div>
          <div className="flex flex-col lg:flex-row lg:gap-6">
            <PeriodRow label="7 Days" data={guided} color={color} />
            <PeriodRow label="30 Days" data={guided} color={color} />
          </div>
        </div>
      </div>
    </div>
  )
}