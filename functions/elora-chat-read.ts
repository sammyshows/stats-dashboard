import { Handler } from "@netlify/functions";
const client = require("../database/elora-client.ts")

const handler: Handler = async (event, context) => {
  if (!event.body) return { statusCode: 400, body: 'invalid request, you are missing the parameter body' }
  const { chatId } = JSON.parse(event.body)

  if (!chatId) return { statusCode: 400, body: 'missing chatId' }

  const chatRows = await client`
    SELECT c.explore_chat_id AS id, c.title, c.created_at
    FROM explore_chats c
    WHERE c.explore_chat_id = ${chatId}
    LIMIT 1;`

  const messageRows = await client`
    SELECT m.explore_chat_message_id AS id, m.role, m.content, m.created_at, m.deleted, m.hidden, m.compacted
    FROM explore_chat_messages m
    WHERE m.explore_chat_id = ${chatId}
    ORDER BY m.created_at ASC;`

  return {
    body: JSON.stringify({
      chat: chatRows[0] ? {
        id: chatRows[0].id,
        title: chatRows[0].title ?? 'Untitled chat',
        created_at: chatRows[0].created_at,
      } : null,
      messages: messageRows.map((m: any) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        created_at: m.created_at,
        deleted: Boolean(m.deleted),
        hidden: Boolean(m.hidden),
        compacted: Boolean(m.compacted),
      })),
    }),
    statusCode: 200
  }
}

export { handler }