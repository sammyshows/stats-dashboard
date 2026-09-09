import Link from 'next/link'
import { useEffect } from 'react'
import { createPortal as reactDomCreatePortal } from 'react-dom'

// Typed loosely to stay immune to @types/react / @types/react-dom version skew
// (a duplicated @types/react copy on some installs makes the portal children
// fall outside the library's ReactNode identity, failing CI type-checks).
const createPortal: (child: any, container: Element | DocumentFragment) => any = reactDomCreatePortal

export interface UserRef { user_id: string; emoji: string | null }

const shortId = (id: string) => '...' + id.slice(-12)

export default function UserListModal({ users, title, subtitle, metricLabel, onClose }: {
  users: UserRef[]
  title: string
  subtitle?: string
  metricLabel?: string
  onClose: () => void
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return createPortal(
    <div
      className="elora-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8"
      onClick={onClose}
    >
      <div
        className="elora-modal-panel elora-card w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 p-6 border-b border-slate-800">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-white">{title}</h2>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              {subtitle ?? `${users.length.toLocaleString()} unique user${users.length === 1 ? '' : 's'} · past 7 days`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center justify-center"
            aria-label="Close"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>

        {users.length === 0 ? (
          <div className="p-6 text-sm text-slate-500">No users recorded in this period.</div>
        ) : (
          <div className="grow overflow-y-auto elora-scroll p-4">
            {metricLabel && (
              <div className="flex items-center justify-between px-3 py-1.5 text-[0.6rem] uppercase tracking-widest text-slate-500 font-medium">
                <span>User</span>
                <span>{metricLabel}</span>
              </div>
            )}
            <div className="flex flex-col">
              {users.map((u) => (
                <Link
                  key={u.user_id}
                  href={`/elora/users/${u.user_id}`}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-violet-500/10 transition-colors group"
                >
                  <span className="w-8 h-8 rounded-lg bg-slate-800/80 border border-slate-700 flex items-center justify-center text-base shrink-0">
                    {u.emoji ?? '👤'}
                  </span>
                  <span className="text-xs text-violet-400 group-hover:text-violet-300 font-mono font-medium truncate">
                    {shortId(u.user_id)}
                  </span>
                  <span className="ml-auto text-sm font-semibold text-slate-200 tabular-nums shrink-0">
                    {metricLabel ? (u as any).metric?.toLocaleString?.() ?? '' : ''}
                  </span>
                  <svg className="shrink-0 text-slate-600 group-hover:text-slate-400 transition-colors" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 3h6v6" /><path d="M10 14 21 3" /><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  </svg>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="px-6 py-3 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">{users.length.toLocaleString()} users</span>
          <button
            onClick={onClose}
            className="text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>, document.body
  )
}