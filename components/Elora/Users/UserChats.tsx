import { useState } from 'react'
import ChatModal from './ChatModal'

interface Chat {
  id: string
  title: string
  deleted: boolean
  created_at: string
  last_message_at: string
  message_count: number
}

const fmt = (d: string) => {
  if (!d) return ''
  const date = new Date(d)
  const today = new Date()
  const sameDay = date.toDateString() === today.toDateString()
  if (sameDay) return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

export default function UserChats({ chats }: { chats: Chat[] }) {
  const [selected, setSelected] = useState<Chat | null>(null)
  const [visible, setVisible] = useState(20)

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-slate-100">Chats</h3>
        <span className="elora-chip">{chats.length.toLocaleString()} chats</span>
      </div>

      {chats.length === 0 ? (
        <div className="elora-card p-8 text-center">
          <p className="text-sm text-slate-500">No chats found for this user.</p>
        </div>
      ) : (
        <div className="elora-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[520px]">
              <thead>
                <tr className="text-[0.65rem] text-slate-500 uppercase tracking-wider border-b border-slate-800">
                  <th className="py-4 pl-5 pr-3 font-medium" />
                  <th className="py-4 pr-3 font-medium">Title</th>
                  <th className="py-4 pr-3 font-medium">Last message</th>
                  <th className="py-4 pr-5 font-medium text-right">Messages</th>
                </tr>
              </thead>
              <tbody>
                {chats.slice(0, visible).map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => setSelected(c)}
                    className="elora-table-row border-t border-slate-800/40 cursor-pointer"
                  >
                    <td className="py-3.5 pl-5 pr-3 text-lg">{c.deleted ? '🗑️' : '💬'}</td>
                    <td className="py-3.5 pr-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`text-sm line-clamp-1 ${c.deleted ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                          {c.title}
                        </span>
                        {c.deleted && (
                          <span className="shrink-0 text-[0.55rem] font-medium uppercase tracking-widest text-red-400 bg-red-500/10 border border-red-500/30 rounded-full px-1.5 py-0.5">
                            Deleted
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 pr-3 text-xs text-slate-400 font-mono">
                      {fmt(c.last_message_at || c.created_at)}
                    </td>
                    <td className="py-3.5 pr-5 text-right text-xs text-slate-400 tabular-nums">
                      {c.message_count.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {chats.length > visible && (
            <div className="p-3 border-t border-slate-800 flex justify-center">
              <button
                onClick={() => setVisible((v) => v + 20)}
                className="text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors"
              >
                Load more ({chats.length - visible} remaining)
              </button>
            </div>
          )}
        </div>
      )}

      {selected && (
        <ChatModal chat={{ id: selected.id, title: selected.title, created_at: selected.created_at }} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}