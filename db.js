import { Pool } from 'pg';

const pool = new Pool({
    host: 'KLM_db',
    port: 5432,
    user: 'KLMU',
    password: 'KLM_3000',
    database: 'KLM_db'
});

export default pool;