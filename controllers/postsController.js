import * as postsModel from '../models/postsModel.js';
import * as usersModel from '../models/usersModel.js';
import convertUserToSend from '../utills/convertUser.js';

export const createPost = async (req, res) => {
    const userId = req.userId;

    const { content, images } = req.body;
    if (content === undefined || !images) {
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

export const updatePost = async (req, res) => {
    const userId = req.userId;
    const postId = req.query.postId;
    if (!postId) {
        return res.status(400).json({ message: 'postId param is required' });
    }
    const { content, images } = req.body;
    if (content === undefined || !images) {
        return res.status(400).json({ message: 'content and images fields are required' });
    }
    if (!Array.isArray(images)) {
        // TODO validate array, that each value is 32 length
        return res.status(400).json({ message: 'images must be an array' });
    }

    let post = await postsModel.getPostById(postId);
    if (!post) {
        return res.status(404).json({ message: `Post with id ${postId} not found` });
    }
    if (post.user_id != userId) {
        return res.sendStatus(403);
    }

    await postsModel.updatePost(postId, content, images);

    post = await postsModel.getPostById(postId);
    const user = await usersModel.getUserById(userId);
    post.user = convertUserToSend(user, req);
    res.status(200).json({ data: post });
}

export const getPostsByUserId = async (req, res) => {
    const userId = req.query.userId;
    if (!userId) {
        return res.status(400).json({ message: 'userId param is required' });
    }
    const limit = req.query.limit ?? 999;
    const offset = req.query.offset ?? 0;
    const beforeTime = req.query.before_time ?? Date.now();

    let posts = await postsModel.getPostsByUserId(userId, limit, offset, beforeTime);
    const user = convertUserToSend(await usersModel.getUserById(userId), req);
    posts.forEach(post => {
        post.user = user;
    });

    res.status(200).json({ data: posts ?? [] });
}

export const getPosts = async (req, res) => {
    const limit = req.query.limit ?? 999;
    const offset = req.query.offset ?? 0;
    const beforeTime = req.query.before_time ?? Date.now();

    let posts = await postsModel.getPostsWithLimit(limit, offset, beforeTime);
    const usersMap = new Map();
    for(let i = 0; i < posts.length; i++){
        const userId = posts[i].user_id;
        if (!usersMap.get(userId)) {
            const user = await usersModel.getUserById(userId);
            usersMap.set(userId, convertUserToSend(user, req));
        }
        posts[i].user = usersMap.get(userId);
    }


    res.status(200).json({ data: posts ?? [] });
}

export const deletePost = async (req, res) => {
    const userId = req.userId;
    const postId = req.query.postId;
    if (!postId) {
        return res.status(400).json({ message: 'postId param is required' });
    }

    const post = await postsModel.getPostById(postId);
    if (!post) {
        return res.status(404).json({ message: `Post with id ${postId} not found` });
    }
    if (post.user_id != userId) {
        return res.sendStatus(403);
    }

    await postsModel.deletePostById(postId);

    const user = await usersModel.getUserById(userId);
    post.user = convertUserToSend(user, req);
    res.status(200).json({ data: post });
}