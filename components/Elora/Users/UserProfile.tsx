import { useState } from 'react'

const SENTIMENT_CLASS: Record<string, string> = {
  Supported: 'elora-sent-supported',
  Conflicted: 'elora-sent-conflicted',
  Affirmed: 'elora-sent-affirmed',
  Deepened: 'elora-sent-deepened',
  Realized: 'elora-sent-realized',
}

function sentimentClass(text: string): string {
  const prefix = text.split(':')[0]
  return SENTIMENT_CLASS[prefix] || ''
}

function formatCategoryName(key: string): string {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()).replace(/And /g, '& ')
}

function renderEntityValue(value: any, entityName: string, depth: number): React.ReactNode {
  if (Array.isArray(value)) {
    return (
      <ul className="space-y-1 mt-1.5">
        {(value as string[]).map((note, i) => (
          <li key={i} className={`flex items-start gap-2 text-xs leading-relaxed text-slate-400 ${sentimentClass(note)}`}>
            <span className="text-slate-600 mt-0.5 shrink-0">•</span>
            <span>{note}</span>
          </li>
        ))}
      </ul>
    )
  }

  if (value && typeof value === 'object') {
    const hasNotes = Array.isArray(value.notes) && value.notes.length > 0
    const hasMeta = value.relation || value.location

    return (
      <div className="mt-1.5 space-y-1.5">
        {hasMeta && (
          <div className="flex flex-wrap gap-1.5">
            {value.relation && <span className="elora-chip elora-chip-relation">{value.relation}</span>}
            {value.location && <span className="elora-chip elora-chip-location">{value.location}</span>}
          </div>
        )}
        {hasNotes && (
          <ul className="space-y-1">
            {(value.notes as string[]).map((note, i) => (
              <li key={i} className="flex items-start gap-2 text-xs leading-relaxed text-slate-400">
                <span className="text-slate-600 mt-0.5 shrink-0">•</span>
                <span>{note}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  }

  return <span className="text-xs text-slate-500">{String(value)}</span>
}

function SummaryCard({ label, count, icon, onClick }: {
  label: string
  count: number
  icon: string
  onClick?: () => void
}) {
  return (
    <div
      className={`elora-card p-4 text-center ${onClick ? 'cursor-pointer group' : ''}`}
      onClick={onClick}
    >
      <span className="text-2xl">{icon}</span>
      <div className="mt-2">
        <span className="text-2xl font-bold text-white tabular-nums">{count}</span>
      </div>
      <p className="text-[0.65rem] text-slate-500 uppercase tracking-wider mt-1">{label}</p>
    </div>
  )
}

function AccordionSection({ categoryKey, categoryValue, defaultOpen }: {
  categoryKey: string
  categoryValue: any
  defaultOpen: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const entities = Object.entries(categoryValue)
  const name = formatCategoryName(categoryKey)

  return (
    <div className="border border-slate-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-slate-800/40 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-slate-200">{name}</span>
          <span className="elora-chip">{entities.length}</span>
        </div>
        <svg
          className={`elora-chevron ${open ? 'elora-chevron-open' : ''} w-4 h-4 text-slate-400`}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      <div
        className="elora-accordion-body"
        style={{ maxHeight: open ? '80vh' : '0px', opacity: open ? 1 : 0 }}
      >
        <div className="px-5 pb-4 space-y-3 overflow-y-auto max-h-[70vh] elora-scroll">
          {entities.map(([entityKey, entityValue]: [string, any]) => (
            <div key={entityKey} className="rounded-lg bg-slate-800/40 border border-slate-700/40 p-3.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-200">{entityKey}</span>
                {Array.isArray(entityValue) && (
                  <span className="text-[0.6rem] text-slate-500 font-mono">{entityValue.length}</span>
                )}
              </div>
              {renderEntityValue(entityValue, entityKey, 0)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const CATEGORY_ICONS: Record<string, string> = {
  events: '📅',
  people: '👤',
  topics: '💬',
  values: '🧭',
  relationship: '💞',
  claimsAndStances: '⚡',
  emotionsAndEnergy: '🎭',
  commitmentsAndProgress: '🎯',
  milestonesAndHighlights: '🏆',
  preferencesAndConstraints: '⚙️',
}

export default function UserProfile({ profile }: { profile: Record<string, any> }) {
  const [showFull, setShowFull] = useState(false)
  const cats = Object.keys(profile)

  const counts = cats.map((k) => ({
    key: k,
    name: formatCategoryName(k),
    count: Object.keys(profile[k] || {}).length,
    icon: CATEGORY_ICONS[k] || '📋',
  }))

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-slate-100">Profile Insights</h3>
        <button
          onClick={() => setShowFull(!showFull)}
          className="flex items-center gap-1.5 text-[0.7rem] text-violet-400 hover:text-violet-300 font-medium transition-colors"
        >
          <span>{showFull ? 'Show summary' : 'Full profile'}</span>
          <svg
            className={`elora-chevron ${showFull ? 'elora-chevron-open' : ''} w-3.5 h-3.5`}
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
      </div>

      {!showFull ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {counts.map((c) => (
            <SummaryCard key={c.key} label={c.name} count={c.count} icon={c.icon} onClick={() => setShowFull(true)} />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {cats.map((catKey) => {
            const catValue = profile[catKey]
            if (!catValue || typeof catValue !== 'object' || Object.keys(catValue).length === 0) return null
            return (
              <AccordionSection
                key={catKey}
                categoryKey={catKey}
                categoryValue={catValue}
                defaultOpen={Object.keys(catValue).length < 6}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}