import { useCallback, useEffect, useState } from 'react'
import Spinner from '@/components/Utility/Spinner'
import UserModal from '@/components/Letterlock/Users/UserModal'
import type { UsersTableRowProp } from '@/interfaces/letterlock/users'

const toProp = (u: any): UsersTableRowProp => ({
  index: 0,
  id: u.user_id,
  levelsCompleted: u.levels_completed_count || 0,
  adsWatchedCount: (u.ads_watched_lives || 0) + (u.ads_watched_moves || 0),
  zeroLivesCount: u.zero_lives_tally || 0,
  letterlockVersion: u.letterlock_version,
  username: u.username,
  testUser: u.test_user,
  deviceModel: u.device_model,
  deviceOS: u.device_os,
  updatedAt: u.updated_at,
  createdAt: u.created_at,
  levelAttempts1Day: u.level_attempts_1_day || 0,
  levelAttempts7Days: u.level_attempts_7_days || 0,
  levelAttempts30Days: u.level_attempts_30_days || 0,
  levelSuccesses1Day: u.level_successes_1_day || 0,
  levelSuccesses7Days: u.level_successes_7_days || 0,
  levelSuccesses30Days: u.level_successes_30_days || 0,
  getUsers: () => {},
})

const relTime = (d: string) => {
  if (!d) return ''
  const ms = Date.now() - new Date(d).getTime()
  const secs = Math.floor(ms / 1000)
  if (secs < 60) return 'just now'
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days}d ago`
  const weeks = Math.floor(days / 7)
  if (weeks === 1) return '1 week ago'
  if (weeks < 5) return `${weeks}w ago`
  const months = Math.floor(days / 30)
  if (months === 1) return '1 month ago'
  if (months < 12) return `${months}mo ago`
  const years = Math.floor(days / 365)
  if (years === 1) return '1 year ago'
  return '2+ years ago'
}

const shortId = (id: string) => '...' + id.slice(-8)

function SortHeader({ label, field, sortField, sortDirection, onSort, className }: {
  label: string
  field: string
  sortField: string
  sortDirection: string
  onSort: (f: string) => void
  className?: string
}) {
  const active = sortField === field
  return (
    <th className={`py-4 pr-3 font-medium cursor-pointer select-none group ${className ?? ''}`} onClick={() => onSort(field)}>
      <span className="inline-flex items-center gap-1">
        {label}
        <svg
          className={`w-3 h-3 transition-opacity ${active ? 'opacity-100 text-violet-400' : 'opacity-0 group-hover:opacity-40 text-slate-500'} ${active && sortDirection === 'asc' ? 'rotate-180' : ''}`}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </span>
    </th>
  )
}

export default function LetterlockUsersTable() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sortField, setSortField] = useState('updated_at')
  const [sortDirection, setSortDirection] = useState('desc')
  const [selected, setSelected] = useState<any | null>(null)

  const getUsers = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/letterlock-users-read', { method: 'POST' })
      const res = await response.json()
      setUsers(res.users || [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { getUsers() }, [getUsers])

  const handleSort = (field: string) => {
    const isSameField = sortField === field
    setSortDirection(isSameField ? (sortDirection === 'asc' ? 'desc' : 'asc') : 'desc')
    setSortField(field)
  }

  const sortedUsers = [...users].sort((a, b) => {
    let aValue: any, bValue: any
    if (sortField === 'ads_watched_count') {
      aValue = a.ads_watched_lives + a.ads_watched_moves
      bValue = b.ads_watched_lives + b.ads_watched_moves
    } else {
      aValue = a[sortField]
      bValue = b[sortField]
    }
    if (!isNaN(aValue) && !isNaN(bValue)) {
      aValue = parseFloat(aValue)
      bValue = parseFloat(bValue)
    } else if (typeof aValue === 'string' && typeof bValue === 'string') {
      aValue = aValue.toLowerCase()
      bValue = bValue.toLowerCase()
    }
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  return (
    <div className="elora-card overflow-hidden">
      <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-base font-semibold text-slate-100">Users</h3>
          <p className="text-[0.65rem] text-slate-500">{sortedUsers.length.toLocaleString()} users</p>
        </div>
      </div>

      {loading ? (
        <div className="p-8 flex justify-center"><Spinner /></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[960px]">
            <thead>
              <tr className="text-[0.65rem] text-slate-500 uppercase tracking-wider bg-slate-900/60">
                <th className="py-4 pr-1 font-medium w-10">#</th>
                <th className="py-4 pr-3 font-medium whitespace-nowrap">Username</th>
                <th className="py-4 pr-3 font-medium">Device Model</th>
                <th className="py-4 pr-3 font-medium">
                  <span className="block">Levels Accomplished</span>
                  <span className="mt-1 flex gap-7">
                    <span className="">24H</span>
                    <span className="">7D</span>
                    <span className="">30D</span>
                  </span>
                </th>
                <SortHeader label="Current Level" field="levels_completed_count" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
                <SortHeader label="Ads Watched" field="ads_watched_count" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
                <SortHeader label="Version" field="letterlock_version" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
                <th className="py-4 pr-3 font-medium">Device OS</th>
                <SortHeader label="Updated" field="updated_at" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
                <SortHeader label="Created" field="created_at" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
              </tr>
            </thead>
            <tbody>
              {sortedUsers.map((u, i) => (
                <tr
                  key={u.user_id}
                  onClick={() => setSelected(u)}
                  className="elora-table-row border-t border-slate-800/40 cursor-pointer"
                >
                  <td className="py-3 pl-5 pr-1">
                    <span className={`text-xs font-medium font-mono w-6 h-6 rounded-md flex items-center justify-center ${
                      i < 3 ? 'bg-violet-500/15 text-violet-400' : 'text-slate-500'
                    }`}>
                      {i + 1}
                    </span>
                  </td>
                  <td className="py-3 pr-3 min-w-[180px]">
                    <span className="text-sm text-slate-200 font-mono">{u.username || shortId(u.user_id)}</span>
                    {u.test_user && (
                      <span className="ml-2 text-[0.55rem] font-medium uppercase tracking-widest text-red-400 bg-red-500/10 border border-red-500/30 rounded-full px-1.5 py-0.5">
                        Test
                      </span>
                    )}
                  </td>
                  <td className="py-3 pr-3 min-w-[160px]">
                    <span className="text-xs text-slate-400">{u.device_model || '—'}</span>
                  </td>
                  <td className="py-3 pr-3">
                    <div className="flex gap-6 justify-start">
                      {[
                        { a: u.level_attempts_1_day, s: u.level_successes_1_day, label: '24H' },
                        { a: u.level_attempts_7_days, s: u.level_successes_7_days, label: '7D' },
                        { a: u.level_attempts_30_days, s: u.level_successes_30_days, label: '30D' },
                      ].map((x) => (
                        <span key={x.label} className="min-w-[20px] relative inline-block leading-none">
                          <span className="text-sm font-semibold text-slate-200 tabular-nums">{x.s || 0}</span>
                          <span className="absolute -top-1 translate-x-[3px] text-[0.625rem] leading-none text-slate-500 tabular-nums">{x.a || 0}</span>
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 pr-3 text-xs text-slate-400 tabular-nums">{u.levels_completed_count || 0}</td>
                  <td className="py-3 pr-3 text-sm font-semibold text-slate-200 tabular-nums">
                    {(u.ads_watched_lives || 0) + (u.ads_watched_moves || 0)}
                  </td>
                  <td className="py-3 pr-3 text-xs text-slate-400 font-mono">{u.letterlock_version || '—'}</td>
                  <td className="py-3 pr-3 text-xs text-slate-400">{u.device_os || '—'}</td>
                  <td className="py-3 pr-3 text-xs text-slate-400 font-mono whitespace-nowrap">{relTime(u.updated_at)}</td>
                  <td className="py-3 pr-5 text-xs text-slate-400 font-mono whitespace-nowrap">{relTime(u.created_at)}</td>
                </tr>
              ))}
              {sortedUsers.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-10 text-center text-sm text-slate-500">No users match the current filter.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <UserModal user={toProp(selected)} onClose={(reload) => { setSelected(null); if (reload) getUsers() }} />
      )}
    </div>
  )
}