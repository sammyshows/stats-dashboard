import { useState } from 'react'
import MetricPanel from './MetricPanel'
import UserListModal from './UserListModal'
import type { UserRef } from './UserListModal'

interface MetricData { count: number; prior: number; pct: number; series: { current: number[]; prior: number[] } }

export default function DualMetricCard({ title, subtitle, icon, color, total, totalLabel, uniqueUsers, users }: {
  title: string
  subtitle: string
  icon: React.ReactNode
  color: string
  total: MetricData
  totalLabel: string
  uniqueUsers: MetricData
  users: UserRef[]
}) {
  const [openUsers, setOpenUsers] = useState(false)
  return (
    <div className="elora-card elora-card-hover p-5 sm:p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-lg">{icon}</div>
        <div>
          <h3 className="text-base font-semibold text-slate-100">{title}</h3>
          <p className="text-[0.65rem] text-slate-500">{subtitle}</p>
        </div>
      </div>
      <div className="flex flex-col gap-6">
        <MetricPanel label={totalLabel} data={total} color={color} />
        <MetricPanel label="Unique Users" data={uniqueUsers} color={color} showLine={false} onOpen={() => setOpenUsers(true)} />
      </div>

      {openUsers && (
        <UserListModal
          users={users}
          title={title}
          subtitle={`${uniqueUsers.count.toLocaleString()} unique users · past 7 days`}
          onClose={() => setOpenUsers(false)}
        />
      )}
    </div>
  )
}