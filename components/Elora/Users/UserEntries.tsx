import { useState } from 'react'
import EntryModal from './EntryModal'

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

const fmt = (d: string) => {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

export default function UserEntries({ entries }: { entries: Entry[] }) {
  const [selected, setSelected] = useState<Entry | null>(null)
  const [visible, setVisible] = useState(20)

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-slate-100">Journal Entries</h3>
        <span className="elora-chip">{entries.length.toLocaleString()} entries</span>
      </div>

      <div className="elora-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[480px]">
            <thead>
              <tr className="text-[0.65rem] text-slate-500 uppercase tracking-wider border-b border-slate-800">
                <th className="py-4 pl-5 pr-3 font-medium w-12"></th>
                <th className="py-4 pr-3 font-medium">Title</th>
                <th className="py-4 pr-3 font-medium">Date</th>
                <th className="py-4 pr-5 font-medium text-right">Words</th>
              </tr>
            </thead>
            <tbody>
              {entries.slice(0, visible).map((e) => (
                <tr
                  key={e.id}
                  onClick={() => setSelected(e)}
                  className="elora-table-row border-t border-slate-800/40 cursor-pointer"
                >
                  <td className="py-3.5 pl-5 pr-3 text-xl">{e.insight_emoji || '📝'}</td>
                  <td className="py-3.5 pr-3">
                    <span className="text-sm text-slate-200 line-clamp-1">{e.insight_title || 'Untitled Entry'}</span>
                  </td>
                  <td className="py-3.5 pr-3 text-xs text-slate-400 font-mono">{fmt(e.created_at)}</td>
                  <td className="py-3.5 pr-5 text-right text-xs text-slate-400 tabular-nums">
                    {e.word_count.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {entries.length > visible && (
          <div className="p-3 border-t border-slate-800 flex justify-center">
            <button
              onClick={() => setVisible((v) => v + 20)}
              className="text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors"
            >
              Load more ({entries.length - visible} remaining)
            </button>
          </div>
        )}
      </div>

      {selected && <EntryModal entry={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}