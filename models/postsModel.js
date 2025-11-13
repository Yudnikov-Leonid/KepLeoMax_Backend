import pool from "../db.js";

export const getPostById = async (postId) => {
    const result = await pool.query(`SELECT * FROM posts WHERE id = ${postId}`);
    if (result.rows.length === 0) {
        return null;
    } else {
        return result.rows[0];
    }
}

export const getPostsByUserId = async (userId, limit, offset) => {
    const result = await pool.query(`SELECT * FROM posts WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`);
    return result.rows;
}

export const createNewPost = async (userId, content, images) => {
    const result = await pool.query(`INSERT INTO posts (user_id, content, images, users_who_liked_ids, created_at, edited_at) VALUES (${userId}, '${content}', '{${images.map(image => `"${image}"`)}}', '{}', ${Date.now()}, NULL) RETURNING id`);
    return result.rows[0].id;
}

export const getPostsWithLimit = async (limit) => {
    const result = await pool.query(`SELECT * FROM posts ORDER BY created_at DESC LIMIT ${limit}`);
    return result.rows;
}

export const deletePostById = async (id) => {
    await pool.query(`DELETE FROM posts WHERE id = ${id}`);
}