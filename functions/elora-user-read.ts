import { Handler } from "@netlify/functions";
const client = require("../database/elora-client.ts")

const toNum = (v: any): number => Number(v ?? 0)
const pctChange = (current: number, prior: number): number => {
  if (prior === 0) return current > 0 ? 100 : 0
  return Math.round(((current - prior) / prior) * 1000) / 10
}

const CATEGORY_LABELS: Record<string, string> = {
  people: 'People',
  events: 'Events',
  topics: 'Topics',
  values: 'Values',
  commitmentsAndProgress: 'Commitments',
  milestonesAndHighlights: 'Milestones',
}

const handler: Handler = async (event, context) => {
  if (!event.body) return { statusCode: 400, body: 'invalid request, you are missing the parameter body' }
  const eventBody = JSON.parse(event.body)
  const userId = eventBody.userId

  const joinedRows = await client`
    SELECT MIN(created_at) AS joined_at FROM user_profiles WHERE user_id = ${userId};`

  const profileRows = await client`
    SELECT profile, us.id_emoji AS emoji FROM user_profiles
    LEFT JOIN user_settings us ON us.user_id = user_profiles.user_id
    WHERE user_profiles.user_id = ${userId} ORDER BY user_profiles.updated_at DESC LIMIT 1;`

  const statsRows = await client`
    SELECT
      (SELECT COUNT(*) FROM journal_entries WHERE user_id = ${userId}) AS total_entries,
      (SELECT COUNT(*) FROM explore_chat_messages m
        INNER JOIN explore_chats c ON c.explore_chat_id = m.explore_chat_id
        WHERE c.user_id = ${userId} AND m.role = 'user'
        AND m.deleted = false AND m.hidden = false AND m.compacted = false
        AND c.deleted = false) AS total_messages;`

  const lastActiveRows = await client`
    SELECT MAX(created_at) AS last_active FROM (
      SELECT created_at FROM journal_entries WHERE user_id = ${userId}
      UNION ALL
      SELECT m.created_at FROM explore_chat_messages m
        INNER JOIN explore_chats c ON c.explore_chat_id = m.explore_chat_id
        WHERE c.user_id = ${userId}
      UNION ALL
      SELECT created_at FROM ai_logs WHERE user_id = ${userId}
      UNION ALL
      SELECT created_at FROM logs WHERE user_id = ${userId}
    ) AS activity;`

  const entries = await client`
    SELECT journal_entry_id, title, emoji, ai_summary, user_summary, content, metadata,
           created_at, entry_number,
           (CHAR_LENGTH(content) - CHAR_LENGTH(REPLACE(content, ' ', '')) + 1)::int AS word_count
    FROM journal_entries
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT 200;`

  const chats = await client`
    SELECT c.explore_chat_id AS id,
           c.title,
           c.deleted,
           c.created_at,
           GREATEST(c.created_at, COALESCE((SELECT MAX(m.created_at) FROM explore_chat_messages m
             WHERE m.explore_chat_id = c.explore_chat_id), c.created_at)) AS last_message_at,
           (SELECT COUNT(*) FROM explore_chat_messages m
             WHERE m.explore_chat_id = c.explore_chat_id) AS total_message_count
    FROM explore_chats c
    WHERE c.user_id = ${userId}
    ORDER BY last_message_at DESC;`

  // Per-user Insights activity (windows use logs.timestamp)
  const insightStats = await client`
    SELECT
      (SELECT COUNT(*) FROM logs WHERE user_id = ${userId} AND log_type_id = 714
         AND timestamp >= now() - interval '7 days') AS cat_taps_week,
      (SELECT COUNT(*) FROM logs WHERE user_id = ${userId} AND log_type_id = 714
         AND timestamp >= now() - interval '14 days' AND timestamp < now() - interval '7 days') AS cat_taps_prior,
      (SELECT COUNT(*) FROM logs WHERE user_id = ${userId} AND log_type_id = 727
         AND timestamp >= now() - interval '7 days') AS views_week,
      (SELECT COUNT(*) FROM logs WHERE user_id = ${userId} AND log_type_id = 727
         AND timestamp >= now() - interval '14 days' AND timestamp < now() - interval '7 days') AS views_prior,
      (SELECT COUNT(*) FROM logs WHERE user_id = ${userId} AND log_type_id = 709
         AND timestamp >= now() - interval '7 days') AS opened_week,
      (SELECT COUNT(*) FROM logs WHERE user_id = ${userId} AND log_type_id = 709
         AND timestamp >= now() - interval '14 days' AND timestamp < now() - interval '7 days') AS opened_prior,
      (SELECT COUNT(*) FROM logs WHERE user_id = ${userId} AND log_type_id = 710
         AND timestamp >= now() - interval '7 days') AS events_week,
      (SELECT COUNT(*) FROM logs WHERE user_id = ${userId} AND log_type_id = 710
         AND timestamp >= now() - interval '14 days' AND timestamp < now() - interval '7 days') AS events_prior,
      (SELECT COUNT(*) FROM logs WHERE user_id = ${userId} AND log_type_id = 706
         AND timestamp >= now() - interval '7 days') AS gen_start_week,
      (SELECT COUNT(*) FROM logs WHERE user_id = ${userId} AND log_type_id = 706
         AND timestamp >= now() - interval '14 days' AND timestamp < now() - interval '7 days') AS gen_start_prior,
      (SELECT COUNT(*) FROM logs WHERE user_id = ${userId} AND log_type_id = 707
         AND timestamp >= now() - interval '7 days') AS gen_success_week,
      (SELECT COUNT(*) FROM logs WHERE user_id = ${userId} AND log_type_id = 707
         AND timestamp >= now() - interval '14 days' AND timestamp < now() - interval '7 days') AS gen_success_prior,
      (SELECT COUNT(*) FROM logs WHERE user_id = ${userId} AND log_type_id = 712
         AND timestamp >= now() - interval '7 days') AS deleted_week,
      (SELECT COUNT(*) FROM logs WHERE user_id = ${userId} AND log_type_id = 712
         AND timestamp >= now() - interval '14 days' AND timestamp < now() - interval '7 days') AS deleted_prior;`

  const categoryTaps = await client`
    SELECT SPLIT_PART(notes, '|', 1) AS category_key,
           COUNT(*) FILTER (WHERE log_type_id = 714 AND timestamp >= now() - interval '7 days') AS taps_week,
           COUNT(*) FILTER (WHERE log_type_id = 714 AND timestamp >= now() - interval '14 days'
                            AND timestamp < now() - interval '7 days') AS taps_prior,
           COUNT(*) FILTER (WHERE log_type_id = 725 AND timestamp >= now() - interval '7 days') AS involvement_week
    FROM logs
    WHERE user_id = ${userId} AND log_type_id IN (714, 725)
      AND timestamp >= now() - interval '14 days'
    GROUP BY 1;`

  const categoryViews = await client`
    SELECT SPLIT_PART(notes, '|', 1) AS category_key, COUNT(*) AS count
    FROM logs
    WHERE user_id = ${userId} AND log_type_id = 727
      AND timestamp >= now() - interval '7 days'
    GROUP BY 1 ORDER BY count DESC;`

  let profile: any = profileRows[0]?.profile ?? {}
  if (typeof profile === 'string') {
    try { profile = JSON.parse(profile) } catch { profile = {} }
  }

  return {
    body: JSON.stringify({
      user: {
        id: userId,
        joined_at: joinedRows[0]?.joined_at ?? null,
        emoji: profileRows[0]?.emoji ?? null,
        profile,
        total_entries: Number(statsRows[0]?.total_entries ?? 0),
        total_messages: Number(statsRows[0]?.total_messages ?? 0),
        last_active: lastActiveRows[0]?.last_active ?? null,
      },
      entries: entries.map((en: any) => ({
        id: en.journal_entry_id,
        insight_title: en.title,
        insight_emoji: en.emoji,
        insight_summary: en.ai_summary,
        insight_bio: en.user_summary,
        content: en.content,
        metadata: en.metadata,
        word_count: Number(en.word_count ?? 0),
        created_at: en.created_at,
      })),
      chats: chats.map((c: any) => ({
        id: c.id,
        title: c.title ?? 'Untitled chat',
        deleted: Boolean(c.deleted),
        created_at: c.created_at,
        last_message_at: c.last_message_at,
        message_count: toNum(c.total_message_count),
      })),
      insights: (() => {
        const s = insightStats[0] ?? {}
        const map = (week: any, prior: any) => ({
          week: toNum(week),
          prior: toNum(prior),
          pct: pctChange(toNum(week), toNum(prior)),
        })
        const startWeek = toNum(s.gen_start_week)
        const priorStart = toNum(s.gen_start_prior)
        return {
          categoryTaps: map(s.cat_taps_week, s.cat_taps_prior),
          categoryBreakdown: categoryTaps
            .map((c: any) => ({
              key: String(c.category_key ?? ''),
              label: CATEGORY_LABELS[String(c.category_key ?? '')] ?? String(c.category_key ?? ''),
              current: toNum(c.taps_week),
              prior: toNum(c.taps_prior),
              involvement: toNum(c.involvement_week),
              pct: pctChange(toNum(c.taps_week), toNum(c.taps_prior)),
            }))
            .filter((c: any) => CATEGORY_LABELS[c.key])
            .sort((a: any, b: any) => b.current - a.current),
          entityViews: map(s.views_week, s.views_prior),
          entityBreakdown: categoryViews.map((c: any) => ({
            key: String(c.category_key ?? ''),
            label: CATEGORY_LABELS[String(c.category_key ?? '')] ?? String(c.category_key ?? ''),
            count: toNum(c.count),
          })),
          timelines: {
            opened: map(s.opened_week, s.opened_prior),
            eventsViewed: map(s.events_week, s.events_prior),
            deleted: map(s.deleted_week, s.deleted_prior),
          },
          generation: {
            started: startWeek,
            startedPrior: priorStart,
            succeeded: toNum(s.gen_success_week),
            succeededPrior: toNum(s.gen_success_prior),
            successRate: startWeek > 0 ? Math.round((toNum(s.gen_success_week) / startWeek) * 1000) / 10 : 0,
            successPriorRate: priorStart > 0 ? Math.round((toNum(s.gen_success_prior) / priorStart) * 1000) / 10 : 0,
          },
        }
      })(),
    }),
    statusCode: 200
  }
}

export { handler }