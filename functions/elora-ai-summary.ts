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
  const activeJournalWeek = await client`
    SELECT COUNT(DISTINCT user_id) AS count FROM journal_entries
    WHERE created_at >= date_trunc('week', now());`

  // Aggregate platform/logging stats only - never any personal entry content.
  const categoryTaps = await client`
    SELECT COUNT(*) AS count FROM logs
    WHERE log_type_id = 714 AND user_id IS NOT NULL
      AND timestamp >= date_trunc('week', now());`
  const entityViews = await client`
    SELECT COUNT(*) AS count FROM logs
    WHERE log_type_id = 727 AND user_id IS NOT NULL
      AND timestamp >= date_trunc('week', now());`
  const timelineOpens = await client`
    SELECT COUNT(*) AS count FROM logs
    WHERE log_type_id = 709 AND user_id IS NOT NULL
      AND timestamp >= date_trunc('week', now());`
  const timelineEvents = await client`
    SELECT COUNT(*) AS count FROM logs
    WHERE log_type_id = 710 AND user_id IS NOT NULL
      AND timestamp >= date_trunc('week', now());`
  const timelineGens = await client`
    SELECT
      (SELECT COUNT(*) FROM logs WHERE log_type_id = 706 AND user_id IS NOT NULL
         AND timestamp >= date_trunc('week', now())) AS started,
      (SELECT COUNT(*) FROM logs WHERE log_type_id = 707 AND user_id IS NOT NULL
         AND timestamp >= date_trunc('week', now())) AS succeeded,
      (SELECT COUNT(*) FROM logs WHERE log_type_id = 708 AND user_id IS NOT NULL
         AND timestamp >= date_trunc('week', now())) AS failed;`
  const demoStarts = await client`
    SELECT
      (SELECT COUNT(DISTINCT user_id) FROM logs WHERE log_type_id = 520 AND user_id IS NOT NULL
         AND timestamp >= date_trunc('week', now())) AS starters,
      (SELECT COUNT(DISTINCT user_id) FROM logs WHERE log_type_id = 522 AND user_id IS NOT NULL
         AND timestamp >= date_trunc('week', now())) AS completions;`
  const exploreLimits = await client`
    SELECT
      (SELECT COUNT(*) FROM logs WHERE log_type_id = 422 AND user_id IS NOT NULL
         AND timestamp >= date_trunc('week', now())) AS events,
      (SELECT COUNT(DISTINCT user_id) FROM logs WHERE log_type_id = 422 AND user_id IS NOT NULL
         AND timestamp >= date_trunc('week', now())) AS users;`

  const data = {
    entries: { week: toNum(entryWeek[0]?.count), month: toNum(entryMonth[0]?.count) },
    activeJournalUsers: toNum(activeJournalWeek[0]?.count),
    chats: { week: toNum(chatWeek[0]?.count), month: toNum(chatMonth[0]?.count) },
    activeChatUsers: { week: toNum(activeWeek[0]?.count), month: toNum(activeMonth[0]?.count) },
    categoryTaps: toNum(categoryTaps[0]?.count),
    entityViews: toNum(entityViews[0]?.count),
    timelineOpens: toNum(timelineOpens[0]?.count),
    timelineEvents: toNum(timelineEvents[0]?.count),
    timelineGens: {
      started: toNum(timelineGens[0]?.started),
      succeeded: toNum(timelineGens[0]?.succeeded),
      failed: toNum(timelineGens[0]?.failed),
    },
    demo: {
      starters: toNum(demoStarts[0]?.starters),
      completions: toNum(demoStarts[0]?.completions),
    },
    exploreLimits: {
      events: toNum(exploreLimits[0]?.events),
      users: toNum(exploreLimits[0]?.users),
    },
  }

  const genRate = data.timelineGens.started > 0
    ? Math.round((data.timelineGens.succeeded / data.timelineGens.started) * 1000) / 10
    : 0
  const demoRate = data.demo.starters > 0
    ? Math.round((data.demo.completions / data.demo.starters) * 1000) / 10
    : 0

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
        system: "You analyze app usage analytics and return key observations. Be concise and insightful. Focus on aggregate trends, anomalies, and platform-level engagement patterns. Your tone is analytical but engaging, like a sharp data analyst presenting to the product team. PRIVACY: Never reference, speculate about, or quote any individual user's private journal entries, personal themes, or private content. Only ever discuss aggregated, anonymized metrics and product trends.",
        messages: [{
          role: "user",
          content: `Here is Elora app analytics data for the current week (aggregate only, no private content):

Journal: ${data.entries.week} entries this week, ${data.entries.month} this month; ${data.activeJournalUsers} active journal users this week.
Explore chat: ${data.chats.week} user messages this week, ${data.chats.month} this month; ${data.activeChatUsers.week} active chat users this week, ${data.activeChatUsers.month} this month.
Insights: ${data.categoryTaps} category taps, ${data.entityViews} full analysis views this week.
Timelines: ${data.timelineOpens} opened, ${data.timelineEvents} events viewed, ${data.timelineGens.started} generation attempts (${data.timelineGens.succeeded} succeeded, ${data.timelineGens.failed} failed) = ${genRate}% success rate.
Onboarding demo: ${data.demo.starters} starters, ${data.demo.completions} completions = ${demoRate}% completion.
Explore limits: ${data.exploreLimits.events} limit-reached events from ${data.exploreLimits.users} users this week.

Return a JSON array of exactly 3-5 interesting observations about this aggregate data. Each observation should have: "title" (short, 3-7 words), "emoji" (single relevant emoji), and "body" (2-3 sentences explaining the insight). Only comment on aggregated stats and product trends. Do NOT comment on or reference any individual user's private journal entries, themes, or content. Do NOT wrap in markdown code blocks. Return ONLY valid JSON array.`
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