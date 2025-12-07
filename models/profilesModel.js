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
    await pool.query('INSERT INTO profiles (user_id, description) VALUES ($1, $2)', [userId, '']);
}

/// provide the description to handle the case, if the profile doesn't exist
export const editProfileByUserId = async (userId, description) => {
    try {
        return await updateProfile(userId, description);
    } catch (e) {
        const profile = await pool.query('SELECT * FROM profiles WHERE user_id = $1', [userId]);
        if (profile.rows.length === 0) {
            await profilesModel.createUserProfile(userId);
            return await updateProfile(userId, description);
        }

        throw e;
    }
}

const updateProfile = async (userId, description) => {
    const result = await pool.query('UPDATE profiles SET description = $1 WHERE user_id = $2 RETURNING *', [description, userId]);
    return result.rows[0];
}