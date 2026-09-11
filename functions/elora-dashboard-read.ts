import { Handler } from "@netlify/functions";
const rawClient = require("../database/elora-client.ts")

// ---- Performance instrumentation: times every SQL query run by this handler ----
const queryTimings: { seq: number; ms: number }[] = []
let querySeq = 0

const client = new Proxy(rawClient, {
  apply(target: any, thisArg: any, args: any[]) {
    const start = Date.now()
    const result = target(...args)
    const seq = ++querySeq
    result.then(() => queryTimings.push({ seq, ms: Date.now() - start }))
    return result
  },
})
// --------------------------------------------------------------------------------

const toNum = (v: any): number => Number(v ?? 0)
const pctChange = (current: number, prior: number): number => {
  if (prior === 0) return current > 0 ? 100 : 0
  return Math.round(((current - prior) / prior) * 1000) / 10
}

const build = (current: any, prior: any, daily: number[], dayOffset: number) => {
  const c = toNum(current); const p = toNum(prior)
  const total = daily.length
  const currentSlice = daily.slice(total - dayOffset)
  const priorSlice = daily.slice(total - dayOffset * 2, total - dayOffset)
  return { count: c, prior: p, pct: pctChange(c, p), series: { current: currentSlice, prior: priorSlice } }
}

const dailySeries = async (query: ReturnType<typeof client>) => {
  const rows: any[] = await query
  return rows.map((r: any) => toNum(r.count))
}

