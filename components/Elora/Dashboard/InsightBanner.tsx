import { useEffect, useState } from 'react'

interface Insight { title: string; emoji: string; body: string }

export default function InsightBanner({ insights }: { insights: Insight[] }) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused || insights.length <= 1) return
    const t = setInterval(() => setIndex((i) => (i + 1) % insights.length), 6000)
    return () => clearInterval(t)
  }, [paused, insights.length])

  if (!insights.length) return null

  const current = insights[index]

  return (
    <div
      className="elora-card elora-insight-glow elora-fade-up p-6 sm:p-8 w-full"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="flex items-center gap-2.5 mb-4">
        <span className="elora-pulse-dot w-2 h-2 rounded-full bg-violet-400" />
        <span className="elora-eyebrow">AI Weekly Analysis</span>
        <span className="ml-auto text-[0.65rem] text-slate-500 font-medium">
          {index + 1} / {insights.length}
        </span>
      </div>

      <div className="flex items-start gap-4">
        <div className="text-4xl sm:text-5xl shrink-0 mt-1">{current.emoji || '📊'}</div>
        <div className="min-w-0">
          <h2 className="elora-gradient-text text-xl sm:text-2xl font-semibold leading-snug mb-2">
            {current.title}
          </h2>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            {current.body}
          </p>
        </div>
      </div>

      {insights.length > 1 && (
        <div className="flex items-center gap-1.5 mt-6">
          {insights.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === index ? 'w-6 bg-violet-400' : 'w-1.5 bg-slate-600 hover:bg-slate-500'
              }`}
              aria-label={`Insight ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}