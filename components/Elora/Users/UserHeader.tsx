interface User { id: string; joined_at: string; total_entries: number; total_messages: number; last_active: string }

const fmtDate = (d: string | null) => {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col">
      <span className="text-[0.6rem] uppercase tracking-widest text-slate-500 font-medium">{label}</span>
      <span className="text-lg font-semibold text-white mt-0.5 tabular-nums">{value}</span>
    </div>
  )
}

export default function UserHeader({ user }: { user: User }) {
  return (
    <div className="elora-card elora-accent-bar p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-mono text-base sm:text-lg text-white break-all leading-snug">{user.id}</h1>
          <p className="text-slate-500 text-xs mt-1">Joined {fmtDate(user.joined_at)}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-slate-800">
        <Stat label="Total Entries" value={user.total_entries.toLocaleString()} />
        <Stat label="Messages Sent" value={user.total_messages.toLocaleString()} />
        <Stat label="Last Active" value={fmtDate(user.last_active)} />
      </div>
    </div>
  )
}