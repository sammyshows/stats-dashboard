export default function Pagination({ page, totalPages, onPage }: {
  page: number
  totalPages: number
  onPage: (p: number) => void
}) {
  const pages: number[] = []
  const start = Math.max(1, page - 2)
  const end = Math.min(totalPages, page + 2)
  for (let i = start; i <= end; i++) pages.push(i)

  const btn = 'flex items-center justify-center w-8 h-8 rounded-lg text-xs font-medium transition-colors duration-200'

  return (
    <div className="flex items-center justify-center gap-1.5">
      <button
        onClick={() => onPage(page - 1)}
        disabled={page <= 1}
        className={`${btn} text-slate-300 ${page <= 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-800'}`}
        aria-label="Previous page"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
      </button>

      {start > 1 && <span className="text-slate-600 text-xs px-1">…</span>}
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onPage(p)}
          className={`${btn} ${p === page ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40' : 'text-slate-400 hover:bg-slate-800'}`}
        >
          {p}
        </button>
      ))}
      {end < totalPages && <span className="text-slate-600 text-xs px-1">…</span>}

      <button
        onClick={() => onPage(page + 1)}
        disabled={page >= totalPages}
        className={`${btn} text-slate-300 ${page >= totalPages ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-800'}`}
        aria-label="Next page"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
      </button>
    </div>
  )
}