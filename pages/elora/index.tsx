import { useEffect, useState } from 'react'
import Head from 'next/head'
import InsightBanner from '@/components/Elora/Dashboard/InsightBanner'
import ComparisonChart from '@/components/Elora/Dashboard/ComparisonChart'
import CategoryClicksCard from '@/components/Elora/Dashboard/CategoryClicksCard'
import EntityAnalysesCard from '@/components/Elora/Dashboard/EntityAnalysesCard'
import DemoFunnelCard from '@/components/Elora/Dashboard/DemoFunnelCard'
import DualMetricCard from '@/components/Elora/Dashboard/DualMetricCard'
import TimelineActivityCard from '@/components/Elora/Dashboard/TimelineActivityCard'
import LinkPromptCard from '@/components/Elora/Dashboard/LinkPromptCard'
import AppVersionCard from '@/components/Elora/Dashboard/AppVersionCard'
import DevicePlatformCard from '@/components/Elora/Dashboard/DevicePlatformCard'
import UserListModal from '@/components/Elora/Dashboard/UserListModal'
import TopUsersTable from '@/components/Elora/Dashboard/TopUsersTable'
import Spinner from '@/components/Utility/Spinner'

const AI_CACHE_KEY = 'elora-ai-insights-v1'
const AI_MAX_AGE = 24 * 60 * 60 * 1000

export default function EloraDashboard() {
  const [data, setData] = useState<any>(null)
  const [aiInsights, setAiInsights] = useState<any[]>([])
  const [userModal, setUserModal] = useState<null | 'voice' | 'activeChat' | 'activeJournal' | 'traditionalEntries' | 'guidedEntries'>(null)

  const refresh = () => {
    fetch('/api/elora-dashboard-read')
      .then((r) => r.json())
      .then(setData)
  }

  useEffect(() => { refresh() }, [])

  // AI insights: cache on device, refetch at most once per 24h.
  useEffect(() => {
    try {
      const cached = localStorage.getItem(AI_CACHE_KEY)
      if (cached) {
        const { ts, insights } = JSON.parse(cached)
        setAiInsights(insights || [])
        if (ts && Date.now() - ts < AI_MAX_AGE) return
      }
    } catch {}

    fetch('/api/elora-ai-summary')
      .then((r) => r.json())
      .then((d) => {
        const insights = d.insights || []
        setAiInsights(insights)
        try {
          localStorage.setItem(AI_CACHE_KEY, JSON.stringify({ ts: Date.now(), insights }))
        } catch {}
      })
      .catch(() => {})
  }, [])

  return (
    <>
      <Head><title>Elora Insights</title></Head>
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

          <InsightBanner insights={aiInsights} />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ComparisonChart
              title="Active Journal Users"
              icon="📝"
              color="#a78bfa"
              week={data.activeJournalUsers.week}
              month={data.activeJournalUsers.month}
              onOpen={() => setUserModal('activeJournal')}
            />
            <ComparisonChart
              title="Active Chat Users"
              icon="👥"
              color="#34d399"
              week={data.activeChatUsers.week}
              month={data.activeChatUsers.month}
              onOpen={() => setUserModal('activeChat')}
            />
            <ComparisonChart
              title="Voice Entry Users"
              icon="🎙️"
              color="#f59e0b"
              week={data.voiceEntryUsers.week}
              month={data.voiceEntryUsers.month}
              onOpen={() => setUserModal('voice')}
            />
            <ComparisonChart
              title="Traditional Entries"
              icon="📄"
              color="#f472b6"
              week={data.totalEntries.traditional.week}
              month={data.totalEntries.traditional.month}
              onOpen={() => setUserModal('traditionalEntries')}
            />
            <ComparisonChart
              title="Guided Entries"
              icon="🧭"
              color="#a78bfa"
              week={data.totalEntries.guided.week}
              month={data.totalEntries.guided.month}
              onOpen={() => setUserModal('guidedEntries')}
            />
            <ComparisonChart
              title="Chat Messages"
              icon="💬"
              color="#22d3ee"
              week={data.chatMessages.week}
              month={data.chatMessages.month}
            />
            <DualMetricCard
              title="Chat Limits Reached"
              subtitle="7d chat message limit"
              icon="🚫"
              color="#fb7185"
              total={data.exploreLimits.total}
              totalLabel="Total"
              uniqueUsers={data.exploreLimits.uniqueUsers}
              users={data.exploreLimits.users}
            />
            <DevicePlatformCard platform="iOS" data={data.devices.ios} color="#a78bfa" icon="🍎" />
            <DevicePlatformCard platform="Android" data={data.devices.android} color="#34d399" icon="🤖" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <DemoFunnelCard
              starters={data.demoFunnel.starters}
              completion={data.demoFunnel.completion}
              skipped={data.demoFunnel.skipped}
              steps={data.demoFunnel.steps}
              starterUsers={data.demoFunnel.starterUsers}
              color="#22d3ee"
            />
            <EntityAnalysesCard
              totalViews={data.entityAnalyses.totalViews}
              uniqueUsers={data.entityAnalyses.uniqueUsers}
              users={data.entityAnalyses.users}
              color="#fbbf24"
            />
            <CategoryClicksCard
              uniqueUsers={data.categoryClicks.uniqueUsers}
              categories={data.categoryClicks.categories}
              users={data.categoryClicks.users}
              color="#e879f9"
            />
            <TimelineActivityCard
              created={data.timelineActivity.created}
              viewed={data.timelineActivity.viewed}
              color="#a78bfa"
            />
            <LinkPromptCard data={data.linkPrompt} />
            <AppVersionCard distribution={data.appVersionDist} />
          </div>

          <TopUsersTable users={data.topUsers} onUpdate={refresh} />
        </div>
      )}

      {userModal === 'voice' && (
        <UserListModal
          users={data.voiceEntryUsers.users}
          title="Voice Entry Users"
          subtitle={`${data.voiceEntryUsers.week.count.toLocaleString()} unique users · past 7 days`}
          onClose={() => setUserModal(null)}
        />
      )}
      {userModal === 'activeChat' && (
        <UserListModal
          users={data.activeChatUsers.users}
          title="Active Chat Users"
          metricLabel="Messages"
          subtitle={`${data.activeChatUsers.week.count.toLocaleString()} unique users · past 7 days`}
          onClose={() => setUserModal(null)}
        />
      )}
      {userModal === 'activeJournal' && (
        <UserListModal
          users={data.activeJournalUsers.users}
          title="Active Journal Users"
          subtitle={`${data.activeJournalUsers.week.count.toLocaleString()} unique users · past 7 days`}
          onClose={() => setUserModal(null)}
        />
      )}
      {userModal === 'traditionalEntries' && (
        <UserListModal
          users={data.totalEntries.traditional.users}
          title="Traditional Entries"
          metricLabel="Entries"
          subtitle={`${data.totalEntries.traditional.users.length.toLocaleString()} unique users · past 7 days`}
          onClose={() => setUserModal(null)}
        />
      )}
      {userModal === 'guidedEntries' && (
        <UserListModal
          users={data.totalEntries.guided.users}
          title="Guided Entries"
          metricLabel="Entries"
          subtitle={`${data.totalEntries.guided.users.length.toLocaleString()} unique users · past 7 days`}
          onClose={() => setUserModal(null)}
        />
      )}
      </div>
    </>
  )
}