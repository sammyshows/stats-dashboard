import { useState } from 'react'
import MetricPanel from './MetricPanel'
import UserListModal from './UserListModal'
import type { UserRef } from './UserListModal'

interface CategoryStat { key: string; label: string; current: number; prior: number; pct: number }

interface MetricData { count: number; prior: number; pct: number; series: { current: number[]; prior: number[] } }

export default function CategoryClicksCard({ uniqueUsers, categories, users, color }: {
  uniqueUsers: MetricData
  categories: CategoryStat[]
  users: UserRef[]
  color: string
}) {
  const [openUsers, setOpenUsers] = useState(false)
  const max = Math.max(...categories.map((c) => c.current), 1)

  return (
    <div className="elora-card elora-card-hover p-5 sm:p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-lg">🖱️</div>
        <div>
          <h3 className="text-base font-semibold text-slate-100">Insights Category Clicks</h3>
          <p className="text-[0.65rem] text-slate-500">7d engagement on category cards</p>
        </div>
      </div>

      <MetricPanel label="Unique Users" data={uniqueUsers} color={color} showLine={false} onOpen={() => setOpenUsers(true)} />

      <div className="mt-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[0.65rem] uppercase tracking-widest text-slate-400 font-medium">Per category</span>
          <span className="text-[0.6rem] text-slate-500">current 7d vs prior</span>
        </div>
        {categories.length === 0 ? (
          <p className="text-xs text-slate-500 py-2">No clicks in the last 14 days.</p>
        ) : (
          <div className="space-y-2.5">
            {categories.map((c) => (
              <div key={c.key}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-slate-300">{c.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="elora-bar-track flex-1 h-2">
                    <div
                      className="elora-bar-fill"
                      style={{ width: `${(c.current / max) * 100}%`, backgroundColor: color }}
                    />
                  </div>
                  <div className="flex items-baseline gap-1.5 w-16 justify-end">
                    <span className="text-sm font-semibold text-white tabular-nums">{c.current}</span>
                    <span className="text-xs text-slate-500 tabular-nums">vs {c.prior}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {openUsers && (
        <UserListModal
          users={users}
          title="Insights Category Clicks"
          subtitle={`${uniqueUsers.count.toLocaleString()} unique users · past 7 days`}
          onClose={() => setOpenUsers(false)}
        />
      )}
    </div>
  )
}