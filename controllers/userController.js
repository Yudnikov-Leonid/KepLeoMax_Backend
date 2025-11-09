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

    res.status(200).json({data: convertUserToSend(user)});
}

export const updateUser = async (req, res) => {
    const {username, profileImage} = req.body;
    if (!username || !profileImage) {
        return res.status(400).json({message: 'username and profileImage fields are required'});
    }

    await usersModel.updateUser(req.userId, username, profileImage);
    const newUser = await usersModel.getUserById(req.userId); // TODO double query
    
    res.status(200).json({data: convertUserToSend(newUser)});
}