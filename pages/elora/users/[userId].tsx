import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Spinner from '@/components/Utility/Spinner'
import UserHeader from '@/components/Elora/Users/UserHeader'
import UserEntries from '@/components/Elora/Users/UserEntries'
import UserProfile from '@/components/Elora/Users/UserProfile'

export default function EloraUser() {
  const router = useRouter()
  const userId = router.query.userId as string
  const [data, setData] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'entries' | 'profile'>('entries')

  useEffect(() => {
    if (!userId) return
    fetch('/api/elora-user-read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
      .then((r) => r.json())
      .then(setData)
  }, [userId])

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-10">
      <Link
        href="/elora/users"
        className="inline-flex items-center gap-1.5 text-[0.7rem] text-violet-400 hover:text-violet-300 font-medium transition-colors mb-5"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="m15 18-6-6 6-6" /></svg>
        <span>Back to users</span>
      </Link>

      {!data ? (
        <div className="h-[60vh]"><Spinner /></div>
      ) : (
        <div className="flex flex-col gap-6">
          <UserHeader user={data.user} />

          <div className="flex gap-2 border-b border-slate-800">
            <button
              onClick={() => setActiveTab('entries')}
              className={`py-2.5 px-5 text-sm font-medium rounded-t-xl transition-colors ${
                activeTab === 'entries'
                  ? 'text-white bg-slate-800/60 border border-slate-700 border-b-transparent -mb-px'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Journal Entries
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-2.5 px-5 text-sm font-medium rounded-t-xl transition-colors ${
                activeTab === 'profile'
                  ? 'text-white bg-slate-800/60 border border-slate-700 border-b-transparent -mb-px'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Profile
            </button>
          </div>

          <div className="min-h-[40vh]">
            {activeTab === 'entries' && <UserEntries entries={data.entries} />}
            {activeTab === 'profile' && (
              Object.keys(data.user.profile || {}).length > 0 ? (
                <UserProfile profile={data.user.profile} />
              ) : (
                <p className="text-slate-500 text-sm py-12 text-center">No profile data available for this user.</p>
              )
            )}
          </div>
        </div>
      )}
    </div>
  )
}