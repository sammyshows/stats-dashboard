import Head from 'next/head'
import Link from 'next/link'

export default function Home() {
  return (
    <>
      <Head>
        <title>Apps Dashboard</title>
        <meta name="description" content="Welcome to the Game Stats Dashboard. Select a game to view its statistics." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex flex-col items-center justify-center min-h-screen py-2 bg-slate-800">
        <h1 className="text-5xl pb-28 font-bold text-slate-100" style={{ fontFamily: 'Poppins-Light' }}>Apps Dashboard</h1>
        <div className="flex gap-10 flex-wrap justify-center">
          <div className="flex flex-col justify-center items-center w-48 h-60 border-2 border-emerald-200 rounded-lg hover:shadow-xl transition cursor-pointer bg-slate-600 transform hover:scale-105">
            <Link href="/stockwise/logs">
              <>
                <img
                  src="/stockwise-logo.png"
                  alt="Stockwise logo"
                  className="w-11/12 mx-auto object-cover"
                />
              </>
            </Link>
          </div>
          <div className="flex flex-col justify-center items-center w-48 h-60 border-2 border-ll-orange rounded-lg hover:shadow-xl transition cursor-pointer bg-slate-600 transform hover:scale-105">
            <Link href="/letterlock">
              <>
                <img
                  src="/letterlock-logo.png"
                  alt="Letterlock logo"
                  className="w-11/12 mx-auto object-cover"
                />
              </>
            </Link>
          </div>
          <div className="flex flex-col justify-center items-center w-48 h-60 border-2 border-violet-400 rounded-lg hover:shadow-xl transition cursor-pointer bg-slate-600 transform hover:scale-105 hover:shadow-violet-500/20">
            <Link href="/elora">
              <>
                <span className="text-5xl mb-3">🌟</span>
                <span className="text-xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">Elora</span>
              </>
            </Link>
          </div>
        </div>
      </main>
    </>
  )
}
