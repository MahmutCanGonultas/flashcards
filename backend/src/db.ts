import { Pool, types } from "pg";

// A DATE column is a calendar day, not an instant: keep it as 'YYYY-MM-DD'
// (cards.introduced_on) instead of a Date at the server's local midnight,
// whose JSON names the day before on any machine east of UTC.
types.setTypeParser(types.builtins.DATE, (value) => value);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default pool;
