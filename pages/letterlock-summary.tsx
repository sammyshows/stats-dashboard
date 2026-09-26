import { useEffect, useState } from 'react'
import Head from 'next/head'
import LetterlockMetricCard from '@/components/Letterlock/Summary/LetterlockMetricCard'
import LetterlockUsersTable from '@/components/Letterlock/Summary/LetterlockUsersTable'
import Spinner from '@/components/Utility/Spinner'

export default function LetterlockSummary() {
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    fetch('/api/letterlock-summary-read')
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData({}))
  }, [])

  return (
    <>
      <Head><title>Letterlock Insights</title></Head>
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-10">
      {!data ? (
        <div className="h-[60vh]"><Spinner /></div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="elora-fade-up">
            <h1 className="text-3xl sm:text-4xl font-bold text-white">
              <span className="elora-gradient-text">Letterlock</span> Summary
            </h1>
            <p className="text-slate-400 text-sm mt-1">User activity and engagement across the platform</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <LetterlockMetricCard
              title="Active Users"
              icon="👥"
              color="#a78bfa"
              week={data.activeUsers.week}
              month={data.activeUsers.month}
            />
            <LetterlockMetricCard
              title="New Users"
              icon="🆕"
              color="#22d3ee"
              week={data.newUsers.week}
              month={data.newUsers.month}
            />
            <LetterlockMetricCard
              title="Ads Watched"
              icon="📺"
              color="#e879f9"
              week={data.adsWatched.week}
              month={data.adsWatched.month}
            />
            <LetterlockMetricCard
              title="Levels Accomplished"
              icon="🏆"
              color="#34d399"
              week={data.levelsAccomplished.week}
              month={data.levelsAccomplished.month}
            />
          </div>

          <div className="elora-fade-up">
            <LetterlockUsersTable />
          </div>
        </div>
      )}
      </div>
    </>
  )
}