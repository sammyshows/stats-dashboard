import { Handler } from "@netlify/functions";
const client = require("../database/client.ts");

const handler: Handler = async (event, context) => {
  let users;
  let ads;
  let levelsMostAds;
  let levelsDifficult;
  let levelsEasy;
  let levelProgress;

  // Query 1: Active Users / New Users
  const userStats = async () => await client`
    SELECT
      COUNT(DISTINCT CASE WHEN updated_at > (NOW() - INTERVAL '1 DAY') THEN user_id END) AS users_active_1_day,
      COUNT(DISTINCT CASE WHEN updated_at > (NOW() - INTERVAL '7 DAY') THEN user_id END) AS users_active_7_days,
      COUNT(DISTINCT CASE WHEN updated_at > (NOW() - INTERVAL '28 DAY') THEN user_id END) AS users_active_28_days,
      COUNT(DISTINCT CASE WHEN created_at > (NOW() - INTERVAL '1 DAY') THEN user_id END) AS users_new_1_day,
      COUNT(DISTINCT CASE WHEN created_at > (NOW() - INTERVAL '7 DAY') THEN user_id END) AS users_new_7_days,
      COUNT(DISTINCT CASE WHEN created_at > (NOW() - INTERVAL '28 DAY') THEN user_id END) AS users_new_28_days,
      COUNT(DISTINCT CASE WHEN lus.platform = 'android' THEN user_id END) AS android_users,
      COUNT(DISTINCT CASE WHEN lus.platform = 'ios' THEN user_id END) AS ios_users
    FROM
      letterlock_user_stats lus
    WHERE lus.test_user IS NOT TRUE;
  `;

  // Query 2: Ads watched totals / Ad Averages
  const adsWatchedStats = async () => await client`
    SELECT
      COUNT(*) FILTER (WHERE ad_type = 'additionalLife') AS ads_lives,
      COUNT(*) FILTER (WHERE ad_type = 'additionalMoves') AS ads_moves,
      ROUND(COUNT(*) FILTER (WHERE ad_type = 'additionalLife') / NULLIF(COUNT(DISTINCT law.user_id::uuid), 0)::numeric, 2) AS ads_lives_average,
      ROUND(COUNT(*) FILTER (WHERE ad_type = 'additionalMoves') / NULLIF(COUNT(DISTINCT law.user_id::uuid), 0)::numeric, 2) AS ads_moves_average,
      ROUND(SUM(CASE WHEN ad_type = 'additionalMoves' THEN law.streak ELSE 0 END) / NULLIF(COUNT(*) FILTER (WHERE ad_type = 'additionalMoves'), 0)::numeric, 2) AS ads_streak_average,
      COUNT(*) FILTER (WHERE created_at > (NOW() AT TIME ZONE 'Australia/Melbourne' - INTERVAL '1 DAY')) AS ads_1_day,
      COUNT(*) FILTER (WHERE created_at > (NOW() AT TIME ZONE 'Australia/Melbourne' - INTERVAL '7 DAY')) AS ads_7_days,
      COUNT(*) FILTER (WHERE created_at > (NOW() AT TIME ZONE 'Australia/Melbourne' - INTERVAL '28 DAY')) AS ads_28_days
    FROM letterlock_ads_watched law
    WHERE law.user_id::uuid IN (SELECT user_id FROM letterlock_user_stats WHERE test_user IS NOT TRUE);
  `;

  // Query 3: Levels with most Ads Watched
  const levelsMostAdsStats = async () => await client`
    SELECT current_level_id AS level, COUNT(*) AS ads_watched
    FROM letterlock_ads_watched
    WHERE user_id::uuid IN (SELECT user_id FROM letterlock_user_stats WHERE test_user IS NOT TRUE)
    GROUP BY current_level_id
    ORDER BY ads_watched DESC
    LIMIT 10;
  `;

  // Query 4: Most Difficult Levels
  const levelsDifficultStats = async () => await client`
    SELECT key AS level,
      ROUND(SUM((value->>'attemptTally')::int - (value->>'successTally')::int) / COUNT(key)::numeric, 2) AS failed_per_user
    FROM letterlock_user_stats, jsonb_each(CAST(level_history AS jsonb))
    WHERE letterlock_user_stats.test_user IS NOT TRUE
    GROUP BY key
    HAVING SUM((value->>'attemptTally')::int) > 10
    ORDER BY failed_per_user DESC
    LIMIT 10;
  `;

  // Query 5: Most Easy Levels
  const levelsEasyStats = async () => await client`
    SELECT key AS level,
      ROUND(SUM((value->>'attemptTally')::int - (value->>'successTally')::int) / COUNT(key)::numeric, 2) AS failed_per_user
    FROM letterlock_user_stats, jsonb_each(CAST(level_history AS jsonb))
    WHERE letterlock_user_stats.test_user IS NOT TRUE
    GROUP BY key
    HAVING SUM((value->>'attemptTally')::int) > 10
    ORDER BY failed_per_user ASC
    LIMIT 10;
  `;

  // Query 6: Level attempts and successes
  const levelProgressStats = async () => await client`
    SELECT
      COUNT(*) FILTER (WHERE log_type = 1 AND created_at > (NOW() - INTERVAL '1 DAY')) AS level_attempts_1_day,
      COUNT(*) FILTER (WHERE log_type = 1 AND created_at > (NOW() - INTERVAL '7 DAY')) AS level_attempts_7_days,
      COUNT(*) FILTER (WHERE log_type = 1 AND created_at > (NOW() - INTERVAL '28 DAY')) AS level_attempts_28_days,
      COUNT(*) FILTER (WHERE log_type = 2 AND created_at > (NOW() - INTERVAL '1 DAY')) AS level_successes_1_day,
      COUNT(*) FILTER (WHERE log_type = 2 AND created_at > (NOW() - INTERVAL '7 DAY')) AS level_successes_7_days,
      COUNT(*) FILTER (WHERE log_type = 2 AND created_at > (NOW() - INTERVAL '28 DAY')) AS level_successes_28_days
    FROM letterlock_logs
    WHERE user_id::uuid IN (SELECT user_id FROM letterlock_user_stats WHERE test_user IS NOT TRUE);
  `;

  // Execute the queries
  await Promise.all([
    userStats(),
    adsWatchedStats(),
    levelsMostAdsStats(),
    levelsDifficultStats(),
    levelsEasyStats(),
    levelProgressStats()
  ]).then((values) => {
    // Process the results
    users = values[0];
    ads = values[1];
    levelsMostAds = values[2];
    levelsDifficult = values[3];
    levelsEasy = values[4];
    levelProgress = values[5];
  });

  return {
    body: JSON.stringify({
      users: users[0],
      ads: ads[0],
      levelsMostAds,
      levelsDifficult,
      levelsEasy,
      levelProgress: levelProgress[0]
    }),
    statusCode: 200
  };
};

export { handler };
