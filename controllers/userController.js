import convertUserToSend from "../utills/convertUser.js";
import * as usersModel from '../models/usersModel.js';

export const getUser = async (req, res) => {
    const userId = req.query.userId?.trim();
    if (!userId) {
        return res.status(400).json({ message: 'userId param is required' });
    } else if (isNaN(userId)) {
        return res.status(400).json({ message: 'userId must be int' });
    }

    const user = await usersModel.getUserById(userId);
    if (!user) {
        res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ data: convertUserToSend(user, req) });
}

export const updateUser = async (req, res) => {
    const username = req.body.username?.trim();
    const profileImage = req.body.profileImage?.trim();
    if (!username || !profileImage) {
        return res.status(400).json({ message: 'username and profileImage fields are required' });
    }

    await usersModel.updateUser(req.userId, username, profileImage);
    const newUser = await usersModel.getUserById(req.userId); // TODO double query

    res.status(200).json({ data: convertUserToSend(newUser, req) });
}

export const addFCMToken = async (req, res) => {
    const userId = req.userId;
    const token = req.body.token;
    if (!token) {
        return res.status(400).json({ message: 'token field is required' });
    }

    const user = await usersModel.getUserById(userId);
    if (!user.fcm_tokens) {
        user.fcm_tokens = [token];
    } else {
        user.fcm_tokens.push(token);
    }
    await usersModel.updateFCMTokens(userId, user.fcm_tokens);

    res.status(200).json({ data: convertUserToSend(user, req) });
}

export const deleteFCMToken = async (req, res) => {
    const userId = req.userId;
    const token = req.body.token;
    if (!token) {
        return res.status(400).json({ message: 'token field is required' });
    }

    const user = await usersModel.getUserById(userId);
    user.fcm_tokens = user.fcm_tokens.filter((el) => el !== token);
    await usersModel.updateFCMTokens(userId, user.fcm_tokens);

    res.status(200).json({ data: convertUserToSend(user, req) });
}

export const searchUsers = async (req, res) => {
    const userId = req.userId;
    const search = req.query.search;
    if (search === undefined) {
        return res.status(400).json({ message: 'search param is required' });
    }
    const limit = req.query.limit?.trim() ?? 10;
    const offset = req.query.offset?.trim() ?? 0;
    if (isNaN(limit)) {
        return res.status(400).json({ message: 'limit must be int' });
    } else if (isNaN(offset)) {
        return res.status(400).json({ message: 'offset must be int' });
    }

    const users = await usersModel.searchUsers(search, limit, offset);
    const newUsersList = [];
    users.forEach(user => {
        if (user.id != userId) {
            newUsersList.push(convertUserToSend(user, req));
        }
    });

    res.status(200).json({ data: newUsersList });
}