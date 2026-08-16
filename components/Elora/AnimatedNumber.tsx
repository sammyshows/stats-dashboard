import { useEffect, useRef, useState } from 'react'

export default function AnimatedNumber({ value, duration = 1200, fontSize = 'inherit' }: {
  value: number
  duration?: number
  fontSize?: string
}) {
  const [display, setDisplay] = useState(0)
  const rafRef = useRef<number>()

  useEffect(() => {
    if (value === undefined || value === null) return
    const start = performance.now()
    const tick = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(value * eased))
      if (progress < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [value, duration])

  return <span>{display.toLocaleString()}</span>
}