const handler: Handler = async (event, context) => {
  const handlerStart = Date.now()

  // ---- All queries are independent: fire them concurrently ----
  const settled = await Promise.allSettled([
    client`
      SELECT je.user_id,
             us.id_emoji AS emoji,
             MAX(je.created_at) AS latest_created_at,
             COUNT(*) AS total_entry_count
      FROM journal_entries je
      LEFT JOIN user_settings us ON us.user_id = je.user_id
      GROUP BY je.user_id, us.id_emoji
      ORDER BY latest_created_at DESC
      LIMIT 10;`,

    client`
      SELECT
        (SELECT COUNT(DISTINCT user_id) FROM journal_entries
         WHERE created_at >= date_trunc('day', now()) - interval '6 days') AS this_week,
        (SELECT COUNT(DISTINCT user_id) FROM journal_entries
         WHERE created_at >= date_trunc('day', now()) - interval '13 days'
           AND created_at < date_trunc('day', now()) - interval '6 days') AS prior_week,
        (SELECT COUNT(DISTINCT user_id) FROM journal_entries
         WHERE created_at >= date_trunc('day', now()) - interval '29 days') AS this_month,
        (SELECT COUNT(DISTINCT user_id) FROM journal_entries
         WHERE created_at >= date_trunc('day', now()) - interval '59 days'
           AND created_at < date_trunc('day', now()) - interval '29 days') AS prior_month;`,

    dailySeries(client`
      WITH days AS (
        SELECT generate_series(date_trunc('day', now()) - interval '59 days', date_trunc('day', now()), interval '1 day')::date AS day
      ), daily AS (
        SELECT created_at::date AS day, COUNT(DISTINCT user_id)::int AS count
        FROM journal_entries WHERE created_at >= date_trunc('day', now()) - interval '59 days' GROUP BY created_at::date
      )
      SELECT d.day, COALESCE(daily.count, 0)::int AS count FROM days d LEFT JOIN daily ON daily.day = d.day ORDER BY d.day;`),

    client`
      SELECT DISTINCT je.user_id, us.id_emoji AS emoji
      FROM journal_entries je
      LEFT JOIN user_settings us ON us.user_id = je.user_id
      WHERE je.created_at >= date_trunc('day', now()) - interval '6 days'
      ORDER BY je.user_id;`,

    client`
      SELECT
        (SELECT COUNT(*) FROM journal_entries
         WHERE created_at >= date_trunc('day', now()) - interval '6 days') AS this_week,
        (SELECT COUNT(*) FROM journal_entries
         WHERE created_at >= date_trunc('day', now()) - interval '13 days'
           AND created_at < date_trunc('day', now()) - interval '6 days') AS prior_week,
        (SELECT COUNT(*) FROM journal_entries
         WHERE created_at >= date_trunc('day', now()) - interval '29 days') AS this_month,
        (SELECT COUNT(*) FROM journal_entries
         WHERE created_at >= date_trunc('day', now()) - interval '59 days'
           AND created_at < date_trunc('day', now()) - interval '29 days') AS prior_month;`,

    dailySeries(client`
      WITH days AS (
        SELECT generate_series(date_trunc('day', now()) - interval '59 days', date_trunc('day', now()), interval '1 day')::date AS day
      ), daily AS (
        SELECT created_at::date AS day, COUNT(*)::int AS count
        FROM journal_entries WHERE created_at >= date_trunc('day', now()) - interval '59 days'
        GROUP BY created_at::date
      )
      SELECT d.day, COALESCE(daily.count, 0)::int AS count FROM days d LEFT JOIN daily ON daily.day = d.day ORDER BY d.day;`),

    client`
      SELECT je.user_id, us.id_emoji AS emoji, COUNT(*)::int AS entry_count
      FROM journal_entries je
      LEFT JOIN user_settings us ON us.user_id = je.user_id
      WHERE je.created_at >= date_trunc('day', now()) - interval '6 days'
      GROUP BY je.user_id, us.id_emoji
      ORDER BY entry_count DESC;`,

    // Voice/transcription users (ai_logs type 1) who ALSO wrote ≥1 entry in the same window.
    client`
      SELECT
        (SELECT COUNT(DISTINCT v.user_id) FROM ai_logs v
         WHERE v.log_type_id = 1
           AND v.created_at >= date_trunc('day', now()) - interval '6 days'
           AND EXISTS (SELECT 1 FROM journal_entries je
                       WHERE je.user_id = v.user_id
                         AND je.created_at >= date_trunc('day', now()) - interval '6 days')) AS this_week,
        (SELECT COUNT(DISTINCT v.user_id) FROM ai_logs v
         WHERE v.log_type_id = 1
           AND v.created_at >= date_trunc('day', now()) - interval '13 days'
           AND v.created_at < date_trunc('day', now()) - interval '6 days'
           AND EXISTS (SELECT 1 FROM journal_entries je
                       WHERE je.user_id = v.user_id
                         AND je.created_at >= date_trunc('day', now()) - interval '13 days'
                           AND je.created_at < date_trunc('day', now()) - interval '6 days')) AS prior_week,
        (SELECT COUNT(DISTINCT v.user_id) FROM ai_logs v
         WHERE v.log_type_id = 1
           AND v.created_at >= date_trunc('day', now()) - interval '29 days'
           AND EXISTS (SELECT 1 FROM journal_entries je
                       WHERE je.user_id = v.user_id
                         AND je.created_at >= date_trunc('day', now()) - interval '29 days')) AS this_month,
        (SELECT COUNT(DISTINCT v.user_id) FROM ai_logs v
         WHERE v.log_type_id = 1
           AND v.created_at >= date_trunc('day', now()) - interval '59 days'
           AND v.created_at < date_trunc('day', now()) - interval '29 days'
           AND EXISTS (SELECT 1 FROM journal_entries je
                       WHERE je.user_id = v.user_id
                         AND je.created_at >= date_trunc('day', now()) - interval '59 days'
                           AND je.created_at < date_trunc('day', now()) - interval '29 days')) AS prior_month;`,

    dailySeries(client`
      WITH days AS (
        SELECT generate_series(date_trunc('day', now()) - interval '59 days', date_trunc('day', now()), interval '1 day')::date AS day
      ), daily AS (
        SELECT v.day, COUNT(DISTINCT v.user_id)::int AS count FROM (
          SELECT DISTINCT date_trunc('day', v.created_at)::date AS day, v.user_id
          FROM ai_logs v
          WHERE v.log_type_id = 1
            AND v.created_at >= date_trunc('day', now()) - interval '59 days'
            AND EXISTS (SELECT 1 FROM journal_entries je
                        WHERE je.user_id = v.user_id
                          AND date_trunc('day', je.created_at)::date = date_trunc('day', v.created_at)::date)
        ) v GROUP BY v.day
      )
      SELECT d.day, COALESCE(daily.count, 0)::int AS count FROM days d LEFT JOIN daily ON daily.day = d.day ORDER BY d.day;`),

    client`
      SELECT DISTINCT v.user_id, us.id_emoji AS emoji
      FROM ai_logs v
      LEFT JOIN user_settings us ON us.user_id = v.user_id
      WHERE v.log_type_id = 1
        AND v.created_at >= date_trunc('day', now()) - interval '6 days'
        AND EXISTS (SELECT 1 FROM journal_entries je
                    WHERE je.user_id = v.user_id
                      AND je.created_at >= date_trunc('day', now()) - interval '6 days')
      ORDER BY v.user_id;`,

    client`
      SELECT
        (SELECT COUNT(DISTINCT c.user_id) FROM explore_chat_messages m
         INNER JOIN explore_chats c ON c.explore_chat_id = m.explore_chat_id
         WHERE m.role = 'user' AND m.deleted = false AND m.hidden = false AND m.compacted = false AND c.deleted = false
           AND m.created_at >= date_trunc('day', now()) - interval '6 days') AS this_week,
        (SELECT COUNT(DISTINCT c.user_id) FROM explore_chat_messages m
         INNER JOIN explore_chats c ON c.explore_chat_id = m.explore_chat_id
         WHERE m.role = 'user' AND m.deleted = false AND m.hidden = false AND m.compacted = false AND c.deleted = false
           AND m.created_at >= date_trunc('day', now()) - interval '13 days'
           AND m.created_at < date_trunc('day', now()) - interval '6 days') AS prior_week,
        (SELECT COUNT(DISTINCT c.user_id) FROM explore_chat_messages m
         INNER JOIN explore_chats c ON c.explore_chat_id = m.explore_chat_id
         WHERE m.role = 'user' AND m.deleted = false AND m.hidden = false AND m.compacted = false AND c.deleted = false
           AND m.created_at >= date_trunc('day', now()) - interval '29 days') AS this_month,
        (SELECT COUNT(DISTINCT c.user_id) FROM explore_chat_messages m
         INNER JOIN explore_chats c ON c.explore_chat_id = m.explore_chat_id
         WHERE m.role = 'user' AND m.deleted = false AND m.hidden = false AND m.compacted = false AND c.deleted = false
           AND m.created_at >= date_trunc('day', now()) - interval '59 days'
           AND m.created_at < date_trunc('day', now()) - interval '29 days') AS prior_month;`,

    dailySeries(client`
      WITH days AS (
        SELECT generate_series(date_trunc('day', now()) - interval '59 days', date_trunc('day', now()), interval '1 day')::date AS day
      ), daily AS (
        SELECT m.created_at::date AS day, COUNT(DISTINCT c.user_id)::int AS count
        FROM explore_chat_messages m INNER JOIN explore_chats c ON c.explore_chat_id = m.explore_chat_id
        WHERE m.role = 'user' AND m.deleted = false AND m.hidden = false AND m.compacted = false AND c.deleted = false
          AND m.created_at >= date_trunc('day', now()) - interval '59 days' GROUP BY m.created_at::date
      )
      SELECT d.day, COALESCE(daily.count, 0)::int AS count FROM days d LEFT JOIN daily ON daily.day = d.day ORDER BY d.day;`),

    client`
      SELECT c.user_id, us.id_emoji AS emoji, COUNT(*)::int AS message_count
      FROM explore_chat_messages m
      INNER JOIN explore_chats c ON c.explore_chat_id = m.explore_chat_id
      LEFT JOIN user_settings us ON us.user_id = c.user_id
      WHERE m.role = 'user' AND m.deleted = false AND m.hidden = false AND m.compacted = false
        AND c.deleted = false AND c.user_id IS NOT NULL
        AND m.created_at >= date_trunc('day', now()) - interval '6 days'
      GROUP BY c.user_id, us.id_emoji
      ORDER BY c.user_id;`,

    dailySeries(client`
      WITH days AS (
        SELECT generate_series(date_trunc('day', now()) - interval '59 days', date_trunc('day', now()), interval '1 day')::date AS day
      ), daily AS (
        SELECT created_at::date AS day, COUNT(*)::int AS count FROM explore_chat_messages
        WHERE role = 'user' AND deleted = false AND hidden = false AND compacted = false
          AND created_at >= date_trunc('day', now()) - interval '59 days' GROUP BY created_at::date
      )
      SELECT d.day, COALESCE(daily.count, 0)::int AS count FROM days d LEFT JOIN daily ON daily.day = d.day ORDER BY d.day;`),

    client`
      SELECT title, emoji, ai_summary, TO_CHAR(created_at, 'DD/MM/YYYY') AS created_date
      FROM journal_entries
      WHERE title IS NOT NULL AND title <> '' AND emoji IS NOT NULL AND created_at >= now() - interval '7 days'
      ORDER BY created_at DESC LIMIT 8;`,

    client`
      SELECT
        (SELECT COUNT(DISTINCT user_id) FROM logs
         WHERE log_type_id = 714 AND user_id IS NOT NULL
           AND timestamp >= date_trunc('day', now()) - interval '6 days') AS this_week,
        (SELECT COUNT(DISTINCT user_id) FROM logs
         WHERE log_type_id = 714 AND user_id IS NOT NULL
           AND timestamp >= date_trunc('day', now()) - interval '13 days'
           AND timestamp < date_trunc('day', now()) - interval '6 days') AS prior_week;`,

    dailySeries(client`
      WITH days AS (
        SELECT generate_series(date_trunc('day', now()) - interval '13 days', date_trunc('day', now()), interval '1 day')::date AS day
      ), daily AS (
        SELECT timestamp::date AS day, COUNT(DISTINCT user_id)::int AS count
        FROM logs WHERE log_type_id = 714 AND user_id IS NOT NULL
          AND timestamp >= date_trunc('day', now()) - interval '13 days'
        GROUP BY timestamp::date
      )
      SELECT d.day, COALESCE(daily.count, 0)::int AS count FROM days d LEFT JOIN daily ON daily.day = d.day ORDER BY d.day;`),

    client`
      SELECT SPLIT_PART(notes, '|', 1) AS category_key,
             COUNT(*) FILTER (WHERE timestamp >= date_trunc('day', now()) - interval '6 days') AS this_week,
             COUNT(*) FILTER (WHERE timestamp >= date_trunc('day', now()) - interval '13 days'
                              AND timestamp < date_trunc('day', now()) - interval '6 days') AS prior_week
      FROM logs
      WHERE log_type_id = 714 AND user_id IS NOT NULL
        AND timestamp >= date_trunc('day', now()) - interval '13 days'
      GROUP BY 1;`,

    client`
      SELECT
        (SELECT COUNT(*) FROM logs WHERE log_type_id = 727 AND user_id IS NOT NULL
           AND timestamp >= date_trunc('day', now()) - interval '6 days') AS views_week,
        (SELECT COUNT(*) FROM logs WHERE log_type_id = 727 AND user_id IS NOT NULL
           AND timestamp >= date_trunc('day', now()) - interval '13 days'
           AND timestamp < date_trunc('day', now()) - interval '6 days') AS views_prior,
        (SELECT COUNT(DISTINCT user_id) FROM logs WHERE log_type_id = 727 AND user_id IS NOT NULL
           AND timestamp >= date_trunc('day', now()) - interval '6 days') AS users_week,
        (SELECT COUNT(DISTINCT user_id) FROM logs WHERE log_type_id = 727 AND user_id IS NOT NULL
           AND timestamp >= date_trunc('day', now()) - interval '13 days'
           AND timestamp < date_trunc('day', now()) - interval '6 days') AS users_prior;`,

    dailySeries(client`
      WITH days AS (
        SELECT generate_series(date_trunc('day', now()) - interval '13 days', date_trunc('day', now()), interval '1 day')::date AS day
      ), daily AS (
        SELECT timestamp::date AS day, COUNT(*)::int AS count
        FROM logs WHERE log_type_id = 727 AND user_id IS NOT NULL
          AND timestamp >= date_trunc('day', now()) - interval '13 days'
        GROUP BY timestamp::date
      )
      SELECT d.day, COALESCE(daily.count, 0)::int AS count FROM days d LEFT JOIN daily ON daily.day = d.day ORDER BY d.day;`),

    dailySeries(client`
      WITH days AS (
        SELECT generate_series(date_trunc('day', now()) - interval '13 days', date_trunc('day', now()), interval '1 day')::date AS day
      ), daily AS (
        SELECT timestamp::date AS day, COUNT(DISTINCT user_id)::int AS count
        FROM logs WHERE log_type_id = 727 AND user_id IS NOT NULL
          AND timestamp >= date_trunc('day', now()) - interval '13 days'
        GROUP BY timestamp::date
      )
      SELECT d.day, COALESCE(daily.count, 0)::int AS count FROM days d LEFT JOIN daily ON daily.day = d.day ORDER BY d.day;`),

    client`
      SELECT
        (SELECT COUNT(*) FROM logs WHERE log_type_id = 422 AND user_id IS NOT NULL
           AND timestamp >= date_trunc('day', now()) - interval '6 days') AS events_week,
        (SELECT COUNT(*) FROM logs WHERE log_type_id = 422 AND user_id IS NOT NULL
           AND timestamp >= date_trunc('day', now()) - interval '13 days'
           AND timestamp < date_trunc('day', now()) - interval '6 days') AS events_prior,
        (SELECT COUNT(DISTINCT user_id) FROM logs WHERE log_type_id = 422 AND user_id IS NOT NULL
           AND timestamp >= date_trunc('day', now()) - interval '6 days') AS users_week,
        (SELECT COUNT(DISTINCT user_id) FROM logs WHERE log_type_id = 422 AND user_id IS NOT NULL
           AND timestamp >= date_trunc('day', now()) - interval '13 days'
           AND timestamp < date_trunc('day', now()) - interval '6 days') AS users_prior;`,

    dailySeries(client`
      WITH days AS (
        SELECT generate_series(date_trunc('day', now()) - interval '13 days', date_trunc('day', now()), interval '1 day')::date AS day
      ), daily AS (
        SELECT timestamp::date AS day, COUNT(*)::int AS count
        FROM logs WHERE log_type_id = 422 AND user_id IS NOT NULL
          AND timestamp >= date_trunc('day', now()) - interval '13 days'
        GROUP BY timestamp::date
      )
      SELECT d.day, COALESCE(daily.count, 0)::int AS count FROM days d LEFT JOIN daily ON daily.day = d.day ORDER BY d.day;`),

    dailySeries(client`
      WITH days AS (
        SELECT generate_series(date_trunc('day', now()) - interval '13 days', date_trunc('day', now()), interval '1 day')::date AS day
      ), daily AS (
        SELECT timestamp::date AS day, COUNT(DISTINCT user_id)::int AS count
        FROM logs WHERE log_type_id = 422 AND user_id IS NOT NULL
          AND timestamp >= date_trunc('day', now()) - interval '13 days'
        GROUP BY timestamp::date
      )
      SELECT d.day, COALESCE(daily.count, 0)::int AS count FROM days d LEFT JOIN daily ON daily.day = d.day ORDER BY d.day;`),

    client`
      SELECT
        (SELECT COUNT(DISTINCT user_id) FROM logs WHERE log_type_id = 520 AND user_id IS NOT NULL
           AND timestamp >= date_trunc('day', now()) - interval '6 days') AS this_week,
        (SELECT COUNT(DISTINCT user_id) FROM logs WHERE log_type_id = 520 AND user_id IS NOT NULL
           AND timestamp >= date_trunc('day', now()) - interval '13 days'
           AND timestamp < date_trunc('day', now()) - interval '6 days') AS prior_week;`,

    client`
      SELECT DISTINCT l.user_id, us.id_emoji AS emoji
      FROM logs l LEFT JOIN user_settings us ON us.user_id = l.user_id
      WHERE l.log_type_id = 714 AND l.user_id IS NOT NULL
        AND l.timestamp >= date_trunc('day', now()) - interval '6 days'
      ORDER BY l.user_id;`,

    client`
      SELECT DISTINCT l.user_id, us.id_emoji AS emoji
      FROM logs l LEFT JOIN user_settings us ON us.user_id = l.user_id
      WHERE l.log_type_id = 727 AND l.user_id IS NOT NULL
        AND l.timestamp >= date_trunc('day', now()) - interval '6 days'
      ORDER BY l.user_id;`,

    client`
      SELECT DISTINCT l.user_id, us.id_emoji AS emoji
      FROM logs l LEFT JOIN user_settings us ON us.user_id = l.user_id
      WHERE l.log_type_id = 422 AND l.user_id IS NOT NULL
        AND l.timestamp >= date_trunc('day', now()) - interval '6 days'
      ORDER BY l.user_id;`,

    client`
      SELECT DISTINCT l.user_id, us.id_emoji AS emoji
      FROM logs l LEFT JOIN user_settings us ON us.user_id = l.user_id
      WHERE l.log_type_id = 520 AND l.user_id IS NOT NULL
        AND l.timestamp >= date_trunc('day', now()) - interval '6 days'
      ORDER BY l.user_id;`,

    dailySeries(client`
      WITH days AS (
        SELECT generate_series(date_trunc('day', now()) - interval '13 days', date_trunc('day', now()), interval '1 day')::date AS day
      ), daily AS (
        SELECT timestamp::date AS day, COUNT(DISTINCT user_id)::int AS count
        FROM logs WHERE log_type_id = 520 AND user_id IS NOT NULL
          AND timestamp >= date_trunc('day', now()) - interval '13 days'
        GROUP BY timestamp::date
      )
      SELECT d.day, COALESCE(daily.count, 0)::int AS count FROM days d LEFT JOIN daily ON daily.day = d.day ORDER BY d.day;`),

    client`
      SELECT COUNT(DISTINCT user_id) AS completed FROM logs
      WHERE user_id IS NOT NULL
        AND timestamp >= date_trunc('day', now()) - interval '6 days'
        AND (log_type_id = 522 OR (log_type_id = 521 AND notes = '11'))
        AND user_id IN (SELECT DISTINCT user_id FROM logs
          WHERE log_type_id = 520 AND user_id IS NOT NULL
            AND timestamp >= date_trunc('day', now()) - interval '6 days')
        AND user_id NOT IN (SELECT user_id FROM logs
          WHERE log_type_id = 535 AND user_id IS NOT NULL
            AND timestamp >= date_trunc('day', now()) - interval '6 days');`,

    client`
      SELECT COUNT(DISTINCT user_id) AS completed FROM logs
      WHERE user_id IS NOT NULL
        AND timestamp >= date_trunc('day', now()) - interval '13 days'
        AND timestamp < date_trunc('day', now()) - interval '6 days'
        AND (log_type_id = 522 OR (log_type_id = 521 AND notes = '11'))
        AND user_id IN (SELECT DISTINCT user_id FROM logs
          WHERE log_type_id = 520 AND user_id IS NOT NULL
            AND timestamp >= date_trunc('day', now()) - interval '13 days'
            AND timestamp < date_trunc('day', now()) - interval '6 days')
        AND user_id NOT IN (SELECT user_id FROM logs
          WHERE log_type_id = 535 AND user_id IS NOT NULL
            AND timestamp >= date_trunc('day', now()) - interval '13 days'
            AND timestamp < date_trunc('day', now()) - interval '6 days');`,

    client`
      SELECT COUNT(DISTINCT user_id) AS skipped FROM logs
      WHERE log_type_id = 535 AND user_id IS NOT NULL
        AND timestamp >= date_trunc('day', now()) - interval '6 days';`,

    client`
      SELECT COUNT(DISTINCT user_id) AS skipped FROM logs
      WHERE log_type_id = 535 AND user_id IS NOT NULL
        AND timestamp >= date_trunc('day', now()) - interval '13 days'
        AND timestamp < date_trunc('day', now()) - interval '6 days';`,

    client`
      SELECT user_id, MAX(CASE WHEN notes ~ '^[0-9]+$' THEN notes::int END) AS max_step
      FROM (
        -- Real progression: the furthest step reached via DEMO_STEP_REACHED (521).
        SELECT user_id, notes FROM logs
        WHERE log_type_id = 521 AND user_id IS NOT NULL
          AND timestamp >= date_trunc('day', now()) - interval '6 days'
        UNION ALL
        -- Skippers: cap their funnel contribution at the step they were on when they
        -- tapped Skip (535 notes = current step). Exclude the spurious '11' that
        -- completeOnboarding logs on skip.
        SELECT user_id, COALESCE(NULLIF(REGEXP_REPLACE(notes, '[^0-9]', '', 'g'), ''), '0') AS notes
        FROM logs
        WHERE log_type_id = 535 AND user_id IS NOT NULL
          AND timestamp >= date_trunc('day', now()) - interval '6 days'
      ) t
      GROUP BY user_id;`,

    // Timeline created (707 = generation succeeded) and opened (709).
    client`
      SELECT
        (SELECT COUNT(*) FROM logs WHERE log_type_id = 707 AND user_id IS NOT NULL
           AND timestamp >= date_trunc('day', now()) - interval '6 days') AS created_week,
        (SELECT COUNT(*) FROM logs WHERE log_type_id = 707 AND user_id IS NOT NULL
           AND timestamp >= date_trunc('day', now()) - interval '13 days'
           AND timestamp < date_trunc('day', now()) - interval '6 days') AS created_prior,
        (SELECT COUNT(DISTINCT user_id) FROM logs WHERE log_type_id = 707 AND user_id IS NOT NULL
           AND timestamp >= date_trunc('day', now()) - interval '6 days') AS created_users_week,
        (SELECT COUNT(DISTINCT user_id) FROM logs WHERE log_type_id = 707 AND user_id IS NOT NULL
           AND timestamp >= date_trunc('day', now()) - interval '13 days'
           AND timestamp < date_trunc('day', now()) - interval '6 days') AS created_users_prior,
        (SELECT COUNT(*) FROM logs WHERE log_type_id = 709 AND user_id IS NOT NULL
           AND timestamp >= date_trunc('day', now()) - interval '6 days') AS viewed_week,
        (SELECT COUNT(*) FROM logs WHERE log_type_id = 709 AND user_id IS NOT NULL
           AND timestamp >= date_trunc('day', now()) - interval '13 days'
           AND timestamp < date_trunc('day', now()) - interval '6 days') AS viewed_prior,
        (SELECT COUNT(DISTINCT user_id) FROM logs WHERE log_type_id = 709 AND user_id IS NOT NULL
           AND timestamp >= date_trunc('day', now()) - interval '6 days') AS viewed_users_week,
        (SELECT COUNT(DISTINCT user_id) FROM logs WHERE log_type_id = 709 AND user_id IS NOT NULL
           AND timestamp >= date_trunc('day', now()) - interval '13 days'
           AND timestamp < date_trunc('day', now()) - interval '6 days') AS viewed_users_prior;`,

    client`
      SELECT DISTINCT l.user_id, us.id_emoji AS emoji
      FROM logs l LEFT JOIN user_settings us ON us.user_id = l.user_id
      WHERE l.log_type_id = 707 AND l.user_id IS NOT NULL
        AND l.timestamp >= date_trunc('day', now()) - interval '6 days'
      ORDER BY l.user_id;`,

    client`
      SELECT DISTINCT l.user_id, us.id_emoji AS emoji
      FROM logs l LEFT JOIN user_settings us ON us.user_id = l.user_id
      WHERE l.log_type_id = 709 AND l.user_id IS NOT NULL
        AND l.timestamp >= date_trunc('day', now()) - interval '6 days'
      ORDER BY l.user_id;`,

    // "Don't lose your entries" link-account prompt (527 shown / 531 linked).
    client`
      SELECT
        (SELECT COUNT(DISTINCT user_id) FROM logs WHERE log_type_id = 527 AND user_id IS NOT NULL
           AND timestamp >= date_trunc('day', now()) - interval '6 days') AS shown_week,
        (SELECT COUNT(DISTINCT user_id) FROM logs WHERE log_type_id = 527 AND user_id IS NOT NULL
           AND timestamp >= date_trunc('day', now()) - interval '13 days'
           AND timestamp < date_trunc('day', now()) - interval '6 days') AS shown_prior,
        (SELECT COUNT(DISTINCT user_id) FROM logs WHERE log_type_id = 531 AND user_id IS NOT NULL
           AND timestamp >= date_trunc('day', now()) - interval '6 days') AS linked_week,
        (SELECT COUNT(DISTINCT user_id) FROM logs WHERE log_type_id = 531 AND user_id IS NOT NULL
           AND timestamp >= date_trunc('day', now()) - interval '13 days'
           AND timestamp < date_trunc('day', now()) - interval '6 days') AS linked_prior;`,

    client`
      SELECT DISTINCT l.user_id, us.id_emoji AS emoji
      FROM logs l LEFT JOIN user_settings us ON us.user_id = l.user_id
      WHERE l.log_type_id = 527 AND l.user_id IS NOT NULL
        AND l.timestamp >= date_trunc('day', now()) - interval '6 days'
      ORDER BY l.user_id;`,

    client`
      SELECT DISTINCT l.user_id, us.id_emoji AS emoji
      FROM logs l LEFT JOIN user_settings us ON us.user_id = l.user_id
      WHERE l.log_type_id = 531 AND l.user_id IS NOT NULL
        AND l.timestamp >= date_trunc('day', now()) - interval '6 days'
      ORDER BY l.user_id;`,

    // App version distribution among users active in the past week
    // (any log row with a user_id in the window). Versions collapsed to
    // major.minor: first section before the first '.' + the char right after.
    client`
      SELECT CASE
               WHEN us.app_version IS NULL OR us.app_version = '' THEN 'unknown'
               WHEN POSITION('.' IN us.app_version) = 0 THEN us.app_version
               ELSE SPLIT_PART(us.app_version, '.', 1) || '.' || SUBSTRING(SPLIT_PART(us.app_version, '.', 2) FROM 1 FOR 1)
             END AS app_version,
             COUNT(DISTINCT l.user_id)::int AS user_count
      FROM logs l
      LEFT JOIN user_settings us ON us.user_id = l.user_id
      WHERE l.user_id IS NOT NULL
        AND l.timestamp >= date_trunc('day', now()) - interval '6 days'
      GROUP BY 1
      ORDER BY user_count DESC;`,

    // Platform-level active user counts (7d + 30d windows).
    client`
      SELECT us.platform,
             COUNT(DISTINCT l.user_id) FILTER (WHERE l.timestamp >= date_trunc('day', now()) - interval '6 days')::int AS users_7d,
             COUNT(DISTINCT l.user_id) FILTER (WHERE l.timestamp >= date_trunc('day', now()) - interval '29 days')::int AS users_30d
      FROM logs l
      LEFT JOIN user_settings us ON us.user_id = l.user_id
      WHERE l.user_id IS NOT NULL
        AND us.platform IN ('ios', 'android')
        AND l.timestamp >= date_trunc('day', now()) - interval '29 days'
      GROUP BY us.platform;`,

    // Device platform + model among active users (7d window), per platform.
    client`
      SELECT us.platform,
             us.device_model AS model,
             COUNT(DISTINCT l.user_id)::int AS user_count
      FROM logs l
      LEFT JOIN user_settings us ON us.user_id = l.user_id
      WHERE l.user_id IS NOT NULL
        AND l.timestamp >= date_trunc('day', now()) - interval '6 days'
        AND us.platform IN ('ios', 'android')
        AND us.device_model IS NOT NULL AND us.device_model <> ''
      GROUP BY us.platform, us.device_model
      ORDER BY us.platform, user_count DESC;`,
  ])

  const [topUsers, journalUsers, journalDaily, activeJournalUserList, totalEntries, totalEntriesDaily,
    totalEntryUsers, voiceEntryUsers, voiceEntryUsersDaily, voiceEntryUserList,
    chatUsers, chatUsersDaily, activeChatUserList, messagesDaily, insights,
    categoryClicksUsers, categoryClicksDaily, categoryBreakdown, entityViews, entityViewsDaily,
    entityUsersDaily, exploreLimits, exploreLimitsDaily, exploreUsersDaily, demoSessions,
    categoryClickUsers, entityViewUsers, exploreLimitUsers, demoStarterUsers, demoStartersDaily,
    demoCompletedWeek, demoCompletedPrior, demoSkippedWeek, demoSkippedPrior, demoSegments,
    timelineActivity, timelineCreatorUsers, timelineViewerUsers,
    linkPrompt, linkPromptShownUsers, linkPromptLinkedUsers, appVersionDist, deviceStats, platformStats] = settled.map((r: any) =>
      r.status === 'fulfilled' ? r.value : []
    )

  // ====== Insights engagement & demo funnel (from logs table) ======
  const CATEGORY_LABELS: Record<string, string> = {
    people: 'People',
    events: 'Events',
    topics: 'Topics',
    values: 'Values',
    commitmentsAndProgress: 'Commitments',
    milestonesAndHighlights: 'Milestones',
  }

  const ju = journalUsers[0]; const cu = chatUsers[0]

  const msgWeekCurrent = messagesDaily.slice(53).reduce((a: number, b: number) => a + b, 0)
  const msgWeekPrior = messagesDaily.slice(46, 53).reduce((a: number, b: number) => a + b, 0)
  const msgMonthCurrent = messagesDaily.slice(30).reduce((a: number, b: number) => a + b, 0)
  const msgMonthPrior = messagesDaily.slice(0, 30).reduce((a: number, b: number) => a + b, 0)

  // After getting raw log rows, compute per-category and funnel values.
  const ccUsers = categoryClicksUsers[0]
  const ccCategories = categoryBreakdown
    .map((c: any) => {
      const key = String(c.category_key ?? '')
      return {
        key,
        label: CATEGORY_LABELS[key] ?? key,
        current: toNum(c.this_week),
        prior: toNum(c.prior_week),
        pct: pctChange(toNum(c.this_week), toNum(c.prior_week)),
      }
    })
    .filter((c: any) => CATEGORY_LABELS[c.key])
    .sort((a: any, b: any) => b.current - a.current)

  const ev = entityViews[0]
  const el = exploreLimits[0]
  const demo = demoSessions[0]
  const te = totalEntries[0]
  const vu = voiceEntryUsers[0]
  const skippedWeek = toNum(demoSkippedWeek[0]?.skipped)
  const skippedPrior = toNum(demoSkippedPrior[0]?.skipped)
  const tl = timelineActivity[0]
  const startersWeek = toNum(demo?.this_week)
  const startersPrior = toNum(demo?.prior_week)
  const completedWeek = toNum(demoCompletedWeek[0]?.completed)
  const completedPrior = toNum(demoCompletedPrior[0]?.completed)

  const DEMO_STEPS = [3, 4, 5, 6, 7, 8, 9, 10, 11]
  const DEMO_STEP_LABELS: Record<number, string> = {
    3: 'Journal page', 4: 'New-entry button', 5: 'Journal saved entry', 6: 'Entry detail',
    7: 'Explore tab', 8: 'Explore typing', 9: 'Insights pulses', 10: 'Insights tab', 11: 'Timeline detail',
  }
  const funnelSteps = DEMO_STEPS.map((s) => ({
    step: s,
    label: DEMO_STEP_LABELS[s],
    count: demoSegments.filter((u: any) => toNum(u.max_step) >= s).length,
  }))

  return {
    body: JSON.stringify({
      topUsers: topUsers.map((u: any) => ({
        user_id: u.user_id,
        emoji: u.emoji ?? null,
        latest_created_at: u.latest_created_at,
        total_entry_count: toNum(u.total_entry_count),
      })),
      activeJournalUsers: {
        week: build(ju?.this_week, ju?.prior_week, journalDaily, 7),
        month: build(ju?.this_month, ju?.prior_month, journalDaily, 30),
        users: activeJournalUserList.map((u: any) => ({ user_id: u.user_id, emoji: u.emoji ?? null })),
      },
      totalEntries: {
        week: build(te?.this_week, te?.prior_week, totalEntriesDaily, 7),
        month: build(te?.this_month, te?.prior_month, totalEntriesDaily, 30),
        users: totalEntryUsers.map((u: any) => ({ user_id: u.user_id, emoji: u.emoji ?? null, metric: toNum(u.entry_count) })),
      },
      voiceEntryUsers: {
        week: build(vu?.this_week, vu?.prior_week, voiceEntryUsersDaily, 7),
        month: build(vu?.this_month, vu?.prior_month, voiceEntryUsersDaily, 30),
        users: voiceEntryUserList.map((u: any) => ({ user_id: u.user_id, emoji: u.emoji ?? null })),
      },
      chatMessages: {
        week: { count: msgWeekCurrent, prior: msgWeekPrior, pct: pctChange(msgWeekCurrent, msgWeekPrior), series: { current: messagesDaily.slice(53), prior: messagesDaily.slice(46, 53) } },
        month: { count: msgMonthCurrent, prior: msgMonthPrior, pct: pctChange(msgMonthCurrent, msgMonthPrior), series: { current: messagesDaily.slice(30), prior: messagesDaily.slice(0, 30) } },
      },
      activeChatUsers: {
        week: build(cu?.this_week, cu?.prior_week, chatUsersDaily, 7),
        month: build(cu?.this_month, cu?.prior_month, chatUsersDaily, 30),
        users: activeChatUserList.map((u: any) => ({ user_id: u.user_id, emoji: u.emoji ?? null, metric: toNum(u.message_count) })),
      },
      categoryClicks: {
        uniqueUsers: build(ccUsers?.this_week, ccUsers?.prior_week, categoryClicksDaily, 7),
        categories: ccCategories,
        users: categoryClickUsers.map((u: any) => ({ user_id: u.user_id, emoji: u.emoji ?? null })),
      },
      entityAnalyses: {
        totalViews: build(ev?.views_week, ev?.views_prior, entityViewsDaily, 7),
        uniqueUsers: build(ev?.users_week, ev?.users_prior, entityUsersDaily, 7),
        users: entityViewUsers.map((u: any) => ({ user_id: u.user_id, emoji: u.emoji ?? null })),
      },
      exploreLimits: {
        total: build(el?.events_week, el?.events_prior, exploreLimitsDaily, 7),
        uniqueUsers: build(el?.users_week, el?.users_prior, exploreUsersDaily, 7),
        users: exploreLimitUsers.map((u: any) => ({ user_id: u.user_id, emoji: u.emoji ?? null })),
      },
      demoFunnel: {
        starters: { count: startersWeek, prior: startersPrior, pct: pctChange(startersWeek, startersPrior), series: { current: demoStartersDaily.slice(-7), prior: demoStartersDaily.slice(-14, -7) } },
        starterUsers: demoStarterUsers.map((u: any) => ({ user_id: u.user_id, emoji: u.emoji ?? null })),
        completion: {
          week: completedWeek,
          prior: completedPrior,
          pct: pctChange(completedWeek, completedPrior),
          rate: startersWeek > 0 ? Math.round((completedWeek / startersWeek) * 1000) / 10 : 0,
          priorRate: startersPrior > 0 ? Math.round((completedPrior / startersPrior) * 1000) / 10 : 0,
          ratePct: startersPrior > 0 ? pctChange(Math.round((completedWeek / startersWeek) * 1000) / 10, Math.round((completedPrior / startersPrior) * 1000) / 10) : startersWeek > 0 ? 100 : 0,
        },
        skipped: {
          count: skippedWeek,
          prior: skippedPrior,
          pct: pctChange(skippedWeek, skippedPrior),
        },
        steps: funnelSteps,
      },
      timelineActivity: {
        created: {
          count: toNum(tl?.created_week),
          prior: toNum(tl?.created_prior),
          pct: pctChange(toNum(tl?.created_week), toNum(tl?.created_prior)),
          users: timelineCreatorUsers.map((u: any) => ({ user_id: u.user_id, emoji: u.emoji ?? null })),
        },
        viewed: {
          count: toNum(tl?.viewed_week),
          prior: toNum(tl?.viewed_prior),
          pct: pctChange(toNum(tl?.viewed_week), toNum(tl?.viewed_prior)),
          users: timelineViewerUsers.map((u: any) => ({ user_id: u.user_id, emoji: u.emoji ?? null })),
        },
      },
      linkPrompt: {
        shown: {
          count: toNum(linkPrompt?.[0]?.shown_week),
          prior: toNum(linkPrompt?.[0]?.shown_prior),
          pct: pctChange(toNum(linkPrompt?.[0]?.shown_week), toNum(linkPrompt?.[0]?.shown_prior)),
          users: linkPromptShownUsers.map((u: any) => ({ user_id: u.user_id, emoji: u.emoji ?? null })),
        },
        linked: {
          count: toNum(linkPrompt?.[0]?.linked_week),
          prior: toNum(linkPrompt?.[0]?.linked_prior),
          pct: pctChange(toNum(linkPrompt?.[0]?.linked_week), toNum(linkPrompt?.[0]?.linked_prior)),
          users: linkPromptLinkedUsers.map((u: any) => ({ user_id: u.user_id, emoji: u.emoji ?? null })),
        },
        rate: (() => {
          const shown = toNum(linkPrompt?.[0]?.shown_week)
          const linked = toNum(linkPrompt?.[0]?.linked_week)
          return shown > 0 ? Math.round((linked / shown) * 1000) / 10 : 0
        })(),
      },
      appVersionDist: appVersionDist.map((v: any) => ({
        version: v.app_version ?? 'unknown',
        users: toNum(v.user_count),
      })),
      devices: (() => {
        const byPlatform = (platform: string) => {
          const total = platformStats.find((p: any) => p.platform === platform)
          const models = deviceStats
            .filter((d: any) => d.platform === platform)
            .map((d: any) => ({ model: d.model, users: toNum(d.user_count) }))
          return {
            users7d: toNum(total?.users_7d),
            users30d: toNum(total?.users_30d),
            devices: models,
          }
        }
        return {
          ios: byPlatform('ios'),
          android: byPlatform('android'),
        }
      })(),
      insights: insights.map((i: any) => ({
        insight_title: i.title,
        insight_emoji: i.emoji,
        insight_summary: i.ai_summary,
        created_date: i.created_date,
      })),
      _perf: (() => {
        const totalMs = Date.now() - handlerStart
        const sorted = [...queryTimings].sort((a, b) => b.ms - a.ms)
        if (process.env.NETLIFY_DEV === 'true' || process.env.NODE_ENV !== 'production') {
          console.log(`[perf] handler total: ${totalMs}ms across ${queryTimings.length} queries`)
          console.log(`[perf] slowest: ${sorted.slice(0, 5).map((q) => `#${q.seq} ${q.ms}ms`).join(', ')}`)
        }
        return { totalMs, queries: queryTimings.length, slowest: sorted.slice(0, 5) }
      })(),
    }),
    statusCode: 200
  }
}

export { handler }