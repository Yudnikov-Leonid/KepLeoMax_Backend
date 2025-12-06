import pool from "../db.js"

export const addFCMToken = async (userId, token) => {
    await pool.query(`INSERT INTO fcm_tokens (user_id, fcm_token) VALUES (${userId}, '${token}') ON CONFLICT (fcm_token) DO UPDATE SET user_id = ${userId}`);
}

export const deleteFCMToken = async (token) => {
    await pool.query(`DELETE FROM fcm_tokens WHERE fcm_token = '${token}'`);
}

export const getAllTokensByUserId = async (userId) => {
    return (await pool.query(`SELECT * FROM fcm_tokens WHERE user_id = ${userId}`)).rows;
}