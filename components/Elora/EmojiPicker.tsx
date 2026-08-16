import { useState } from 'react'

const EMOJIS = [
  '😀','😂','🥹','😊','😎','🤩','😤','😢','😡','🥶','🤯','😴',
  '👍','👎','👏','🙌','💪','🤝','🤞','✌️','🫶','👋','🤙','🙏',
  '❤️','🧡','💛','💚','💙','💜','🖤','🤍','💔','🔥','⭐','✨',
  '🎉','🎊','🎂','🏆','🥇','💯','✅','❌','⚠️','🚀','💡','📌',
  '📍','🏠','🌍','🌈','☀️','🌙','⚡','💧','🍀','🌸','🌺','🌻',
  '🐶','🐱','🦊','🐼','🐨','🐸','🦄','🐙','🦋','🐝','🐳','🦖',
  '🍕','🍔','🌮','🍩','☕','🍺','🍷','🍾','🥑','🍣','🧁','🍿',
  '🎵','🎸','🎮','📚','✍️','💻','📱','🎯','🧩','🎲','♟️','🧠',
  '💼','💰','📊','📈','🎓','🔬','⚖️','🛡️','🔑','🗝️','💎','🪄',
  '🌱','🪴','🏋️','🧘','🚴','🏄','⛰️','🏕️','✈️','🚗','⛵','🎢',
  '🧑‍💻','👨‍👩‍👧‍👦','💍','🤰','👶','🧒','👴','🧓','🦸','🧙','🧜','🧛',
]

export default function EmojiPicker({ current, onSelect }: {
  current: string | null
  onSelect: (emoji: string) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className="w-8 h-8 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700/80 hover:border-violet-500/50 flex items-center justify-center text-base transition-all duration-200"
        title={current ? 'Change emoji' : 'Set emoji'}
      >
        {current || '＋'}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-2 z-50 p-3 rounded-xl border border-slate-700 bg-slate-900 shadow-2xl shadow-black/60"
            style={{ width: '288px' }}>
            <div className="grid grid-cols-12 gap-0.5">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => { onSelect(e); setOpen(false) }}
                  className={`w-5 h-5 flex items-center justify-center text-sm rounded hover:bg-slate-700 transition-colors ${
                    current === e ? 'bg-violet-500/30 ring-1 ring-violet-500/50' : ''
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}