export default function AppVersionCard({ distribution }: {
  distribution: { version: string; users: number }[]
}) {
  const total = distribution.reduce((a, v) => a + v.users, 0)
  const max = Math.max(...distribution.map((v) => v.users), 1)

  if (total === 0) {
    return (
      <div className="elora-card elora-card-hover p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-lg">📱</div>
          <div>
            <h3 className="text-base font-semibold text-slate-100">App Versions</h3>
            <p className="text-[0.65rem] text-slate-500">active users · past 7 days</p>
          </div>
        </div>
        <p className="text-xs text-slate-500">No active users recorded this period.</p>
      </div>
    )
  }

  return (
    <div className="elora-card elora-card-hover p-5 sm:p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-lg">📱</div>
        <div>
          <h3 className="text-base font-semibold text-slate-100">App Versions</h3>
          <p className="text-[0.65rem] text-slate-500">active users · past 7 days</p>
        </div>
      </div>

      <div className="mb-4 flex items-baseline gap-2">
        <span className="text-3xl font-bold text-white tabular-nums">{total.toLocaleString()}</span>
        <span className="text-sm text-slate-500 tabular-nums">active users</span>
      </div>

      <div className="space-y-3">
        {distribution.map((v) => {
          const pct = Math.round((v.users / total) * 1000) / 10
          return (
            <div key={v.version}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-slate-300 font-mono">{v.version}</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-sm font-semibold text-white tabular-nums">{v.users.toLocaleString()}</span>
                  <span className="text-xs text-slate-500 tabular-nums">{pct}%</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="elora-bar-track flex-1 h-2">
                  <div
                    className="elora-bar-fill"
                    style={{ width: `${(v.users / max) * 100}%`, backgroundColor: '#a78bfa', opacity: v.users / max > 0.5 ? 1 : 0.6 }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}