import { Handler } from "@netlify/functions";
const client = require("../database/elora-client.ts")

const handler: Handler = async (event, context) => {
  if (!event.body) return { statusCode: 400 }
  const { userId, emoji } = JSON.parse(event.body)

  const existing = await client`
    SELECT user_settings_id FROM user_settings WHERE user_id = ${userId} LIMIT 1;`

  if (existing.length) {
    await client`
      UPDATE user_settings SET id_emoji = ${emoji}, updated_at = now()
      WHERE user_settings_id = ${existing[0].user_settings_id};`
  } else {
    await client`
      INSERT INTO user_settings (user_id, id_emoji) VALUES (${userId}, ${emoji});`
  }

  return { statusCode: 200, body: JSON.stringify({ ok: true }) }
}

export { handler }