import { Pool } from 'pg';
import { pgSetTypeParsers } from 'pg-safe-numbers';

const pool = new Pool({
    host: 'KLM_db',
    port: 5432,
    user: 'KLMU',
    password: 'KLM_3000',
    database: 'KLM_db'
});

pgSetTypeParsers({
  unsafeInt(parsed, text) {
    throw Error(`unsafe int: ${text}`);
  },
  unsafeFloat(parsed, text) {
    throw Error(`unsafe float: ${text}`);
  }
});

export default pool;