import { useState } from 'react'
import AnimatedNumber from '../AnimatedNumber'
import DeltaBadge from './DeltaBadge'
import UserListModal from './UserListModal'
import type { UserRef } from './UserListModal'

interface Stat { count: number; prior: number; pct: number }

interface MetricStat {
  count: number
  prior: number
  pct: number
  users: UserRef[]
}

function ClickableStat({ label, stat, onOpen }: {
  label: string
  stat: { count: number; prior: number; pct: number }
  onOpen?: () => void
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-[0.65rem] uppercase tracking-widest text-slate-400 font-medium">{label}</span>
        <DeltaBadge pct={stat.pct} current={stat.count} prior={stat.prior} />
      </div>
      {onOpen ? (
        <button
          onClick={onOpen}
          className="flex items-baseline gap-1.5 text-left group text-3xl font-bold text-white tabular-nums"
          title="View users"
        >
          <span className="group-hover:text-violet-300 transition-colors">
            <AnimatedNumber value={stat.count} />
          </span>
          <span className="text-sm text-slate-500 tabular-nums group-hover:text-slate-400 transition-colors">
            vs {stat.prior.toLocaleString()}
          </span>
        </button>
      ) : (
        <div className="flex items-baseline gap-1.5 text-3xl font-bold text-white tabular-nums">
          <span><AnimatedNumber value={stat.count} /></span>
          <span className="text-sm text-slate-500 tabular-nums">vs {stat.prior.toLocaleString()}</span>
        </div>
      )}
    </div>
  )
}

export default function TimelineActivityCard({ created, viewed, color }: {
  created: MetricStat
  viewed: MetricStat
  color: string
}) {
  const [openModal, setOpenModal] = useState<null | 'created' | 'viewed'>(null)
  return (
    <div className="elora-card elora-card-hover p-5 sm:p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-lg">🧭</div>
        <div>
          <h3 className="text-base font-semibold text-slate-100">Timelines</h3>
          <p className="text-[0.65rem] text-slate-500">created &amp; opened · 7d vs prior</p>
        </div>
      </div>

      <div className="flex flex-col gap-5 sm:divide-y sm:divide-slate-800">
        <div className="grid grid-cols-2 gap-4">
          <ClickableStat label="Created" stat={created} onOpen={() => setOpenModal('created')} />
          <ClickableStat label="Opened" stat={viewed} onOpen={() => setOpenModal('viewed')} />
        </div>
      </div>

      {openModal === 'created' && (
        <UserListModal
          users={created.users}
          title="Timeline Creators"
          subtitle={`${created.users.length.toLocaleString()} unique users · past 7 days`}
          onClose={() => setOpenModal(null)}
        />
      )}
      {openModal === 'viewed' && (
        <UserListModal
          users={viewed.users}
          title="Timeline Openers"
          subtitle={`${viewed.users.length.toLocaleString()} unique users · past 7 days`}
          onClose={() => setOpenModal(null)}
        />
      )}
    </div>
  )
}