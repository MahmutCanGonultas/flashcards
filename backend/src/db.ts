import { Pool, types } from "pg";

// A DATE column is a calendar day, not an instant: keep it as 'YYYY-MM-DD'
// (cards.introduced_on) instead of a Date at the server's local midnight,
// whose JSON names the day before on any machine east of UTC.
types.setTypeParser(types.builtins.DATE, (value) => value);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Neon drops connections that sit idle; keep-alive notices sooner.
  keepAlive: true,
});

// An idle connection the database closed (read ETIMEDOUT, terminated) is
// reported here. Without a listener Node treats it as uncaught and the
// whole API goes down; the pool has already thrown that client away, and
// the next query opens a fresh one.
pool.on("error", (error) => {
  console.error("Idle database connection lost:", error.message);
});

export default pool;
