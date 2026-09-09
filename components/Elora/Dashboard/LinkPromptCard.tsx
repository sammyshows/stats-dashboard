import { useState } from 'react'
import AnimatedNumber from '../AnimatedNumber'
import DeltaBadge from './DeltaBadge'
import UserListModal from './UserListModal'
import type { UserRef } from './UserListModal'

interface Stat { count: number; prior: number; pct: number }

interface LinkPromptData {
  shown: Stat & { users: UserRef[] }
  linked: Stat & { users: UserRef[] }
  rate: number
}

function ClickableStat({ label, stat, onOpen, accent }: {
  label: string
  stat: Stat
  onOpen?: () => void
  accent?: string
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-[0.65rem] uppercase tracking-widest text-slate-400 font-medium">{label}</span>
        <DeltaBadge pct={stat.pct} current={stat.count} prior={stat.prior} />
      </div>
      {onOpen ? (
        <button onClick={onOpen} className="flex items-baseline gap-1.5 group text-3xl font-bold text-white tabular-nums" title="View users">
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

export default function LinkPromptCard({ data }: { data: LinkPromptData }) {
  const [openModal, setOpenModal] = useState<null | 'shown' | 'linked'>(null)
  return (
    <div className="elora-card elora-card-hover p-5 sm:p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-lg">🛡️</div>
        <div>
          <h3 className="text-base font-semibold text-slate-100">Don't Lose Your Entries</h3>
          <p className="text-[0.65rem] text-slate-500">link-account prompt · 7d vs prior</p>
        </div>
      </div>

      <div className="flex flex-col gap-5 sm:divide-y sm:divide-slate-800">
        <div className="grid grid-cols-2 gap-4">
          <ClickableStat label="Shown" stat={data.shown} onOpen={() => setOpenModal('shown')} />
          <ClickableStat label="Linked" stat={data.linked} onOpen={() => setOpenModal('linked')} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[0.65rem] uppercase tracking-widest text-slate-400 font-medium">Conversion</span>
          <span className="text-xl font-bold text-white tabular-nums">
            <AnimatedNumber value={data.rate} />
            <span className="text-base text-slate-400">%</span>
          </span>
        </div>
      </div>

      {openModal === 'shown' && (
        <UserListModal
          users={data.shown.users}
          title="Prompt Shown"
          subtitle={`${data.shown.count.toLocaleString()} unique users · past 7 days`}
          onClose={() => setOpenModal(null)}
        />
      )}
      {openModal === 'linked' && (
        <UserListModal
          users={data.linked.users}
          title="Account Linked"
          subtitle={`${data.linked.count.toLocaleString()} unique users · past 7 days`}
          onClose={() => setOpenModal(null)}
        />
      )}
    </div>
  )
}