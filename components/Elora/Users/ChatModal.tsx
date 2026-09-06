import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import MarkdownView from '@/components/Utility/MarkdownView'

interface ChatMessage {
  id: string
  role: string
  content: string
  created_at: string
  deleted: boolean
  hidden: boolean
  compacted: boolean
}

const fmtTime = (d: string) => {
  if (!d) return ''
  return new Date(d).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

function MessageBubble({ msg, firstOfGroup }: { msg: ChatMessage; firstOfGroup: boolean }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} ${firstOfGroup ? 'mt-5' : 'mt-2'}`}>
      <div className={`flex ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end gap-2 max-w-[80%]`}>
        <div
          className={`flex items-center justify-center w-7 h-7 rounded-full shrink-0 text-xs ${
            isUser ? 'bg-violet-500/20 border border-violet-500/30' : 'bg-slate-800 border border-slate-700'
          }`}
        >
          {isUser ? '🧑' : '✨'}
        </div>
        <div className="flex flex-col gap-1">
          {msg.deleted || msg.hidden ? (
            <div
              className={`rounded-2xl px-4 py-2.5 border border-dashed ${
                isUser
                  ? 'rounded-br-sm bg-slate-800/40 border-slate-700'
                  : 'rounded-bl-sm bg-slate-800/40 border-slate-700'
              }`}
            >
              <p className="text-xs italic text-slate-500">
                {msg.compacted && msg.hidden ? 'Content compacted (long conversation)' : 'Content unavailable'}
              </p>
            </div>
          ) : (
            <div
              className={`rounded-2xl px-4 py-2.5 shadow-lg ${
                isUser
                  ? 'rounded-br-sm bg-gradient-to-br from-violet-500/90 to-violet-600/90 text-white'
                  : 'rounded-bl-sm bg-slate-800 border border-slate-700 text-slate-200'
              }`}
            >
              {isUser ? (
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              ) : (
                <MarkdownView content={msg.content} />
              )}
            </div>
          )}
          <span className={`text-[0.58rem] text-slate-500 font-mono ${isUser ? 'text-right' : 'text-left'}`}>
            {fmtTime(msg.created_at)}
          </span>
        </div>
      </div>
    </div>
  )
}

interface ChatInfo { id: string; title: string; created_at: string }

export default function ChatModal({ chat, onClose }: { chat: ChatInfo; onClose: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[] | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let alive = true
    fetch('/api/elora-chat-read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId: chat.id }),
    })
      .then((r) => r.json())
      .then((d) => { if (alive) setMessages(d.messages || []) })
      .catch(() => { if (alive) setError(true) })
    return () => { alive = false }
  }, [chat.id])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return createPortal(
    <div className="elora-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8" onClick={onClose}>
      <div
        className="elora-modal-panel elora-card w-full max-w-2xl max-h-[88vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 p-5 border-b border-slate-800">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <h2 className="text-base font-semibold text-white truncate">{chat.title}</h2>
              <span className="shrink-0 text-[0.6rem] text-slate-500 font-mono">{chat.id.slice(-8)}</span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">Conversation · {fmtTime(chat.created_at)}</p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center justify-center"
            aria-label="Close"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="grow overflow-y-auto elora-scroll p-5 sm:p-6 bg-slate-950/30">
          {error ? (
            <p className="text-sm text-slate-500 text-center py-10">Failed to load messages.</p>
          ) : !messages ? (
            <div className="flex items-center justify-center py-10">
              <span className="w-5 h-5 border-2 border-violet-400/40 border-t-violet-400 rounded-full animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-10">No messages in this chat.</p>
          ) : (
            <div>
              {messages.map((m, i) => (
                <MessageBubble key={m.id} msg={m} firstOfGroup={i === 0 || (messages[i - 1]?.role !== m.role)} />
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-3 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">
            {messages ? `${messages.length.toLocaleString()} messages` : '…'}
          </span>
          <button onClick={onClose} className="text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>, document.body
  )
}