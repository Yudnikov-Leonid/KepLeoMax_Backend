import pool from "../db.js";

export const usersModel = {
    getUserByEmail: async (email) => {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return null;
        } else {
            return result.rows[0];
        }
    },

    getUserByRefreshToken: async (refreshToken) => {
        const result = await pool.query('SELECT * FROM users WHERE $1 = ANY(refresh_tokens)', [refreshToken]);
        if (result.rows.length === 0) {
            return null;
        } else {
            return result.rows[0];
        }
    },

    createUser: async (email, hashedPassword) => {
        const result = await pool.query('INSERT INTO users (email, password, refresh_tokens) VALUES ($1, $2, $3) RETURNING id', [email, hashedPassword, []]);
        return result.rows[0].id;
    },

    haveDuplicateWithEmail: async (email) => {
        const duplicates = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        return duplicates.rows.length !== 0;
    },

    updateRefreshTokens: async (id, tokens) => {
        await pool.query(`UPDATE users SET refresh_tokens = '{${tokens.map(token => `"${token}"`)}}' WHERE id = $1`, [id]);
    },

    resetRefreshTokensByUserId: async (id) => {
        await pool.query("UPDATE users SET refresh_tokens = '{}' WHERE id = $1", [id])
    },
}