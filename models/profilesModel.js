import pool from "../db.js";

export const getProfileByUserId = async (id) => {
    const result = await pool.query('SELECT * FROM profiles WHERE user_id = $1', [id]);
    return result.rows[0];
}

export const createUserProfile = async (userId) => {
    await pool.query('INSERT INTO profiles (user_id, description) VALUES ($1, $2)', [userId, '']);
}

/// provide the description to handle the case, if the profile doesn't exist
export const editProfileByUserId = async (userId, description) => {
    const result = await pool.query('UPDATE profiles SET description = $1 WHERE user_id = $2 RETURNING *', [description, userId]);
    if (result.rows[0])
        return result.rows[0];
    else {
        await profilesModel.createUserProfile(userId);
        return await editProfileByUserId(userId, description);
    }
}