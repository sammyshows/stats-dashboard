import { useCallback, useState } from 'react'
import Link from 'next/link'
import EmojiPicker from '../EmojiPicker'

interface User { user_id: string; latest_created_at: string; total_entry_count: number; emoji: string | null }

const shortId = (id: string) => '...' + id.slice(-12)

export default function TopUsersTable({ users, onUpdate }: { users: User[]; onUpdate: () => void }) {
  const [localEmojis, setLocalEmojis] = useState<Record<string, string | null>>({})
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
    return `${years}y ago`
  }

  const maxEntries = Math.max(...users.map((u) => u.total_entry_count), 1)

  const handleEmoji = useCallback(async (userId: string, emoji: string) => {
    setLocalEmojis(prev => ({ ...prev, [userId]: emoji }))
    await fetch('/api/elora-user-emoji-update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, emoji }),
    })
    onUpdate()
  }, [onUpdate])

  return (
    <div className="elora-card elora-fade-up elora-delay-2 p-5 sm:p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-base font-semibold text-slate-100">Top Users</h3>
          <p className="text-[0.65rem] text-slate-500">By latest activity</p>
        </div>
        <Link
          href="/elora/users"
          className="flex items-center gap-1.5 text-[0.7rem] text-violet-400 hover:text-violet-300 font-medium transition-colors"
        >
          <span>Full table</span>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 3h6v6" /><path d="M10 14 21 3" /><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          </svg>
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[0.65rem] text-slate-500 uppercase tracking-wider border-b border-slate-800">
              <th className="pb-3 pr-1 font-medium">#</th>
              <th className="pb-3 pl-1 pr-3 font-medium">Emoji</th>
              <th className="pb-3 pl-4 pr-3 font-medium">User</th>
              <th className="pb-3 pr-4 font-medium">Latest</th>
              <th className="pb-3 font-medium text-right">Entries</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => (
              <tr key={u.user_id} className="elora-table-row border-b border-slate-800/40 last:border-0">
                <td className="py-3 pr-1">
                  <span className={`text-xs font-medium font-mono w-6 h-6 rounded-md flex items-center justify-center ${
                    i < 3 ? 'bg-violet-500/15 text-violet-400' : 'text-slate-500'
                  }`}>
                    {i + 1}
                  </span>
                </td>
                <td className="py-3 pl-1 pr-3">
                  <EmojiPicker current={localEmojis[u.user_id] !== undefined ? localEmojis[u.user_id] : u.emoji} onSelect={(e) => handleEmoji(u.user_id, e)} />
                </td>
                <td className="py-3 pl-4 pr-3">
                  <Link
                    href={`/elora/users/${u.user_id}`}
                    className="text-violet-400 hover:text-violet-300 font-mono text-xs transition-colors"
                  >
                    {shortId(u.user_id)}
                  </Link>
                </td>
                <td className="py-3 pr-4 text-xs text-slate-400 font-medium">{relTime(u.latest_created_at)}</td>
                <td className="py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <span className="text-sm font-semibold text-slate-200 tabular-nums">
                      {u.total_entry_count.toLocaleString()}
                    </span>
                    <div className="w-12 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-400 transition-all duration-700"
                        style={{ width: `${(u.total_entry_count / maxEntries) * 100}%` }}
                      />
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}