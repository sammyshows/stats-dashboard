import DeltaBadge from '../Dashboard/DeltaBadge'

interface WindowStat { week: number; prior: number; pct: number }

interface GenerationStat {
  started: number
  startedPrior: number
  succeeded: number
  succeededPrior: number
  successRate: number
  successPriorRate: number
}

interface CategoryStat { key: string; label: string; current: number; prior: number; involvement: number; pct: number }
interface CategoryCount { key: string; label: string; count: number }

interface InsightsData {
  categoryTaps: WindowStat
  categoryBreakdown: CategoryStat[]
  entityViews: WindowStat
  entityBreakdown: CategoryCount[]
  timelines: { opened: WindowStat; eventsViewed: WindowStat; deleted: WindowStat }
  generation: GenerationStat
}

function CardHeader({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-9 h-9 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-lg">{icon}</div>
      <div>
        <h3 className="text-base font-semibold text-slate-100">{title}</h3>
        <p className="text-[0.65rem] text-slate-500">{subtitle}</p>
      </div>
    </div>
  )
}

function BigStat({ label, stat, suffix }: { label: string; stat: WindowStat; suffix?: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[0.65rem] uppercase tracking-widest text-slate-400 font-medium">{label}</span>
        <DeltaBadge pct={stat.pct} current={stat.week} prior={stat.prior} />
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-white tabular-nums">
          {stat.week.toLocaleString()}{suffix && <span className="text-xl text-slate-400">{suffix}</span>}
        </span>
        <span className="text-sm text-slate-500 tabular-nums">vs {stat.prior.toLocaleString()}</span>
      </div>
    </div>
  )
}

const CATEGORY_COLORS = ['#a78bfa', '#c4b5fd', '#ddd6fe', '#a78bfa', '#8b5cf6', '#7c3aed']

