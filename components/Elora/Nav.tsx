import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

export default function Nav() {
  const routePath = useRouter().pathname
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', h, { passive: true })
    return () => window.removeEventListener('scroll', h)
  }, [])

  // Cross-link to the opposite insights dashboard.
  const onLetterlock = routePath.startsWith('/letterlock')
  const href = onLetterlock ? '/elora' : '/letterlock-summary'
  const label = onLetterlock ? 'Elora Insights' : 'Letterlock Insights'

  return (
    <nav className={`sticky top-0 z-40 transition-all duration-300 ${
      scrolled ? 'bg-slate-950/85 backdrop-blur-xl border-b border-slate-800/70' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-8 py-3">
        <Link href={href} className="flex items-center gap-3 group">
          <div className="elora-logo">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18h6" />
              <path d="M10 22h4" />
              <path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.2 1 2h6c0-.8.4-1.5 1-2A7 7 0 0 0 12 2z" />
            </svg>
          </div>
          <span className="elora-brand-gradient text-lg font-semibold hidden sm:inline">Insights</span>
        </Link>
        <div className="flex items-center gap-1.5">
          <Link
            href={href}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg text-violet-400 hover:text-violet-300 hover:bg-slate-800/60 transition-colors duration-200"
          >
            {label}
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </Link>
        </div>
      </div>
    </nav>
  )
}