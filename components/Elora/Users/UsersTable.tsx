import { useCallback, useState } from 'react'
import Link from 'next/link'
import EmojiPicker from '../EmojiPicker'

interface User { user_id: string; latest_created_at: string; total_entry_count: number; emoji: string | null }

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

const fmt = (d: string) => {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

const shortId = (id: string) => '...' + id.slice(-12)

export default function UsersTableHead() {
  return (
    <tr className="text-[0.65rem] text-slate-500 uppercase tracking-wider">
      <th className="py-4 pr-1 font-medium sticky top-0 bg-slate-900/95 backdrop-blur z-10">#</th>
      <th className="py-4 pl-1 pr-3 font-medium sticky top-0 bg-slate-900/95 backdrop-blur z-10">Emoji</th>
      <th className="py-4 pl-4 pr-4 font-medium sticky top-0 bg-slate-900/95 backdrop-blur z-10">User</th>
      <th className="py-4 pr-4 font-medium sticky top-0 bg-slate-900/95 backdrop-blur z-10">Latest</th>
      <th className="py-4 font-medium text-right sticky top-0 bg-slate-900/95 backdrop-blur z-10">Entries</th>
    </tr>
  )
}

export function UsersTableRow({ user, index, maxEntries, onUpdate }: {
  user: User; index: number; maxEntries: number; onUpdate: () => void
}) {
  const [localEmoji, setLocalEmoji] = useState<string | null | undefined>(undefined)

  const handleEmoji = useCallback(async (emoji: string) => {
    setLocalEmoji(emoji)
    await fetch('/api/elora-user-emoji-update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.user_id, emoji }),
    })
    onUpdate()
  }, [user.user_id, onUpdate])

  return (
    <tr className="elora-table-row border-t border-slate-800/40">
      <td className="py-3.5 pr-1">
        <span className="text-xs font-medium font-mono w-7 h-7 rounded-lg flex items-center justify-center bg-slate-800/70 text-slate-400">
          {index + 1}
        </span>
      </td>
      <td className="py-3.5 pl-1 pr-3">
        <EmojiPicker current={localEmoji !== undefined ? localEmoji : user.emoji} onSelect={handleEmoji} />
      </td>
      <td className="py-3.5 pl-4 pr-4">
        <Link
          href={`/elora/users/${user.user_id}`}
          className="text-violet-400 hover:text-violet-300 font-mono text-xs break-all transition-colors hover:underline underline-offset-2"
        >
          {shortId(user.user_id)}
        </Link>
      </td>
      <td className="py-3.5 pr-4 text-xs text-slate-400 font-medium">{relTime(user.latest_created_at)}</td>
      <td className="py-3.5 text-right">
        <div className="flex items-center justify-end gap-2.5">
          <span className="text-sm font-semibold text-slate-200 tabular-nums">
            {user.total_entry_count.toLocaleString()}
          </span>
          <div className="w-16 h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-400"
              style={{ width: `${(user.total_entry_count / maxEntries) * 100}%` }}
            />
          </div>
        </div>
      </td>
    </tr>
  )
}