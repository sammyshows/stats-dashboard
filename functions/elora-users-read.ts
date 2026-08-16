import { Handler } from "@netlify/functions";
const client = require("../database/elora-client.ts")

const handler: Handler = async (event, context) => {
  const page = Math.max(1, parseInt(event.queryStringParameters?.page || '1', 10))
  const limit = 25
  const offset = (page - 1) * limit

  const totalRows = await client`
    SELECT COUNT(DISTINCT user_id) AS total
    FROM journal_entries;`

  const users = await client`
    SELECT je.user_id,
           us.id_emoji AS emoji,
           MAX(je.created_at) AS latest_created_at,
           COUNT(*) AS total_entry_count
    FROM journal_entries je
    LEFT JOIN user_settings us ON us.user_id = je.user_id
    GROUP BY je.user_id, us.id_emoji
    ORDER BY latest_created_at DESC
    LIMIT ${limit} OFFSET ${offset};`

  const total = Number(totalRows[0]?.total ?? 0)

  return {
    body: JSON.stringify({
      users: users.map((u: any) => ({
        user_id: u.user_id,
        emoji: u.emoji ?? null,
        latest_created_at: u.latest_created_at,
        total_entry_count: Number(u.total_entry_count ?? 0),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }),
    statusCode: 200
  }
}

export { handler }
