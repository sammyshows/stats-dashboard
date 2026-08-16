import { useEffect, useState } from 'react'
import Link from 'next/link'
import UsersTableHead, { UsersTableRow } from '@/components/Elora/Users/UsersTable'
import Pagination from '@/components/Elora/Pagination'
import Spinner from '@/components/Utility/Spinner'

export default function EloraUsers() {
  const [data, setData] = useState<any>(null)
  const [page, setPage] = useState(1)

  useEffect(() => {
    setData(null)
    fetch(`/api/elora-users-read?page=${page}`)
      .then((r) => r.json())
      .then(setData)
  }, [page])

  const refresh = () => { setData(null); setTimeout(() => {
    fetch(`/api/elora-users-read?page=${page}`).then(r => r.json()).then(setData)
  }, 200) }

  const maxEntries = data?.users?.length ? Math.max(...data.users.map((u: any) => u.total_entry_count), 1) : 1

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-10">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white">Users</h1>
          <p className="text-slate-400 text-sm mt-1">
            {data ? `Top ${data.total.toLocaleString()} users ranked by latest activity` : 'Loading users…'}
          </p>
        </div>
        <LinkHome />
      </div>

      <div className="elora-card p-4 sm:p-6">
        {!data ? (
          <div className="h-[50vh]"><Spinner /></div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[540px]">
                <thead><UsersTableHead /></thead>
                <tbody>
                  {data.users.map((u: any, i: number) => (
                    <UsersTableRow key={u.user_id} user={u} index={(page - 1) * data.limit + i} maxEntries={maxEntries} onUpdate={refresh} />
                  ))}
                </tbody>
              </table>
            </div>
            <div className="pt-5 border-t border-slate-800 mt-2">
              <Pagination page={data.page} totalPages={data.totalPages} onPage={setPage} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function LinkHome() {
  return (
    <Link href="/elora" className="self-start sm:self-auto flex items-center gap-1.5 text-[0.7rem] text-violet-400 hover:text-violet-300 font-medium transition-colors">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
      <span>Back to dashboard</span>
    </Link>
  )
}