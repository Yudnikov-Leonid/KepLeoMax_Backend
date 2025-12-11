import pool from "../db.js";

// create, update
const usernames = ['Cool username', 'Amazing username', 'Wonderful username', 'The best username'];
export const createUser = async (email, hashedPassword) => {
    const result = await pool.query("INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id", [usernames[Math.floor(Math.random() * usernames.length)], email, hashedPassword]);
    return result.rows[0].id;
}

export const updateUser = async (id, username, profileImage, updateImage) => {
    const result = await pool.query(`UPDATE users SET username = $1${!updateImage ? '' : ', profile_image = $3'} WHERE id = $2 RETURNING *`, !updateImage ? [username, id] : [username, id, profileImage]);
    return result.rows[0];
}

// read
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

export const searchUsers = async (search, limit, offset) => {
    const result = await pool.query('SELECT * FROM users WHERE (lower(username) LIKE lower($1)) ORDER BY email ASC LIMIT $2 OFFSET $3', [`%${search}%`, limit, offset]);
    return result.rows;
}

export const getUserByRefreshToken = async (refreshToken) => {
    const result = await pool.query('SELECT * FROM users WHERE id = (SELECT user_id FROM refresh_tokens WHERE token = $1 LIMIT 1 OFFSET 0)', [refreshToken]);
    if (result.rows.length === 0) {
        return null;
    } else {
        return result.rows[0];
    }
}

// check
export const haveDuplicateWithEmail = async (email) => {
    const duplicates = await pool.query('SELECT * FROM users WHERE email = $1 LIMIT 1 OFFSET 0', [email]);
    return duplicates.rows.length !== 0;
}

// refresh token
export const addRefreshToken = async (userId, token) => {
    await pool.query('INSERT INTO refresh_tokens (user_id, token) VALUES ($1, $2)', [userId, token]);
}

export const delteRefreshToken = async (token) => {
    await pool.query('DELETE FROM refresh_tokens WHERE token = $1', [token]);
}

export const resetRefreshTokensByUserId = async (userId) => {
    await pool.query('DELETE FROM refresh_tokens WHERE user_id = $1', [userId]);
}