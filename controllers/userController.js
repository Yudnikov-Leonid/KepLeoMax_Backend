import convertUserToSend from "../utills/convertUser.js";
import * as usersModel from '../models/usersModel.js';

export const getUser = async (req, res) => {
    const userId = req.query.userId;
    if (!userId) {
        return res.status(400).json({message: 'userId param is required'});
    }

    const user = await usersModel.getUserById(userId);
    if (!user) {
        res.status(404).json({message: 'User not found'});
    }

    res.status(200).json({data: convertUserToSend(user, req)});
}

export const updateUser = async (req, res) => {
    const {username, profileImage} = req.body;
    if (!username || !profileImage) {
        return res.status(400).json({message: 'username and profileImage fields are required'});
    }

    await usersModel.updateUser(req.userId, username, profileImage);
    const newUser = await usersModel.getUserById(req.userId); // TODO double query
    
    res.status(200).json({data: convertUserToSend(newUser, req)});
}

export const searchUsers = async (req, res) => {
    const userId = req.userId;
    const search = req.query.search;
    if (search == undefined) {
        return res.status(400).json({message: 'search param is required'});
    }
    const limit = req.query.limit ?? 10;
    const offset = req.query.offset ?? 0;

    const users = await usersModel.searchUsers(search, limit, offset);
    const newUsersList = [];
    users.forEach(user => {
        if (user.id != userId) {
            newUsersList.push(convertUserToSend(user, req));
        }
    });

    res.status(200).json({data: newUsersList});
}