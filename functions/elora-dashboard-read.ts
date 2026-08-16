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

  const ju = journalUsers[0]; const cu = chatUsers[0]

  const msgWeekCurrent = messagesDaily.slice(53).reduce((a: number, b: number) => a + b, 0)
  const msgWeekPrior = messagesDaily.slice(46, 53).reduce((a: number, b: number) => a + b, 0)
  const msgMonthCurrent = messagesDaily.slice(30).reduce((a: number, b: number) => a + b, 0)
  const msgMonthPrior = messagesDaily.slice(0, 30).reduce((a: number, b: number) => a + b, 0)

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