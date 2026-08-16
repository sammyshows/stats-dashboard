import { useEffect, useState } from 'react'
import InsightBanner from '@/components/Elora/Dashboard/InsightBanner'
import ComparisonChart from '@/components/Elora/Dashboard/ComparisonChart'
import TopUsersTable from '@/components/Elora/Dashboard/TopUsersTable'
import Spinner from '@/components/Utility/Spinner'

export default function EloraDashboard() {
  const [data, setData] = useState<any>(null)
  const [aiInsights, setAiInsights] = useState<any[]>([])
  const [entryInsights, setEntryInsights] = useState<any[]>([])

  const refresh = () => {
    fetch('/api/elora-dashboard-read')
      .then((r) => r.json())
      .then((d) => { setData(d); setEntryInsights(d.insights || []) })
  }

  useEffect(() => { refresh() }, [])

  useEffect(() => {
    fetch('/api/elora-ai-summary')
      .then((r) => r.json())
      .then((d) => setAiInsights(d.insights || []))
      .catch(() => {})
  }, [])

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-10">
      {!data ? (
        <div className="h-[60vh]"><Spinner /></div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="elora-fade-up">
            <h1 className="text-3xl sm:text-4xl font-bold text-white">
              <span className="elora-gradient-text">Elora</span> Overview
            </h1>
            <p className="text-slate-400 text-sm mt-1">User activity and engagement across the platform</p>
          </div>

          <InsightBanner
            insights={
              aiInsights.length ? aiInsights : entryInsights.map((e: any) => ({
                title: e.insight_title,
                emoji: e.insight_emoji,
                body: e.insight_summary,
              }))
            }
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ComparisonChart
              title="Active Journal Users"
              icon="📝"
              color="#a78bfa"
              week={data.activeJournalUsers.week}
              month={data.activeJournalUsers.month}
            />
            <ComparisonChart
              title="Chat Messages"
              icon="💬"
              color="#22d3ee"
              week={data.chatMessages.week}
              month={data.chatMessages.month}
            />
            <ComparisonChart
              title="Active Chat Users"
              icon="👥"
              color="#34d399"
              week={data.activeChatUsers.week}
              month={data.activeChatUsers.month}
            />
          </div>

          <TopUsersTable users={data.topUsers} onUpdate={refresh} />
        </div>
      )}
    </div>
  )
}