export default function UserInsights({ insights }: { insights: InsightsData }) {
  const { categoryBreakdown, entityBreakdown } = insights
  const maxCat = Math.max(...categoryBreakdown.map((c) => c.current), 1)
  const totalViews = insights.entityViews.week
  const totalCategorized = entityBreakdown.reduce((a, c) => a + c.count, 0)
  const gen = insights.generation
  const hasAny = categoryBreakdown.some((c) => c.current > 0) || insights.entityViews.week > 0 ||
    insights.timelines.opened.week > 0 || insights.timelines.eventsViewed.week > 0 || gen.started > 0

  const timelineActions = [
    { key: 'opened', label: 'Opened', icon: '📂', stat: insights.timelines.opened },
    { key: 'eventsViewed', label: 'Events viewed', icon: '🔄', stat: insights.timelines.eventsViewed },
    { key: 'generated', label: 'Generated', icon: '✨', stat: { week: gen.started, prior: gen.startedPrior, pct: gen.startedPrior > 0 ? Math.round(((gen.started - gen.startedPrior) / gen.startedPrior) * 1000) / 10 : 0 } as WindowStat },
    { key: 'deleted', label: 'Deleted', icon: '🗑️', stat: insights.timelines.deleted },
  ]
  const maxAction = Math.max(...timelineActions.map((a) => Math.max(a.stat.week, a.stat.prior)), 1)

  if (!hasAny) {
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-slate-100">Insights Activity</h3>
          <span className="elora-chip">7d window</span>
        </div>
        <div className="elora-card p-8 text-center">
          <p className="text-sm text-slate-500">Not enough data this week.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-100">How this user uses Insights</h3>
        <span className="elora-chip">last 7 days vs prior</span>
      </div>

      {/* Card 1+2 — Category interest & Entity analysis (side by side) */}
      <div className="elora-card p-5 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-0 lg:divide-x lg:divide-slate-800">
          {/* Category interest */}
          <div className="lg:pr-8">
            <CardHeader icon="🖱️" title="Category interest" subtitle="Which In-Your-Life categories get tapped" />
            <BigStat label="Category taps" stat={insights.categoryTaps} />
            <div className="mt-5 space-y-3">
              {categoryBreakdown.length === 0 ? (
                <p className="text-xs text-slate-500">No category taps recorded this period.</p>
              ) : (
                categoryBreakdown.map((c, i) => (
                  <div key={c.key}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-medium ${i === 0 ? 'text-violet-300' : 'text-slate-300'}`}>{c.label}</span>
                      <div className="flex items-baseline gap-2.5">
                        <span className="text-[0.65rem] text-slate-500 tabular-nums">
                          {c.involvement} engaged
                        </span>
                        <span className="flex items-baseline gap-1.5">
                          <span className="text-sm font-semibold text-white tabular-nums">{c.current}</span>
                          <span className="text-xs text-slate-500 tabular-nums">vs {c.prior}</span>
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="elora-bar-track flex-1 h-2">
                        <div
                          className="elora-bar-fill"
                          style={{
                            width: `${(c.current / maxCat) * 100}%`,
                            backgroundColor: i === 0 ? '#a78bfa' : CATEGORY_COLORS[Math.min(i, CATEGORY_COLORS.length - 1)],
                            opacity: i === 0 ? 1 : 0.55,
                            boxShadow: i === 0 ? '0 0 12px rgba(167,139,250,0.5)' : undefined,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
              {insights.categoryBreakdown.length > 0 && (
                <p className="text-[0.6rem] text-slate-500 pt-1">
                  {insights.categoryTaps.week.toLocaleString()} tap{insights.categoryTaps.week === 1 ? '' : 's'} across all categories this week
                </p>
              )}
            </div>
          </div>

          {/* Entity analysis */}
          <div className="lg:pl-8">
            <CardHeader icon="🔍" title="Entity analysis engagement" subtitle="Deep analyses viewed" />
            <BigStat label="See full analysis views" stat={insights.entityViews} />
            <div className="mt-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[0.65rem] uppercase tracking-widest text-slate-400 font-medium">Breakdown by category</span>
                {totalCategorized > 0 && (
                  <span className="text-[0.6rem] text-slate-500">{totalCategorized} categorized views</span>
                )}
              </div>
              {entityBreakdown.length === 0 ? (
                <p className="text-xs text-slate-500">No analysis views recorded this period.</p>
              ) : (
                <div className="flex h-3 rounded-full overflow-hidden bg-slate-800/60">
                  {entityBreakdown.map((c, i) => (
                    <div
                      key={c.key}
                      title={`${c.label}: ${c.count}`}
                      className="h-full"
                      style={{
                        width: `${(c.count / totalCategorized) * 100}%`,
                        backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
                      }}
                    />
                  ))}
                </div>
              )}
              {entityBreakdown.length > 0 && (
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                  {entityBreakdown.map((c, i) => (
                    <span key={c.key} className="flex items-center gap-1 text-[0.6rem] text-slate-500">
                      <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }} />
                      {c.label} · {c.count}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Card 3 — Timeline interactions */}
      <div className="elora-card p-5 sm:p-6">
        <CardHeader icon="🧭" title="Timeline interactions" subtitle="Engagement with the flagship insight feature" />
        <div className="grid grid-cols-3 gap-4 mb-5">
          <BigStat label="Opened" stat={insights.timelines.opened} />
          <BigStat label="Events viewed" stat={insights.timelines.eventsViewed} />
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[0.65rem] uppercase tracking-widest text-slate-400 font-medium">Generation success</span>
              <DeltaBadge pct={gen.startedPrior > 0 ? Math.round(((gen.successRate - gen.successPriorRate) / gen.successPriorRate) * 1000) / 10 : 0} current={gen.successRate} prior={gen.successPriorRate} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white tabular-nums">
                {gen.successRate.toLocaleString()}<span className="text-xl text-slate-400">%</span>
              </span>
              <span className="text-sm text-slate-500 tabular-nums">
                {gen.succeeded}/{gen.started}
              </span>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[0.65rem] uppercase tracking-widest text-slate-400 font-medium">Timeline actions this week</span>
            <span className="text-[0.6rem] text-slate-500">current vs prior</span>
          </div>
          <div className="space-y-3">
            {timelineActions.map((a) => (
              <div key={a.key}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-slate-300">{a.icon} {a.label}</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-sm font-semibold text-white tabular-nums">{a.stat.week}</span>
                    <span className="text-xs text-slate-500 tabular-nums">vs {a.stat.prior}</span>
                  </div>
                </div>
                <div className="flex gap-1 h-2">
                  <div className="elora-bar-track flex-1">
                    <div
                      className="elora-bar-fill"
                      style={{ width: `${(a.stat.week / maxAction) * 100}%`, backgroundColor: '#a78bfa' }}
                    />
                  </div>
                  <div className="elora-bar-track flex-1">
                    <div
                      className="elora-bar-fill"
                      style={{ width: `${(a.stat.prior / maxAction) * 100}%`, backgroundColor: '#64748b', opacity: 0.5 }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}