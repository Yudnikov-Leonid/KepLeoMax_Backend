import * as postsModel from '../models/postsModel.js';
import * as usersModel from '../models/usersModel.js';
import convertUserToSend from '../utills/convertUser.js';

export const createPost = async (req, res) => {
    const userId = req.userId;

    const { content, images } = req.body;
    if (!content || !images) {
        return res.status(400).json({ message: 'content and images fields are required' });
    }
    if (!Array.isArray(images)) {
        // TODO validate array, that each value is 32 length
        return res.status(400).json({ message: 'images must be an array' });
    }

    const postId = await postsModel.createNewPost(userId, content, images);
    const newPost = await postsModel.getPostById(postId);
    const user = await usersModel.getUserById(userId);
    newPost.user = convertUserToSend(user, req);
    res.status(201).json({ data: newPost });
}

export const getPostsByUserId = async (req, res) => {
    const userId = req.query.userId;
    if (!userId) {
        return res.status(400).json({ message: 'userId param is required' });
    }
    const limit = req.query.limit ?? 999;
    const offset = req.query.offset ?? 0;

    let posts = await postsModel.getPostsByUserId(userId, limit, offset);
    const user = convertUserToSend(await usersModel.getUserById(userId), req);
    posts.forEach(post => {
        post.user = user;
    });

    res.status(200).json({ data: posts ?? [] });
}

export const deletePost = async (req, res) => {
    const postId = req.query.postId;
    if (!postId) {
        return res.status(400).json({ message: 'postId param is required' });
    }

    const post = await postsModel.getPostById(postId);
    if (!post) {
        return res.status(404).json({message: `Post with id ${postId} not found`});
    }
    if (post.user_id != req.userId) {
        return res.sendStatus(403);
    }

    await postsModel.deletePostById(postId);

    res.status(200).json({data: post});
}