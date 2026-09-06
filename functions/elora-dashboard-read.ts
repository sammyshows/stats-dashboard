import { Handler } from "@netlify/functions";
const client = require("../database/elora-client.ts")

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

  const topUsers = await client`
    SELECT je.user_id,
           us.id_emoji AS emoji,
           MAX(je.created_at) AS latest_created_at,
           COUNT(*) AS total_entry_count
    FROM journal_entries je
    LEFT JOIN user_settings us ON us.user_id = je.user_id
    GROUP BY je.user_id, us.id_emoji
    ORDER BY latest_created_at DESC
    LIMIT 10;`

  const journalUsers = await client`
    SELECT
      (SELECT COUNT(DISTINCT user_id) FROM journal_entries
       WHERE created_at >= date_trunc('day', now()) - interval '6 days') AS this_week,
      (SELECT COUNT(DISTINCT user_id) FROM journal_entries
       WHERE created_at >= date_trunc('day', now()) - interval '13 days'
         AND created_at < date_trunc('day', now()) - interval '6 days') AS prior_week,
      (SELECT COUNT(DISTINCT user_id) FROM journal_entries
       WHERE created_at >= date_trunc('day', now()) - interval '29 days') AS this_month,
      (SELECT COUNT(DISTINCT user_id) FROM journal_entries
       WHERE created_at >= date_trunc('day', now()) - interval '59 days'
         AND created_at < date_trunc('day', now()) - interval '29 days') AS prior_month;`

  const journalDaily = await dailySeries(client`
    WITH days AS (
      SELECT generate_series(date_trunc('day', now()) - interval '59 days', date_trunc('day', now()), interval '1 day')::date AS day
    ), daily AS (
      SELECT created_at::date AS day, COUNT(DISTINCT user_id)::int AS count
      FROM journal_entries WHERE created_at >= date_trunc('day', now()) - interval '59 days' GROUP BY created_at::date
    )
    SELECT d.day, COALESCE(daily.count, 0)::int AS count FROM days d LEFT JOIN daily ON daily.day = d.day ORDER BY d.day;`)

  const chatUsers = await client`
    SELECT
      (SELECT COUNT(DISTINCT c.user_id) FROM explore_chat_messages m
       INNER JOIN explore_chats c ON c.explore_chat_id = m.explore_chat_id
       WHERE m.role = 'user' AND m.deleted = false AND m.hidden = false AND m.compacted = false AND c.deleted = false
         AND m.created_at >= date_trunc('day', now()) - interval '6 days') AS this_week,
      (SELECT COUNT(DISTINCT c.user_id) FROM explore_chat_messages m
       INNER JOIN explore_chats c ON c.explore_chat_id = m.explore_chat_id
       WHERE m.role = 'user' AND m.deleted = false AND m.hidden = false AND m.compacted = false AND c.deleted = false
         AND m.created_at >= date_trunc('day', now()) - interval '13 days'
         AND m.created_at < date_trunc('day', now()) - interval '6 days') AS prior_week,
      (SELECT COUNT(DISTINCT c.user_id) FROM explore_chat_messages m
       INNER JOIN explore_chats c ON c.explore_chat_id = m.explore_chat_id
       WHERE m.role = 'user' AND m.deleted = false AND m.hidden = false AND m.compacted = false AND c.deleted = false
         AND m.created_at >= date_trunc('day', now()) - interval '29 days') AS this_month,
      (SELECT COUNT(DISTINCT c.user_id) FROM explore_chat_messages m
       INNER JOIN explore_chats c ON c.explore_chat_id = m.explore_chat_id
       WHERE m.role = 'user' AND m.deleted = false AND m.hidden = false AND m.compacted = false AND c.deleted = false
         AND m.created_at >= date_trunc('day', now()) - interval '59 days'
         AND m.created_at < date_trunc('day', now()) - interval '29 days') AS prior_month;`

  const chatUsersDaily = await dailySeries(client`
    WITH days AS (
      SELECT generate_series(date_trunc('day', now()) - interval '59 days', date_trunc('day', now()), interval '1 day')::date AS day
    ), daily AS (
      SELECT m.created_at::date AS day, COUNT(DISTINCT c.user_id)::int AS count
      FROM explore_chat_messages m INNER JOIN explore_chats c ON c.explore_chat_id = m.explore_chat_id
      WHERE m.role = 'user' AND m.deleted = false AND m.hidden = false AND m.compacted = false AND c.deleted = false
        AND m.created_at >= date_trunc('day', now()) - interval '59 days' GROUP BY m.created_at::date
    )
    SELECT d.day, COALESCE(daily.count, 0)::int AS count FROM days d LEFT JOIN daily ON daily.day = d.day ORDER BY d.day;`)

  const messagesDaily = await dailySeries(client`
    WITH days AS (
      SELECT generate_series(date_trunc('day', now()) - interval '59 days', date_trunc('day', now()), interval '1 day')::date AS day
    ), daily AS (
      SELECT created_at::date AS day, COUNT(*)::int AS count FROM explore_chat_messages
      WHERE role = 'user' AND deleted = false AND hidden = false AND compacted = false
        AND created_at >= date_trunc('day', now()) - interval '59 days' GROUP BY created_at::date
    )
    SELECT d.day, COALESCE(daily.count, 0)::int AS count FROM days d LEFT JOIN daily ON daily.day = d.day ORDER BY d.day;`)

  const insights = await client`
    SELECT title, emoji, ai_summary, TO_CHAR(created_at, 'DD/MM/YYYY') AS created_date
    FROM journal_entries
    WHERE title IS NOT NULL AND title <> '' AND emoji IS NOT NULL AND created_at >= now() - interval '7 days'
    ORDER BY created_at DESC LIMIT 8;`

  // ====== Insights engagement & demo funnel (from logs table) ======
  const CATEGORY_LABELS: Record<string, string> = {
    people: 'People',
    events: 'Events',
    topics: 'Topics',
    values: 'Values',
    commitmentsAndProgress: 'Commitments',
    milestonesAndHighlights: 'Milestones',
  }

  const categoryClicksUsers = await client`
    SELECT
      (SELECT COUNT(DISTINCT user_id) FROM logs
       WHERE log_type_id = 714 AND user_id IS NOT NULL
         AND timestamp >= date_trunc('day', now()) - interval '6 days') AS this_week,
      (SELECT COUNT(DISTINCT user_id) FROM logs
       WHERE log_type_id = 714 AND user_id IS NOT NULL
         AND timestamp >= date_trunc('day', now()) - interval '13 days'
         AND timestamp < date_trunc('day', now()) - interval '6 days') AS prior_week;`

  const categoryClicksDaily = await dailySeries(client`
    WITH days AS (
      SELECT generate_series(date_trunc('day', now()) - interval '13 days', date_trunc('day', now()), interval '1 day')::date AS day
    ), daily AS (
      SELECT timestamp::date AS day, COUNT(DISTINCT user_id)::int AS count
      FROM logs WHERE log_type_id = 714 AND user_id IS NOT NULL
        AND timestamp >= date_trunc('day', now()) - interval '13 days'
      GROUP BY timestamp::date
    )
    SELECT d.day, COALESCE(daily.count, 0)::int AS count FROM days d LEFT JOIN daily ON daily.day = d.day ORDER BY d.day;`)

  const categoryBreakdown = await client`
    SELECT SPLIT_PART(notes, '|', 1) AS category_key,
           COUNT(*) FILTER (WHERE timestamp >= date_trunc('day', now()) - interval '6 days') AS this_week,
           COUNT(*) FILTER (WHERE timestamp >= date_trunc('day', now()) - interval '13 days'
                            AND timestamp < date_trunc('day', now()) - interval '6 days') AS prior_week
    FROM logs
    WHERE log_type_id = 714 AND user_id IS NOT NULL
      AND timestamp >= date_trunc('day', now()) - interval '13 days'
    GROUP BY 1;`

  const entityViews = await client`
    SELECT
      (SELECT COUNT(*) FROM logs WHERE log_type_id = 727 AND user_id IS NOT NULL
         AND timestamp >= date_trunc('day', now()) - interval '6 days') AS views_week,
      (SELECT COUNT(*) FROM logs WHERE log_type_id = 727 AND user_id IS NOT NULL
         AND timestamp >= date_trunc('day', now()) - interval '13 days'
         AND timestamp < date_trunc('day', now()) - interval '6 days') AS views_prior,
      (SELECT COUNT(DISTINCT user_id) FROM logs WHERE log_type_id = 727 AND user_id IS NOT NULL
         AND timestamp >= date_trunc('day', now()) - interval '6 days') AS users_week,
      (SELECT COUNT(DISTINCT user_id) FROM logs WHERE log_type_id = 727 AND user_id IS NOT NULL
         AND timestamp >= date_trunc('day', now()) - interval '13 days'
         AND timestamp < date_trunc('day', now()) - interval '6 days') AS users_prior;`

  const entityViewsDaily = await dailySeries(client`
    WITH days AS (
      SELECT generate_series(date_trunc('day', now()) - interval '13 days', date_trunc('day', now()), interval '1 day')::date AS day
    ), daily AS (
      SELECT timestamp::date AS day, COUNT(*)::int AS count
      FROM logs WHERE log_type_id = 727 AND user_id IS NOT NULL
        AND timestamp >= date_trunc('day', now()) - interval '13 days'
      GROUP BY timestamp::date
    )
    SELECT d.day, COALESCE(daily.count, 0)::int AS count FROM days d LEFT JOIN daily ON daily.day = d.day ORDER BY d.day;`)

  const entityUsersDaily = await dailySeries(client`
    WITH days AS (
      SELECT generate_series(date_trunc('day', now()) - interval '13 days', date_trunc('day', now()), interval '1 day')::date AS day
    ), daily AS (
      SELECT timestamp::date AS day, COUNT(DISTINCT user_id)::int AS count
      FROM logs WHERE log_type_id = 727 AND user_id IS NOT NULL
        AND timestamp >= date_trunc('day', now()) - interval '13 days'
      GROUP BY timestamp::date
    )
    SELECT d.day, COALESCE(daily.count, 0)::int AS count FROM days d LEFT JOIN daily ON daily.day = d.day ORDER BY d.day;`)

  const exploreLimits = await client`
    SELECT
      (SELECT COUNT(*) FROM logs WHERE log_type_id = 422 AND user_id IS NOT NULL
         AND timestamp >= date_trunc('day', now()) - interval '6 days') AS events_week,
      (SELECT COUNT(*) FROM logs WHERE log_type_id = 422 AND user_id IS NOT NULL
         AND timestamp >= date_trunc('day', now()) - interval '13 days'
         AND timestamp < date_trunc('day', now()) - interval '6 days') AS events_prior,
      (SELECT COUNT(DISTINCT user_id) FROM logs WHERE log_type_id = 422 AND user_id IS NOT NULL
         AND timestamp >= date_trunc('day', now()) - interval '6 days') AS users_week,
      (SELECT COUNT(DISTINCT user_id) FROM logs WHERE log_type_id = 422 AND user_id IS NOT NULL
         AND timestamp >= date_trunc('day', now()) - interval '13 days'
         AND timestamp < date_trunc('day', now()) - interval '6 days') AS users_prior;`

  const exploreLimitsDaily = await dailySeries(client`
    WITH days AS (
      SELECT generate_series(date_trunc('day', now()) - interval '13 days', date_trunc('day', now()), interval '1 day')::date AS day
    ), daily AS (
      SELECT timestamp::date AS day, COUNT(*)::int AS count
      FROM logs WHERE log_type_id = 422 AND user_id IS NOT NULL
        AND timestamp >= date_trunc('day', now()) - interval '13 days'
      GROUP BY timestamp::date
    )
    SELECT d.day, COALESCE(daily.count, 0)::int AS count FROM days d LEFT JOIN daily ON daily.day = d.day ORDER BY d.day;`)

  const exploreUsersDaily = await dailySeries(client`
    WITH days AS (
      SELECT generate_series(date_trunc('day', now()) - interval '13 days', date_trunc('day', now()), interval '1 day')::date AS day
    ), daily AS (
      SELECT timestamp::date AS day, COUNT(DISTINCT user_id)::int AS count
      FROM logs WHERE log_type_id = 422 AND user_id IS NOT NULL
        AND timestamp >= date_trunc('day', now()) - interval '13 days'
      GROUP BY timestamp::date
    )
    SELECT d.day, COALESCE(daily.count, 0)::int AS count FROM days d LEFT JOIN daily ON daily.day = d.day ORDER BY d.day;`)

  const demoSessions = await client`
    SELECT
      (SELECT COUNT(DISTINCT user_id) FROM logs WHERE log_type_id = 520 AND user_id IS NOT NULL
         AND timestamp >= date_trunc('day', now()) - interval '6 days') AS this_week,
      (SELECT COUNT(DISTINCT user_id) FROM logs WHERE log_type_id = 520 AND user_id IS NOT NULL
         AND timestamp >= date_trunc('day', now()) - interval '13 days'
         AND timestamp < date_trunc('day', now()) - interval '6 days') AS prior_week;`

  const categoryClickUsers = await client`
    SELECT DISTINCT l.user_id, us.id_emoji AS emoji
    FROM logs l LEFT JOIN user_settings us ON us.user_id = l.user_id
    WHERE l.log_type_id = 714 AND l.user_id IS NOT NULL
      AND l.timestamp >= date_trunc('day', now()) - interval '6 days'
    ORDER BY l.user_id;`

  const entityViewUsers = await client`
    SELECT DISTINCT l.user_id, us.id_emoji AS emoji
    FROM logs l LEFT JOIN user_settings us ON us.user_id = l.user_id
    WHERE l.log_type_id = 727 AND l.user_id IS NOT NULL
      AND l.timestamp >= date_trunc('day', now()) - interval '6 days'
    ORDER BY l.user_id;`

  const exploreLimitUsers = await client`
    SELECT DISTINCT l.user_id, us.id_emoji AS emoji
    FROM logs l LEFT JOIN user_settings us ON us.user_id = l.user_id
    WHERE l.log_type_id = 422 AND l.user_id IS NOT NULL
      AND l.timestamp >= date_trunc('day', now()) - interval '6 days'
    ORDER BY l.user_id;`

  const demoStarterUsers = await client`
    SELECT DISTINCT l.user_id, us.id_emoji AS emoji
    FROM logs l LEFT JOIN user_settings us ON us.user_id = l.user_id
    WHERE l.log_type_id = 520 AND l.user_id IS NOT NULL
      AND l.timestamp >= date_trunc('day', now()) - interval '6 days'
    ORDER BY l.user_id;`

  const demoStartersDaily = await dailySeries(client`
    WITH days AS (
      SELECT generate_series(date_trunc('day', now()) - interval '13 days', date_trunc('day', now()), interval '1 day')::date AS day
    ), daily AS (
      SELECT timestamp::date AS day, COUNT(DISTINCT user_id)::int AS count
      FROM logs WHERE log_type_id = 520 AND user_id IS NOT NULL
        AND timestamp >= date_trunc('day', now()) - interval '13 days'
      GROUP BY timestamp::date
    )
    SELECT d.day, COALESCE(daily.count, 0)::int AS count FROM days d LEFT JOIN daily ON daily.day = d.day ORDER BY d.day;`)

  const demoCompletedWeek = await client`
    SELECT COUNT(DISTINCT user_id) AS completed FROM logs
    WHERE user_id IS NOT NULL
      AND timestamp >= date_trunc('day', now()) - interval '6 days'
      AND (log_type_id = 522 OR (log_type_id = 521 AND notes = '11'))
      AND user_id IN (SELECT DISTINCT user_id FROM logs
        WHERE log_type_id = 520 AND user_id IS NOT NULL
          AND timestamp >= date_trunc('day', now()) - interval '6 days');`

  const demoCompletedPrior = await client`
    SELECT COUNT(DISTINCT user_id) AS completed FROM logs
    WHERE user_id IS NOT NULL
      AND timestamp >= date_trunc('day', now()) - interval '13 days'
      AND timestamp < date_trunc('day', now()) - interval '6 days'
      AND (log_type_id = 522 OR (log_type_id = 521 AND notes = '11'))
      AND user_id IN (SELECT DISTINCT user_id FROM logs
        WHERE log_type_id = 520 AND user_id IS NOT NULL
          AND timestamp >= date_trunc('day', now()) - interval '13 days'
          AND timestamp < date_trunc('day', now()) - interval '6 days');`

  const demoSegments = await client`
    SELECT user_id, MAX(CASE WHEN notes ~ '^[0-9]+$' THEN notes::int END) AS max_step
    FROM (
      SELECT user_id, notes FROM logs
      WHERE log_type_id = 521 AND user_id IS NOT NULL
        AND timestamp >= date_trunc('day', now()) - interval '6 days'
      UNION ALL
      SELECT user_id, '11' FROM logs
      WHERE log_type_id = 522 AND user_id IS NOT NULL
        AND timestamp >= date_trunc('day', now()) - interval '6 days'
    ) t
    GROUP BY user_id;`

  const ju = journalUsers[0]; const cu = chatUsers[0]

  const msgWeekCurrent = messagesDaily.slice(53).reduce((a: number, b: number) => a + b, 0)
  const msgWeekPrior = messagesDaily.slice(46, 53).reduce((a: number, b: number) => a + b, 0)
  const msgMonthCurrent = messagesDaily.slice(30).reduce((a: number, b: number) => a + b, 0)
  const msgMonthPrior = messagesDaily.slice(0, 30).reduce((a: number, b: number) => a + b, 0)

  // After getting raw log rows, compute per-category and funnel values.
  const ccUsers = categoryClicksUsers[0]
  const ccCategories = categoryBreakdown
    .map((c: any) => {
      const key = String(c.category_key ?? '')
      return {
        key,
        label: CATEGORY_LABELS[key] ?? key,
        current: toNum(c.this_week),
        prior: toNum(c.prior_week),
        pct: pctChange(toNum(c.this_week), toNum(c.prior_week)),
      }
    })
    .filter((c: any) => CATEGORY_LABELS[c.key])
    .sort((a: any, b: any) => b.current - a.current)

  const ev = entityViews[0]
  const el = exploreLimits[0]
  const demo = demoSessions[0]
  const startersWeek = toNum(demo?.this_week)
  const startersPrior = toNum(demo?.prior_week)
  const completedWeek = toNum(demoCompletedWeek[0]?.completed)
  const completedPrior = toNum(demoCompletedPrior[0]?.completed)

  const DEMO_STEPS = [3, 4, 5, 6, 7, 8, 9, 10, 11]
  const DEMO_STEP_LABELS: Record<number, string> = {
    3: 'Journal page', 4: 'New-entry button', 5: 'Journal saved entry', 6: 'Entry detail',
    7: 'Explore tab', 8: 'Explore typing', 9: 'Insights pulses', 10: 'Insights tab', 11: 'Timeline detail',
  }
  const funnelSteps = DEMO_STEPS.map((s) => ({
    step: s,
    label: DEMO_STEP_LABELS[s],
    count: demoSegments.filter((u: any) => toNum(u.max_step) >= s).length,
  }))

  return {
    body: JSON.stringify({
      topUsers: topUsers.map((u: any) => ({
        user_id: u.user_id,
        emoji: u.emoji ?? null,
        latest_created_at: u.latest_created_at,
        total_entry_count: toNum(u.total_entry_count),
      })),
      activeJournalUsers: {
        week: build(ju?.this_week, ju?.prior_week, journalDaily, 7),
        month: build(ju?.this_month, ju?.prior_month, journalDaily, 30),
      },
      chatMessages: {
        week: { count: msgWeekCurrent, prior: msgWeekPrior, pct: pctChange(msgWeekCurrent, msgWeekPrior), series: { current: messagesDaily.slice(53), prior: messagesDaily.slice(46, 53) } },
        month: { count: msgMonthCurrent, prior: msgMonthPrior, pct: pctChange(msgMonthCurrent, msgMonthPrior), series: { current: messagesDaily.slice(30), prior: messagesDaily.slice(0, 30) } },
      },
      activeChatUsers: {
        week: build(cu?.this_week, cu?.prior_week, chatUsersDaily, 7),
        month: build(cu?.this_month, cu?.prior_month, chatUsersDaily, 30),
      },
      categoryClicks: {
        uniqueUsers: build(ccUsers?.this_week, ccUsers?.prior_week, categoryClicksDaily, 7),
        categories: ccCategories,
        users: categoryClickUsers.map((u: any) => ({ user_id: u.user_id, emoji: u.emoji ?? null })),
      },
      entityAnalyses: {
        totalViews: build(ev?.views_week, ev?.views_prior, entityViewsDaily, 7),
        uniqueUsers: build(ev?.users_week, ev?.users_prior, entityUsersDaily, 7),
        users: entityViewUsers.map((u: any) => ({ user_id: u.user_id, emoji: u.emoji ?? null })),
      },
      exploreLimits: {
        total: build(el?.events_week, el?.events_prior, exploreLimitsDaily, 7),
        uniqueUsers: build(el?.users_week, el?.users_prior, exploreUsersDaily, 7),
        users: exploreLimitUsers.map((u: any) => ({ user_id: u.user_id, emoji: u.emoji ?? null })),
      },
      demoFunnel: {
        starters: { count: startersWeek, prior: startersPrior, pct: pctChange(startersWeek, startersPrior), series: { current: demoStartersDaily.slice(-7), prior: demoStartersDaily.slice(-14, -7) } },
        starterUsers: demoStarterUsers.map((u: any) => ({ user_id: u.user_id, emoji: u.emoji ?? null })),
        completion: {
          week: completedWeek,
          prior: completedPrior,
          pct: pctChange(completedWeek, completedPrior),
          rate: startersWeek > 0 ? Math.round((completedWeek / startersWeek) * 1000) / 10 : 0,
          priorRate: startersPrior > 0 ? Math.round((completedPrior / startersPrior) * 1000) / 10 : 0,
          ratePct: startersPrior > 0 ? pctChange(Math.round((completedWeek / startersWeek) * 1000) / 10, Math.round((completedPrior / startersPrior) * 1000) / 10) : startersWeek > 0 ? 100 : 0,
        },
        steps: funnelSteps,
      },
      insights: insights.map((i: any) => ({
        insight_title: i.title,
        insight_emoji: i.emoji,
        insight_summary: i.ai_summary,
        created_date: i.created_date,
      })),
    }),
    statusCode: 200
  }
}

export { handler }