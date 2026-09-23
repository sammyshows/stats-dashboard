import { Handler } from "@netlify/functions";
const client = require("../database/client.ts");

const toNum = (v: any): number => Number(v ?? 0)
const pctChange = (current: number, prior: number): number => {
  if (prior === 0) return current > 0 ? 100 : 0
  return Math.round(((current - prior) / prior) * 1000) / 10
}

const build = (current: any, prior: any, daily: number[], dayOffset: number) => {
  const c = toNum(current); const p = toNum(prior)
  const total = daily.length
  const currentSlice = daily.slice(total - dayOffset)
  const priorSlice = daily.slice(total - dayOffset * 2, total - dayOffset)
  return { count: c, prior: p, pct: pctChange(c, p), series: { current: currentSlice, prior: priorSlice } }
}

const dailySeries = async (query: ReturnType<typeof client>) => {
  const rows: any[] = await query
  return rows.map((r: any) => toNum(r.count))
}

const handler: Handler = async (event, context) => {
  const handlerStart = Date.now()

  const settled = await Promise.allSettled([
    // Active users (activity = updated_at on user_stats).
    // Counts use calendar-day boundaries (date_trunc) so the headline number
    // exactly equals the sum of the daily series slices shown on the card.
    client`
      SELECT
        (SELECT COUNT(DISTINCT user_id) FROM letterlock_user_stats WHERE test_user IS NOT TRUE AND updated_at >= date_trunc('day', now()) - interval '6 days') AS cur_7d,
        (SELECT COUNT(DISTINCT user_id) FROM letterlock_user_stats WHERE test_user IS NOT TRUE AND updated_at >= date_trunc('day', now()) - interval '13 days' AND updated_at < date_trunc('day', now()) - interval '6 days') AS prior_7d,
        (SELECT COUNT(DISTINCT user_id) FROM letterlock_user_stats WHERE test_user IS NOT TRUE AND updated_at >= date_trunc('day', now()) - interval '29 days') AS cur_30d,
        (SELECT COUNT(DISTINCT user_id) FROM letterlock_user_stats WHERE test_user IS NOT TRUE AND updated_at >= date_trunc('day', now()) - interval '59 days' AND updated_at < date_trunc('day', now()) - interval '29 days') AS prior_30d;`,

    dailySeries(client`
      WITH days AS (
        SELECT generate_series(date_trunc('day', now()) - interval '59 days', date_trunc('day', now()), interval '1 day')::date AS day
      ), daily AS (
        SELECT updated_at::date AS day, COUNT(DISTINCT user_id)::int AS count
        FROM letterlock_user_stats WHERE test_user IS NOT TRUE AND updated_at >= date_trunc('day', now()) - interval '59 days'
        GROUP BY updated_at::date
      )
      SELECT d.day, COALESCE(daily.count, 0)::int AS count FROM days d LEFT JOIN daily ON daily.day = d.day ORDER BY d.day;`),

    // New users (created_at on user_stats)
    client`
      SELECT
        (SELECT COUNT(DISTINCT user_id) FROM letterlock_user_stats WHERE test_user IS NOT TRUE AND created_at >= date_trunc('day', now()) - interval '6 days') AS cur_7d,
        (SELECT COUNT(DISTINCT user_id) FROM letterlock_user_stats WHERE test_user IS NOT TRUE AND created_at >= date_trunc('day', now()) - interval '13 days' AND created_at < date_trunc('day', now()) - interval '6 days') AS prior_7d,
        (SELECT COUNT(DISTINCT user_id) FROM letterlock_user_stats WHERE test_user IS NOT TRUE AND created_at >= date_trunc('day', now()) - interval '29 days') AS cur_30d,
        (SELECT COUNT(DISTINCT user_id) FROM letterlock_user_stats WHERE test_user IS NOT TRUE AND created_at >= date_trunc('day', now()) - interval '59 days' AND created_at < date_trunc('day', now()) - interval '29 days') AS prior_30d;`,

    dailySeries(client`
      WITH days AS (
        SELECT generate_series(date_trunc('day', now()) - interval '59 days', date_trunc('day', now()), interval '1 day')::date AS day
      ), daily AS (
        SELECT created_at::date AS day, COUNT(DISTINCT user_id)::int AS count
        FROM letterlock_user_stats WHERE test_user IS NOT TRUE AND created_at >= date_trunc('day', now()) - interval '59 days'
        GROUP BY created_at::date
      )
      SELECT d.day, COALESCE(daily.count, 0)::int AS count FROM days d LEFT JOIN daily ON daily.day = d.day ORDER BY d.day;`),

    // Ads watched
    client`
      SELECT
        (SELECT COUNT(*) FROM letterlock_ads_watched WHERE created_at >= date_trunc('day', now()) - interval '6 days'
          AND user_id::uuid IN (SELECT user_id FROM letterlock_user_stats WHERE test_user IS NOT TRUE)) AS cur_7d,
        (SELECT COUNT(*) FROM letterlock_ads_watched WHERE created_at >= date_trunc('day', now()) - interval '13 days' AND created_at < date_trunc('day', now()) - interval '6 days'
          AND user_id::uuid IN (SELECT user_id FROM letterlock_user_stats WHERE test_user IS NOT TRUE)) AS prior_7d,
        (SELECT COUNT(*) FROM letterlock_ads_watched WHERE created_at >= date_trunc('day', now()) - interval '29 days'
          AND user_id::uuid IN (SELECT user_id FROM letterlock_user_stats WHERE test_user IS NOT TRUE)) AS cur_30d,
        (SELECT COUNT(*) FROM letterlock_ads_watched WHERE created_at >= date_trunc('day', now()) - interval '59 days' AND created_at < date_trunc('day', now()) - interval '29 days'
          AND user_id::uuid IN (SELECT user_id FROM letterlock_user_stats WHERE test_user IS NOT TRUE)) AS prior_30d;`,

    dailySeries(client`
      WITH days AS (
        SELECT generate_series(date_trunc('day', now()) - interval '59 days', date_trunc('day', now()), interval '1 day')::date AS day
      ), daily AS (
        SELECT created_at::date AS day, COUNT(*)::int AS count
        FROM letterlock_ads_watched WHERE created_at >= date_trunc('day', now()) - interval '59 days'
          AND user_id::uuid IN (SELECT user_id FROM letterlock_user_stats WHERE test_user IS NOT TRUE)
        GROUP BY created_at::date
      )
      SELECT d.day, COALESCE(daily.count, 0)::int AS count FROM days d LEFT JOIN daily ON daily.day = d.day ORDER BY d.day;`),

    // Levels accomplished (log_type = 2 = successes)
    client`
      SELECT
        (SELECT COUNT(*) FROM letterlock_logs WHERE log_type = 2 AND created_at >= date_trunc('day', now()) - interval '6 days'
          AND user_id::uuid IN (SELECT user_id FROM letterlock_user_stats WHERE test_user IS NOT TRUE)) AS cur_7d,
        (SELECT COUNT(*) FROM letterlock_logs WHERE log_type = 2 AND created_at >= date_trunc('day', now()) - interval '13 days' AND created_at < date_trunc('day', now()) - interval '6 days'
          AND user_id::uuid IN (SELECT user_id FROM letterlock_user_stats WHERE test_user IS NOT TRUE)) AS prior_7d,
        (SELECT COUNT(*) FROM letterlock_logs WHERE log_type = 2 AND created_at >= date_trunc('day', now()) - interval '29 days'
          AND user_id::uuid IN (SELECT user_id FROM letterlock_user_stats WHERE test_user IS NOT TRUE)) AS cur_30d,
        (SELECT COUNT(*) FROM letterlock_logs WHERE log_type = 2 AND created_at >= date_trunc('day', now()) - interval '59 days' AND created_at < date_trunc('day', now()) - interval '29 days'
          AND user_id::uuid IN (SELECT user_id FROM letterlock_user_stats WHERE test_user IS NOT TRUE)) AS prior_30d;`,

    dailySeries(client`
      WITH days AS (
        SELECT generate_series(date_trunc('day', now()) - interval '59 days', date_trunc('day', now()), interval '1 day')::date AS day
      ), daily AS (
        SELECT created_at::date AS day, COUNT(*)::int AS count
        FROM letterlock_logs WHERE log_type = 2 AND created_at >= date_trunc('day', now()) - interval '59 days'
          AND user_id::uuid IN (SELECT user_id FROM letterlock_user_stats WHERE test_user IS NOT TRUE)
        GROUP BY created_at::date
      )
      SELECT d.day, COALESCE(daily.count, 0)::int AS count FROM days d LEFT JOIN daily ON daily.day = d.day ORDER BY d.day;`),
  ])

  const [activeUsers, activeUsersDaily, newUsers, newUsersDaily, adsWatched, adsWatchedDaily, levelsAccomplished, levelsAccomplishedDaily] =
    settled.map((r: any) => r.status === 'fulfilled' ? r.value : [])

  const au = activeUsers[0], nu = newUsers[0], ad = adsWatched[0], la = levelsAccomplished[0]

  const totalMs = Date.now() - handlerStart
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[perf] letterlock-summary handler: ${totalMs}ms`)
  }

  return {
    body: JSON.stringify({
      activeUsers: {
        week: build(au?.cur_7d, au?.prior_7d, activeUsersDaily, 7),
        month: build(au?.cur_30d, au?.prior_30d, activeUsersDaily, 30),
      },
      newUsers: {
        week: build(nu?.cur_7d, nu?.prior_7d, newUsersDaily, 7),
        month: build(nu?.cur_30d, nu?.prior_30d, newUsersDaily, 30),
      },
      adsWatched: {
        week: build(ad?.cur_7d, ad?.prior_7d, adsWatchedDaily, 7),
        month: build(ad?.cur_30d, ad?.prior_30d, adsWatchedDaily, 30),
      },
      levelsAccomplished: {
        week: build(la?.cur_7d, la?.prior_7d, levelsAccomplishedDaily, 7),
        month: build(la?.cur_30d, la?.prior_30d, levelsAccomplishedDaily, 30),
      },
      _perf: totalMs,
    }),
    statusCode: 200
  }
}

export { handler }