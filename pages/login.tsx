import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      if (!response.ok) throw new Error('Login failed')
      router.push('/elora')
    } catch {
      setMessage('Invalid credentials. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="login-root min-h-screen flex flex-col items-center justify-center p-4 sm:p-8">
      <div className={`login-card w-full max-w-md ${mounted ? 'login-card-enter' : 'opacity-0 translate-y-6'}`}>
        <div className="text-center mb-8">
          <div className="login-logo mx-auto mb-5">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="login-logo-icon">
              <rect x="3" y="11" width="18" height="11" rx="1" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              <circle cx="12" cy="16" r="1" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Dashboard Access</h1>
          <p className="text-slate-400 text-sm mt-2">Sign in to view app analytics</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="username" className="block text-[0.65rem] uppercase tracking-widest text-slate-500 font-medium mb-2">
              Username
            </label>
            <div className="input-wrapper">
              <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <input
                id="username"
                name="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                autoComplete="username"
                required
                className="login-input"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-[0.65rem] uppercase tracking-widest text-slate-500 font-medium mb-2">
              Password
            </label>
            <div className="input-wrapper">
              <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                autoComplete="current-password"
                required
                className="login-input"
              />
            </div>
          </div>

          {message && (
            <div className="login-error">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{message}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !username || !password}
            className="login-btn w-full"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2.5">
                <svg className="login-spinner" width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.2" />
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
                Authenticating...
              </span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>
      </div>

      <p className="mt-8 text-slate-600 text-xs font-mono">
        {new Date().getFullYear()} &middot; Admin Portal
      </p>

      <style jsx>{`
        .login-root {
          background: #020617;
          position: relative;
          overflow: hidden;
        }
        .login-root::before {
          content: "";
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          background:
            radial-gradient(700px 400px at 30% -8%, rgba(139, 92, 246, 0.16), transparent 55%),
            radial-gradient(600px 400px at 80% 0%, rgba(34, 211, 238, 0.12), transparent 50%),
            radial-gradient(500px 500px at 50% 110%, rgba(217, 70, 239, 0.08), transparent 60%);
        }
        .login-card {
          position: relative;
          z-index: 1;
          background: linear-gradient(160deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.8));
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(71, 85, 105, 0.35);
          border-radius: 1.5rem;
          padding: 2.5rem 2rem;
          box-shadow: 0 24px 60px -20px rgba(0, 0, 0, 0.8);
          transition: opacity 0.6s cubic-bezier(0.22, 1, 0.36, 1), transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .login-card-enter {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }
        .login-logo {
          width: 3rem;
          height: 3rem;
          border-radius: 0.9rem;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #8b5cf6, #a78bfa);
          box-shadow: 0 0 28px rgba(139, 92, 246, 0.5);
        }
        .login-logo-icon {
          color: #0f172a;
        }
        .input-wrapper {
          position: relative;
        }
        .input-icon {
          position: absolute;
          left: 0.9rem;
          top: 50%;
          transform: translateY(-50%);
          color: #64748b;
          pointer-events: none;
          z-index: 2;
        }
        .login-input {
          width: 100%;
          padding: 0.75rem 1rem 0.75rem 2.6rem;
          font-size: 0.875rem;
          font-family: inherit;
          color: #e2e8f0;
          background: rgba(30, 41, 59, 0.6);
          border: 1px solid rgba(71, 85, 105, 0.4);
          border-radius: 0.75rem;
          outline: none;
          transition: all 0.25s ease;
        }
        .login-input::placeholder {
          color: #475569;
        }
        .login-input:focus {
          border-color: rgba(139, 92, 246, 0.6);
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.12);
          background: rgba(30, 41, 59, 0.8);
        }
        .login-btn {
          padding: 0.85rem 1.5rem;
          font-size: 0.9rem;
          font-family: Poppins-Medium, sans-serif;
          font-weight: 600;
          color: #0f172a;
          background: linear-gradient(135deg, #a78bfa, #e879f9, #22d3ee);
          background-size: 200% 200%;
          animation: login-grd 5s ease infinite;
          border: none;
          border-radius: 0.85rem;
          cursor: pointer;
          transition: opacity 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
          box-shadow: 0 4px 20px rgba(139, 92, 246, 0.35);
        }
        .login-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(139, 92, 246, 0.5);
        }
        .login-btn:active:not(:disabled) {
          transform: translateY(0);
        }
        .login-btn:disabled {
          opacity: 0.45;
          cursor: not-allowed;
          transform: none;
        }
        @keyframes login-grd {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .login-spinner {
          animation: login-spin 0.9s linear infinite;
        }
        @keyframes login-spin {
          to { transform: rotate(360deg); }
        }
        .login-error {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.7rem 1rem;
          font-size: 0.8rem;
          color: #fca5a5;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.25);
          border-radius: 0.75rem;
          animation: login-shake 0.4s ease;
        }
        @keyframes login-shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
        @media (max-width: 640px) {
          .login-card {
            padding: 2rem 1.5rem;
            border-radius: 1.25rem;
          }
        }
      `}</style>
    </div>
  )
}