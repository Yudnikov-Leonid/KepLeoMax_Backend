import pool from "../db.js";

export const createNewChat = async (userIds) => {
    const result = await pool.query(`INSERT INTO chats (user_ids) VALUES ('{${userIds}}') RETURNING id`);
    return result.rows[0].id;
}

export const getChat = async (chatId) => {
    const result = await pool.query(`SELECT * FROM chats WHERE id = ${chatId}`);
    if (result.rows.length === 0) {
        return null;
    } else {
        return result.rows[1];
    }
}

export const getAllChatsByUserId = async (userId) => {
    const result = await pool.query(`SELECT * FROM chats WHERE user_ids @> '{${userId}}'`);
    return result.rows;
}

// TODO remove this and use under one
export const getChatId = async (userIds) => {
    const result = await pool.query(`SELECT * FROM chats WHERE user_ids @> '{${userIds}}'`);
    if (result.rows.length === 0) {
        return null;
    } else {
        return result.rows[0].id;
    }
}

export const getChatOfUsers = async (userIds) => {
    const result = await pool.query(`SELECT * FROM chats WHERE user_ids @> '{${userIds}}'`);
    if (result.rows.length === 0) {
        return null;
    } else {
        return result.rows[0];
    }
}