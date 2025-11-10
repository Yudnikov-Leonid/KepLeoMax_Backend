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

    let posts = await postsModel.getPostsByUserId(userId, 10);
    const user = convertUserToSend(await usersModel.getUserById(userId), req);
    posts.forEach(post => {
        post.user = user;
    });

    res.status(200).json({ data: posts ?? [] });
}