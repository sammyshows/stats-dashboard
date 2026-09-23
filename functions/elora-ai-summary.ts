import { Handler } from "@netlify/functions";
const client = require("../database/elora-client.ts")

const toNum = (v: any): number => Number(v ?? 0)

// Calendar-day windows matching the dashboard cards (7d = last 7 cal days, 30d = last 30).
const handler: Handler = async (event, context) => {
  const card = await client`
    SELECT
      -- Active journal users
      (SELECT COUNT(DISTINCT user_id) FROM journal_entries WHERE created_at >= date_trunc('day', now()) - interval '6 days') AS aj_users_7d,
      (SELECT COUNT(DISTINCT user_id) FROM journal_entries WHERE created_at >= date_trunc('day', now()) - interval '29 days') AS aj_users_30d,
      -- Total entries
      (SELECT COUNT(*) FROM journal_entries WHERE created_at >= date_trunc('day', now()) - interval '6 days') AS entries_7d,
      (SELECT COUNT(*) FROM journal_entries WHERE created_at >= date_trunc('day', now()) - interval '29 days') AS entries_30d,
      -- Chat messages + active chat users
      (SELECT COUNT(*) FROM explore_chat_messages WHERE role = 'user' AND deleted = false AND hidden = false AND compacted = false AND created_at >= date_trunc('day', now()) - interval '6 days') AS msgs_7d,
      (SELECT COUNT(*) FROM explore_chat_messages WHERE role = 'user' AND deleted = false AND hidden = false AND compacted = false AND created_at >= date_trunc('day', now()) - interval '29 days') AS msgs_30d,
      (SELECT COUNT(DISTINCT c.user_id) FROM explore_chat_messages m INNER JOIN explore_chats c ON c.explore_chat_id = m.explore_chat_id WHERE m.role = 'user' AND m.deleted = false AND m.hidden = false AND m.compacted = false AND c.deleted = false AND m.created_at >= date_trunc('day', now()) - interval '6 days') AS chat_users_7d,
      (SELECT COUNT(DISTINCT c.user_id) FROM explore_chat_messages m INNER JOIN explore_chats c ON c.explore_chat_id = m.explore_chat_id WHERE m.role = 'user' AND m.deleted = false AND m.hidden = false AND m.compacted = false AND c.deleted = false AND m.created_at >= date_trunc('day', now()) - interval '29 days') AS chat_users_30d,
      -- Voice entry users (transcriptions tied to ≥1 entry same window)
      (SELECT COUNT(DISTINCT v.user_id) FROM ai_logs v WHERE v.log_type_id = 1 AND v.created_at >= date_trunc('day', now()) - interval '6 days' AND EXISTS (SELECT 1 FROM journal_entries je WHERE je.user_id = v.user_id AND je.created_at >= date_trunc('day', now()) - interval '6 days')) AS voice_users_7d,
      (SELECT COUNT(DISTINCT v.user_id) FROM ai_logs v WHERE v.log_type_id = 1 AND v.created_at >= date_trunc('day', now()) - interval '29 days' AND EXISTS (SELECT 1 FROM journal_entries je WHERE je.user_id = v.user_id AND je.created_at >= date_trunc('day', now()) - interval '29 days')) AS voice_users_30d,
      -- Explore limits
      (SELECT COUNT(*) FROM logs WHERE log_type_id = 422 AND user_id IS NOT NULL AND timestamp >= date_trunc('day', now()) - interval '6 days') AS limit_events,
      (SELECT COUNT(DISTINCT user_id) FROM logs WHERE log_type_id = 422 AND user_id IS NOT NULL AND timestamp >= date_trunc('day', now()) - interval '6 days') AS limit_users;`

  const categories = await client`
    SELECT COUNT(*) FILTER (WHERE timestamp >= date_trunc('day', now()) - interval '6 days') AS taps_7d,
           COUNT(DISTINCT user_id) FILTER (WHERE timestamp >= date_trunc('day', now()) - interval '6 days') AS tap_users_7d
    FROM logs WHERE log_type_id = 714 AND user_id IS NOT NULL;`

  const entityViews = await client`
    SELECT
      (SELECT COUNT(*) FROM logs WHERE log_type_id = 727 AND user_id IS NOT NULL AND timestamp >= date_trunc('day', now()) - interval '6 days') AS views_7d,
      (SELECT COUNT(DISTINCT user_id) FROM logs WHERE log_type_id = 727 AND user_id IS NOT NULL AND timestamp >= date_trunc('day', now()) - interval '6 days') AS view_users_7d;`

  const timelineActivity = await client`
    SELECT
      (SELECT COUNT(*) FROM logs WHERE log_type_id = 707 AND user_id IS NOT NULL AND timestamp >= date_trunc('day', now()) - interval '6 days') AS created_7d,
      (SELECT COUNT(*) FROM logs WHERE log_type_id = 709 AND user_id IS NOT NULL AND timestamp >= date_trunc('day', now()) - interval '6 days') AS opened_7d,
      (SELECT COUNT(*) FROM logs WHERE log_type_id = 710 AND user_id IS NOT NULL AND timestamp >= date_trunc('day', now()) - interval '6 days') AS events_viewed_7d,
      (SELECT COUNT(*) FROM logs WHERE log_type_id = 706 AND user_id IS NOT NULL AND timestamp >= date_trunc('day', now()) - interval '6 days') AS gen_started,
      (SELECT COUNT(*) FROM logs WHERE log_type_id = 707 AND user_id IS NOT NULL AND timestamp >= date_trunc('day', now()) - interval '6 days') AS gen_succeeded,
      (SELECT COUNT(*) FROM logs WHERE log_type_id = 708 AND user_id IS NOT NULL AND timestamp >= date_trunc('day', now()) - interval '6 days') AS gen_failed;`

  const demoFunnel = await client`
    SELECT
      (SELECT COUNT(DISTINCT user_id) FROM logs WHERE log_type_id = 520 AND user_id IS NOT NULL AND timestamp >= date_trunc('day', now()) - interval '6 days') AS started,
      (SELECT COUNT(DISTINCT user_id) FROM logs WHERE log_type_id = 522 AND user_id IS NOT NULL AND timestamp >= date_trunc('day', now()) - interval '6 days') AS completed,
      (SELECT COUNT(DISTINCT user_id) FROM logs WHERE log_type_id = 535 AND user_id IS NOT NULL AND timestamp >= date_trunc('day', now()) - interval '6 days') AS skipped;`

  const devices = await client`
    SELECT
      (SELECT COUNT(DISTINCT l.user_id) FROM logs l JOIN user_settings us ON us.user_id = l.user_id WHERE l.user_id IS NOT NULL AND LOWER(us.platform) = 'ios' AND l.created_at >= date_trunc('day', now()) - interval '6 days') AS ios_7d,
      (SELECT COUNT(DISTINCT l.user_id) FROM logs l JOIN user_settings us ON us.user_id = l.user_id WHERE l.user_id IS NOT NULL AND LOWER(us.platform) ILIKE '%android%' AND l.created_at >= date_trunc('day', now()) - interval '6 days') AS android_7d;`

  // Last 2500 logs: only truncated user id + log type id, nothing else, oldest first.
  const recentLogs = await client`
    SELECT user_id AS uid, log_type_id
    FROM (
      SELECT RIGHT(user_id, 10) AS user_id, log_type_id, created_at
      FROM logs
      WHERE user_id IS NOT NULL
      ORDER BY created_at DESC
      LIMIT 2500
    ) t
    ORDER BY t.created_at ASC;`

  // Mapping of log type ids to names.
  const logTypes = await client`
    SELECT id, name FROM log_types ORDER BY id ASC;`

  const c = card[0], d = demoFunnel[0], t = timelineActivity[0], dev = devices[0]
  const vue = entityViews[0]

  const genRate = t?.gen_started > 0 ? Math.round((t.gen_succeeded / t.gen_started) * 1000) / 10 : 0

  const logBlock = recentLogs.map((r: any) => `${r.uid}/${r.log_type_id}`).join(' | ')
  const typeBlock = logTypes.map((r: any) => `${r.id}=${r.name}`).join('\n')

  const dataText = `
Active journal users: ${toNum(c?.aj_users_7d)} (7d), ${toNum(c?.aj_users_30d)} (30d).
Journal entries: ${toNum(c?.entries_7d)} (7d), ${toNum(c?.entries_30d)} (30d).
Chat messages: ${toNum(c?.msgs_7d)} (7d), ${toNum(c?.msgs_30d)} (30d).
Active chat users: ${toNum(c?.chat_users_7d)} (7d), ${toNum(c?.chat_users_30d)} (30d).
Voice entry users: ${toNum(c?.voice_users_7d)} (7d), ${toNum(c?.voice_users_30d)} (30d).
Explore limits reached: ${toNum(c?.limit_events)} events from ${toNum(c?.limit_users)} users (7d).
Category taps: ${toNum(categories[0]?.taps_7d)} (${toNum(categories[0]?.tap_users_7d)} users, 7d).
Full analysis views: ${toNum(vue?.views_7d)} (${toNum(vue?.view_users_7d)} users, 7d).
Timelines: ${toNum(t?.created_7d)} created, ${toNum(t?.opened_7d)} opened, ${toNum(t?.events_viewed_7d)} events viewed, ${toNum(t?.gen_started)} generation attempts (${toNum(t?.gen_succeeded)} succeeded, ${toNum(t?.gen_failed)} failed = ${genRate}% success).
Demo: ${toNum(d?.started)} started, ${toNum(d?.completed)} completed, ${toNum(d?.skipped)} skipped (7d).
Devices (7d): iOS ${toNum(dev?.ios_7d)}, Android ${toNum(dev?.android_7d)}.`

  // Build from the client-side dashboard data is served from its own endpoint; here we
  // mirror the same queries so the numbers shown to the AI match the dashboard cards.
  const requestLogs = recentLogs.length > 0
    ? `\n\nRecent event sequence (oldest->newest, last 2500 events; each entry is "<last 10 chars of user id>/<log type id>"):\n${logBlock}`
    : ''

  const requestTypes = typeBlock
    ? `\n\nLog type id mappings:\n${typeBlock}`
    : ''

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.CLAUDE_API_KEY || "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 800,
        system: "You analyze app usage analytics and return key observations. Be concise and insightful. Focus on aggregate trends, anomalies, and platform-level engagement patterns. Your tone is analytical but engaging, like a sharp data analyst presenting to the product team. PRIVACY: Never reference, speculate about, or quote any individual user's private journal entries, personal themes, or private content. Only ever discuss aggregated, anonymized metrics and product trends. User IDs are truncated and only used to detect cross-feature patterns; never identify or narrate a specific user's activity.",
        messages: [{
          role: "user",
          content: `Here is Elora app analytics for the current week and month (aggregate only, no private content):

${dataText}${requestTypes}${requestLogs}

Return a JSON array of exactly 3-5 interesting observations about this data. Each observation should have: "title" (short, 3-7 words), "emoji" (single relevant emoji), and "body" (2-3 sentences explaining the insight). Only comment on aggregated stats and product trends. Do NOT comment on or reference any individual user's private journal entries, themes, or content. Do NOT wrap in markdown code blocks. Return ONLY valid JSON array.`
        }],
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error("Claude API error:", response.status, errText)
      return { statusCode: 200, body: JSON.stringify({ insights: [], error: `API error: ${response.status}` }) }
    }

    const json: any = await response.json()
    const raw = json.content?.[0]?.text || ""
    let insights: any[] = []
    try {
      const trimmed = raw.trim()
      const parsed = JSON.parse(trimmed.replace(/```json\n?|```/g, ""))
      insights = Array.isArray(parsed) ? parsed : []
    } catch {
      insights = [{ title: "Weekly Digest", emoji: "📊", body: raw.slice(0, 400) }]
    }

    return { statusCode: 200, body: JSON.stringify({ insights }) }
  } catch (err: any) {
    console.error("AI summary fetch error:", err)
    return { statusCode: 200, body: JSON.stringify({ insights: [], error: err.message }) }
  }
}

export { handler }