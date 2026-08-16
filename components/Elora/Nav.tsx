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

  const linkClass = (segment: string) =>
    `text-xs font-medium px-3 py-1.5 rounded-lg transition-colors duration-200 ${
      routePath.split('/')[1] === 'elora' && (segment === '' || routePath.split('/')[2] === segment)
        ? 'text-white bg-violet-500/20 border border-violet-500/30'
        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
    }`

  return (
    <nav className={`sticky top-0 z-40 transition-all duration-300 ${
      scrolled ? 'bg-slate-950/85 backdrop-blur-xl border-b border-slate-800/70' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-8 py-3">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="elora-logo">E</div>
          <span className="elora-brand-gradient text-lg font-semibold hidden sm:inline">Elora</span>
          <span className="text-slate-400 text-sm font-medium hidden lg:inline">Insights</span>
        </Link>
        <div className="flex items-center gap-1.5">
          <Link href="/elora" className={linkClass('')}>Dashboard</Link>
          <Link href="/elora/users" className={linkClass('users')}>Users</Link>
        </div>
      </div>
    </nav>
  )
}