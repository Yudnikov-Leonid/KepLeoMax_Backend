import pool from "../db.js";

export const createNewMessage = async (chatId, senderId, message) => {
    const result = await pool.query('INSERT INTO messages (chat_id, sender_id, message, created_at) VALUES ($1, $2, $3, $4) RETURNING id', [chatId, senderId, message, Date.now()]);
    return result.rows[0].id;
}

export const getMessageById = async (id) => {
    const result = await pool.query('SELECT * FROM messages WHERE id = $1', [id]);
    if (result.rows.length === 0) {
        return null;
    } else {
        return result.rows[0];
    }
}

export const getAllMessagesByChatId = async (chatId, limit, offset) => {
    const result = await pool.query('SELECT * FROM messages WHERE chat_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3', [chatId, limit, offset]);
    return result.rows;
}

export const setMessageIsRead = async (messageId) => {
    await pool.query('UPDATE messages SET is_read = TRUE WHERE id = $1', [messageId]);
}

export const getUnreadCount = async (chatId) => {
    const result = await pool.query('SELECT COUNT(*) FROM messages WHERE chat_id = $1 AND is_read = FALSE', [chatId]);
    return Number(result.rows[0].count);
}

export const readMessages = async (chatId, currentUser, time) => {
    const result = await pool.query('UPDATE messages SET is_read = TRUE WHERE chat_id = $1 AND sender_id != $2 AND created_at <= $3 AND is_read IS DISTINCT FROM TRUE RETURNING id, sender_id', [chatId, currentUser, time ?? Date.now()]);
    return result.rows;
}