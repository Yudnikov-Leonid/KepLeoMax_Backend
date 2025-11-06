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
        const result = await pool.query('SELECT * FROM users WHERE refresh_token = $1', [refreshToken]);
        if (result.rows.length === 0) {
            return null;
        } else {
            return result.rows[0];
        }
    },

    createUser: async (email, hashedPassword) => {
        const result = await pool.query('INSERT INTO users (email, password, refresh_token) VALUES ($1, $2, $3) RETURNING id', [email, hashedPassword, null]);
        return result.rows[0].id;
    },

    haveDuplicateWithEmail: async (email) => {
        const duplicates = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        return duplicates.rows.length !== 0;
    },

    updateRefreshToken: async (id, refreshToken) => {
        await pool.query('UPDATE users SET refresh_token = $1 WHERE id = $2', [refreshToken, id]);
    },

    resetRefreshTokenByUserId: async (id) => {
        await pool.query('UPDATE users SET refresh_token = NULL WHERE id = $1', [id])
    }
}