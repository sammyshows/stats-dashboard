import { useState } from 'react'
import MetricPanel from './MetricPanel'
import UserListModal from './UserListModal'
import type { UserRef } from './UserListModal'

interface MetricData { count: number; prior: number; pct: number; series: { current: number[]; prior: number[] } }

export default function EntityAnalysesCard({ totalViews, uniqueUsers, users, color }: {
  totalViews: MetricData
  uniqueUsers: MetricData
  users: UserRef[]
  color: string
}) {
  const [openUsers, setOpenUsers] = useState(false)
  return (
    <div className="elora-card elora-card-hover p-5 sm:p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-lg">🔍</div>
        <div>
          <h3 className="text-base font-semibold text-slate-100">Entity Analyses Viewed</h3>
          <p className="text-[0.65rem] text-slate-500">7d analysis views</p>
        </div>
      </div>
      <div className="flex flex-col gap-6">
        <MetricPanel label="Total Views" data={totalViews} color={color} />
        <MetricPanel label="Unique Users" data={uniqueUsers} color={color} showLine={false} onOpen={() => setOpenUsers(true)} />
      </div>

      {openUsers && (
        <UserListModal
          users={users}
          title="Entity Analyses Viewers"
          subtitle={`${uniqueUsers.count.toLocaleString()} unique users · past 7 days`}
          onClose={() => setOpenUsers(false)}
        />
      )}
    </div>
  )
}