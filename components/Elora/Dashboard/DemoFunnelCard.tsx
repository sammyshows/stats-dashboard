import { useState } from 'react'
import AnimatedNumber from '../AnimatedNumber'
import DeltaBadge from './DeltaBadge'
import UserListModal from './UserListModal'
import type { UserRef } from './UserListModal'

interface StepStat { step: number; label: string; count: number }

interface CompletionData {
  week: number
  prior: number
  pct: number
  rate: number
  priorRate: number
  ratePct: number
}

export default function DemoFunnelCard({ starters, completion, steps, starterUsers, color }: {
  starters: { count: number; prior: number; pct: number }
  completion: CompletionData
  steps: StepStat[]
  starterUsers: UserRef[]
  color: string
}) {
  const [openUsers, setOpenUsers] = useState(false)
  const max = Math.max(...steps.map((s) => s.count), 1)

  return (
    <div className="elora-card elora-card-hover p-5 sm:p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-lg">🎯</div>
        <div>
          <h3 className="text-base font-semibold text-slate-100">Demo Completion + Funnel</h3>
          <p className="text-[0.65rem] text-slate-500">7d onboarding flow</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-5">
        <div>
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => setOpenUsers(true)}
              className="flex items-center gap-1.5 text-[0.65rem] uppercase tracking-widest text-slate-400 hover:text-violet-300 font-medium transition-colors group"
              title="View users"
            >
              Started
              <svg className="opacity-0 group-hover:opacity-100 transition-opacity" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h6v6" /><path d="M10 14 21 3" /><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              </svg>
            </button>
            <DeltaBadge pct={starters.pct} current={starters.count} prior={starters.prior} />
          </div>
          <button onClick={() => setOpenUsers(true)} className="flex items-baseline gap-2 group mb-px text-left" title="View users">
            <span className="text-3xl font-bold text-white tabular-nums group-hover:text-violet-300 transition-colors">
              <AnimatedNumber value={starters.count} />
            </span>
            <span className="text-sm text-slate-500 tabular-nums group-hover:text-slate-400 transition-colors">vs {starters.prior.toLocaleString()}</span>
          </button>
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[0.65rem] uppercase tracking-widest text-slate-400 font-medium">Completion</span>
            <DeltaBadge pct={completion.pct} current={completion.week} prior={completion.prior} />
          </div>
          <span className="text-3xl font-bold text-white tabular-nums">
            <AnimatedNumber value={completion.week} />
          </span>
          <span className="text-sm text-slate-500 tabular-nums"> vs {completion.prior.toLocaleString()}</span>
        </div>
      </div>

      <div className="flex items-center justify-between mb-2">
        <span className="text-[0.65rem] uppercase tracking-widest text-slate-400 font-medium">Completion rate</span>
        <DeltaBadge pct={completion.ratePct} current={completion.rate} prior={completion.priorRate} />
      </div>
      <div className="flex items-baseline gap-2 mb-4">
        <span className="text-2xl font-bold text-white tabular-nums">
          <AnimatedNumber value={completion.rate} />
          <span className="text-lg text-slate-400">%</span>
        </span>
        <span className="text-sm text-slate-500 tabular-nums">prior {completion.priorRate}%</span>
      </div>

      <div className="pt-4 border-t border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[0.65rem] uppercase tracking-widest text-slate-400 font-medium">Users per step</span>
          <span className="text-[0.6rem] text-slate-500">current 7d funnels</span>
        </div>
        <div className="flex items-end gap-1.5" style={{ height: 96 }}>
          {steps.map((s) => (
            <div key={s.step} className="flex-1 flex flex-col items-center gap-1 h-full">
              <span className="text-[0.6rem] text-slate-400 font-medium tabular-nums">{s.count}</span>
              <div className="w-full flex-1 flex items-end">
                <div
                  className="w-full rounded-t-md"
                  style={{ height: `${Math.max((s.count / max) * 68, s.count > 0 ? 8 : 2)}%`, backgroundColor: color, opacity: s.count > 0 ? 1 : 0.18 }}
                />
              </div>
              <span className="text-[0.55rem] text-slate-500 leading-none" title={s.label}>{s.step}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2.5">
          {steps.map((s) => (
            <span key={s.step} className="text-[0.55rem] text-slate-500">
              <span className="text-slate-400">{s.step}</span> {s.label}
            </span>
          ))}
        </div>
      </div>

      {openUsers && (
        <UserListModal
          users={starterUsers}
          title="Demo Starters"
          subtitle={`${starters.count.toLocaleString()} unique users · past 7 days`}
          onClose={() => setOpenUsers(false)}
        />
      )}
    </div>
  )
}