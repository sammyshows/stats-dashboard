import { Handler } from "@netlify/functions";
const client = require("../database/elora-client.ts")

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
    }),
    statusCode: 200
  }
}

export { handler }