import { Handler } from "@netlify/functions";
const client = require("../database/elora-client.ts")

const toNum = (v: any): number => Number(v ?? 0)

const handler: Handler = async (event, context) => {
  const entryWeek = await client`
    SELECT COUNT(*) AS count FROM journal_entries
    WHERE created_at >= date_trunc('week', now());`
  const entryMonth = await client`
    SELECT COUNT(*) AS count FROM journal_entries
    WHERE created_at >= date_trunc('month', now());`
  const chatWeek = await client`
    SELECT COUNT(*) AS count FROM explore_chat_messages
    WHERE role = 'user' AND deleted = false AND hidden = false AND compacted = false
    AND created_at >= date_trunc('week', now());`
  const chatMonth = await client`
    SELECT COUNT(*) AS count FROM explore_chat_messages
    WHERE role = 'user' AND deleted = false AND hidden = false AND compacted = false
    AND created_at >= date_trunc('month', now());`
  const activeWeek = await client`
    SELECT COUNT(DISTINCT c.user_id) AS count
    FROM explore_chat_messages m INNER JOIN explore_chats c ON c.explore_chat_id = m.explore_chat_id
    WHERE m.role = 'user' AND m.deleted = false AND m.hidden = false AND m.compacted = false
    AND c.deleted = false AND m.created_at >= date_trunc('week', now());`
  const activeMonth = await client`
    SELECT COUNT(DISTINCT c.user_id) AS count
    FROM explore_chat_messages m INNER JOIN explore_chats c ON c.explore_chat_id = m.explore_chat_id
    WHERE m.role = 'user' AND m.deleted = false AND m.hidden = false AND m.compacted = false
    AND c.deleted = false AND m.created_at >= date_trunc('month', now());`
  const totalUsers = await client`
    SELECT COUNT(DISTINCT user_id) AS count FROM journal_entries;`
  const recentThemes = await client`
    SELECT title, emoji, ai_summary
    FROM journal_entries
    WHERE title IS NOT NULL AND title <> '' AND emoji IS NOT NULL
    ORDER BY created_at DESC LIMIT 15;`
  const topEntryUsers = await client`
    SELECT user_id, COUNT(*) AS total
    FROM journal_entries WHERE created_at >= date_trunc('week', now())
    GROUP BY user_id ORDER BY total DESC LIMIT 5;`
  const latestTimelines = await client`
    SELECT timeline->>'theme' AS theme, timeline->>'briefSummary' AS summary
    FROM timelines
    WHERE deleted = false AND timeline->>'theme' IS NOT NULL
    ORDER BY created_at DESC LIMIT 5;`

  const data = {
    entries: { week: toNum(entryWeek[0]?.count), month: toNum(entryMonth[0]?.count) },
    chats: { week: toNum(chatWeek[0]?.count), month: toNum(chatMonth[0]?.count) },
    activeUsers: { week: toNum(activeWeek[0]?.count), month: toNum(activeMonth[0]?.count) },
    totalUsers: toNum(totalUsers[0]?.count),
    recentThemes: recentThemes.map((t: any) => ({ title: t.title, emoji: t.emoji, summary: t.ai_summary })),
    topEntryUsers: topEntryUsers.map((u: any) => ({ user_id: u.user_id, entries: toNum(u.total) })),
    timelines: latestTimelines.map((t: any) => ({ theme: t.theme, summary: t.summary })),
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.CLAUDE_API_KEY || "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 800,
        system: "You analyze app usage data and return key observations. Be concise and insightful. Focus on interesting trends, anomalies, and user behavior patterns. Your tone is analytical but engaging, like a sharp data analyst presenting to the product team.",
        messages: [{
          role: "user",
          content: `Here is Elora app dashboard data for the current period:

Journal entries: ${data.entries.week} this week, ${data.entries.month} this month.
User chat messages: ${data.chats.week} this week, ${data.chats.month} this month.
Active chat users: ${data.activeUsers.week} this week, ${data.activeUsers.month} this month.
Total users with entries: ${data.totalUsers}.

Recent entry themes: ${data.recentThemes.map((t: any) => `${t.emoji} ${t.title}`).join('; ') || 'none'}.

Top entry creators this week: ${data.topEntryUsers.map((u: any) => `User ${u.user_id.slice(0, 8)}... (${u.entries} entries)`).join(', ') || 'none'}.

Recent timeline themes: ${data.timelines.map((t: any) => t.theme).join(', ') || 'none'}.

Return a JSON array of exactly 3-5 interesting observations about this data. Each observation should have: "title" (short, 3-7 words), "emoji" (single relevant emoji), and "body" (2-3 sentences explaining the insight). Do NOT wrap in markdown code blocks. Return ONLY valid JSON array.`
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