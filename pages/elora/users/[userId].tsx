import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Spinner from '@/components/Utility/Spinner'
import UserHeader from '@/components/Elora/Users/UserHeader'
import UserEntries from '@/components/Elora/Users/UserEntries'
import UserProfile from '@/components/Elora/Users/UserProfile'
import UserChats from '@/components/Elora/Users/UserChats'
import UserInsights from '@/components/Elora/Users/UserInsights'

export default function EloraUser() {
  const router = useRouter()
  const userId = router.query.userId as string
  const [data, setData] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'entries' | 'profile' | 'chats' | 'insights'>('entries')

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
            <button
              onClick={() => setActiveTab('chats')}
              className={`py-2.5 px-5 text-sm font-medium rounded-t-xl transition-colors ${
                activeTab === 'chats'
                  ? 'text-white bg-slate-800/60 border border-slate-700 border-b-transparent -mb-px'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Chats
            </button>
            <button
              onClick={() => setActiveTab('insights')}
              className={`py-2.5 px-5 text-sm font-medium rounded-t-xl transition-colors ${
                activeTab === 'insights'
                  ? 'text-white bg-slate-800/60 border border-slate-700 border-b-transparent -mb-px'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Insights
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
            {activeTab === 'chats' && <UserChats chats={data.chats || []} />}
            {activeTab === 'insights' && <UserInsights insights={data.insights} />}
          </div>
        </div>
      )}
    </div>
  )
}