import pool from "../db.js";

export const getProfileByUserId = async (id) => {
    const result = await pool.query('SELECT * FROM profiles WHERE user_id = $1', [id]);
    if (result.rows.length === 0) {
        return null;
    } else {
        return result.rows[0];
    }
}

export const createUserProfile = async (userId) => {
    await pool.query('INSERT INTO profiles (user_id, username, description) VALUES ($1, $2, $3)', [userId, '', '']);
}

export const editProfileByUserId = async (userId, username, description) => {
    try {
        return await updateProfile(userId, username, description);
    } catch (e) {
        const profile = await pool.query('SELECT * FROM profiles WHERE user_id = $1', [userId]);
        if (profile.rows.length === 0) {
            await profilesModel.createUserProfile(userId);
            return await updateProfile(userId, username, description);
        }

        throw e;
    }
}

const updateProfile = async (userId, username, description) => {
    const result = await pool.query('UPDATE profiles SET username = $1, description = $2 WHERE user_id = $3 RETURNING id, user_id, username, description', [username, description, userId]);
    return result.rows[0];
}