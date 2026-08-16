interface Entry {
  id: string
  insight_title: string
  insight_emoji: string
  insight_summary: string
  insight_bio: string
  content: string
  word_count: number
  created_at: string
}

export default function EntryModal({ entry, onClose }: { entry: Entry; onClose: () => void }) {
  const fmt = (d: string) => {
    if (!d) return ''
    return new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div
      className="elora-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8"
      onClick={onClose}
    >
      <div
        className="elora-modal-panel elora-card w-full max-w-2xl max-h-[88vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 p-6 border-b border-slate-800">
          <div className="flex items-start gap-3 min-w-0">
            <span className="text-3xl">{entry.insight_emoji || '📝'}</span>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-white leading-snug">
                {entry.insight_title || 'Untitled Entry'}
              </h2>
              <p className="text-xs text-slate-500 mt-1 font-medium">{fmt(entry.created_at)}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center justify-center"
            aria-label="Close"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="grow overflow-y-auto elora-scroll p-6 space-y-4">
          {entry.insight_summary && (
            <div className="rounded-xl bg-violet-500/10 border border-violet-500/20 p-4">
              <p className="text-[0.65rem] uppercase tracking-widest text-violet-400 font-medium mb-1.5">Insight</p>
              <p className="text-sm text-slate-200 leading-relaxed">{entry.insight_summary}</p>
            </div>
          )}
          <div>
            <p className="text-[0.65rem] uppercase tracking-widest text-slate-500 font-medium mb-1.5">Entry</p>
            <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{entry.content}</p>
          </div>
        </div>

        <div className="px-6 py-3 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">{entry.word_count.toLocaleString()} words</span>
          <button
            onClick={onClose}
            className="text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}