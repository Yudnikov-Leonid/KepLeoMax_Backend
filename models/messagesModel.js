import pool from "../db.js";

export const createNewMessage = async (chatId, senderId, message) => {
    const result = await pool.query(`INSERT INTO messages (chat_id, sender_id, message, created_at) VALUES ($1, $2, $3, $4) RETURNING id`, [chatId, senderId, message, Date.now()]);
    return result.rows[0].id;
}

export const getMessageById = async (id) => {
    const result = await pool.query(`SELECT * FROM messages WHERE id = ${id}`);
    if (result.rows.length === 0) {
        return null;
    } else {
        return result.rows[0];
    }
}

export const getAllMessagesByChatId = async (chatId, limit, offset) => {
    const result = await pool.query(`SELECT * FROM messages WHERE chat_id = ${chatId} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`);
    return result.rows;
}

export const setMessageIsRead = async (messageId) => {
    await pool.query(`UPDATE messages SET is_read = TRUE WHERE id = ${messageId}`);
}

// TODO mayby ony count?
export const getUnreadMessages = async (chatId) => {
    const result = await pool.query(`SELECT * FROM messages WHERE chat_id = ${chatId} AND is_read = FALSE`);
    return result.rows;
}

export const readMessages = async (chatId, currentUser, time) => {
    const maxCreatedAt = time ?? Date.now();
    const result = await pool.query(`UPDATE messages SET is_read = TRUE WHERE chat_id = ${chatId} AND sender_id != ${currentUser} AND created_at <= ${maxCreatedAt} AND is_read IS DISTINCT FROM TRUE RETURNING id, sender_id`);
    return result.rows;
}