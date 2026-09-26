import { Handler } from "@netlify/functions";
const client = require("../database/client.ts")

const handler: Handler = async (event, context) => {

  const users = await client`
    SELECT 
      lus.user_id,
      test_user,
      -- level_history always contains an initial (unplayed) current-level entry,
      -- so completed = total keys minus that one (matches leaderboard logic).
      (SELECT COUNT(*) FROM jsonb_object_keys(CAST(level_history AS jsonb))) - 1 AS levels_completed_count,
      ads_watched_for_lives AS ads_watched_lives,
      ads_watched_for_moves AS ads_watched_moves,
      device_os,
      device_model,
      username,
      letterlock_version AS letterlock_version,
      lus.updated_at AS updated_at,
      lus.created_at AS created_at,
      COUNT(*) FILTER (WHERE log_type = 1 AND ll.created_at > (NOW() - INTERVAL '1 DAY')) AS level_attempts_1_day,
      COUNT(*) FILTER (WHERE log_type = 1 AND ll.created_at > (NOW() - INTERVAL '7 DAY')) AS level_attempts_7_days,
      COUNT(*) FILTER (WHERE log_type = 1 AND ll.created_at > (NOW() - INTERVAL '30 DAY')) AS level_attempts_30_days,
      COUNT(*) FILTER (WHERE log_type = 2 AND ll.created_at > (NOW() - INTERVAL '1 DAY')) AS level_successes_1_day,
      COUNT(*) FILTER (WHERE log_type = 2 AND ll.created_at > (NOW() - INTERVAL '7 DAY')) AS level_successes_7_days,
      COUNT(*) FILTER (WHERE log_type = 2 AND ll.created_at > (NOW() - INTERVAL '30 DAY')) AS level_successes_30_days
    FROM letterlock_user_stats AS lus
    INNER JOIN letterlock_settings AS ls ON ls.user_id = lus.user_id
    LEFT JOIN letterlock_logs AS ll ON ll.user_id = lus.user_id
    WHERE lus.device_model IS NOT NULL
    GROUP BY lus.user_id, lus.test_user, lus.device_os, lus.device_model, ls.username, lus.letterlock_version, lus.updated_at, lus.created_at, lus.ads_watched_for_lives, lus.ads_watched_for_moves, lus.zero_lives_tally, lus.level_history
    ORDER BY lus.created_at DESC;`

  return {
    // headers: {
    //   'Access-Control-Allow-Origin': 'https://www.admin.stockwise.app',
    // },
    body: JSON.stringify({
      users: users
    }),
    statusCode: 200
  }
}

export { handler }
