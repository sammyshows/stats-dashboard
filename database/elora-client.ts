import postgres from "postgres";

const PgClient = (() => {
    if (process.env.ELORA_DATABASE_URL) {
        return postgres(process.env.ELORA_DATABASE_URL)
    }
})()

module.exports = PgClient