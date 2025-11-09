import pool from "../db.js";

export const getUserByEmail = async (email) => {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
        return null;
    } else {
        return result.rows[0];
    }
}

export const getUserById = async (id) => {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (result.rows.length === 0) {
        return null;
    } else {
        return result.rows[0];
    }
}

export const getUserByRefreshToken = async (refreshToken) => {
    const result = await pool.query('SELECT * FROM users WHERE $1 = ANY(refresh_tokens)', [refreshToken]);
    if (result.rows.length === 0) {
        return null;
    } else {
        return result.rows[0];
    }
}

const usernames = ['Cool username', 'Amazing username', 'Wonderful username', 'The best username'];
export const createUser = async (email, hashedPassword) => {
    const result = await pool.query("INSERT INTO users (username, email, password, profile_image, refresh_tokens) VALUES ($1, $2, $3, '', '{}') RETURNING id", [usernames[Math.floor(Math.random() * usernames.length)], email, hashedPassword]);
    return result.rows[0].id;
}

export const haveDuplicateWithEmail = async (email) => {
    const duplicates = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return duplicates.rows.length !== 0;
}

export const updateUser = async (id, username, profileImage) => {
    await pool.query(`UPDATE users SET username = $1, profile_image = $2 WHERE id = $3`, [username, profileImage, id]);
}

export const updateRefreshTokens = async (id, tokens) => {
    await pool.query(`UPDATE users SET refresh_tokens = '{${tokens.map(token => `"${token}"`)}}' WHERE id = $1`, [id]);
}

export const resetRefreshTokensByUserId = async (id) => {
    await pool.query("UPDATE users SET refresh_tokens = '{}' WHERE id = $1", [id])
}
