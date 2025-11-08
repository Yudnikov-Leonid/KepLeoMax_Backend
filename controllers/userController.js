import convertUserToSend from "../utills/convertUser.js";
import * as usersModel from '../models/usersModel.js';

export const updateUsername = async (req, res) => {
    const username = req.body?.username;
    if (!username) {
        return res.status(400).json({message: 'username field is required'});
    }

    await usersModel.updateUsername(req.userId, username);
    const newUser = await usersModel.getUserById(req.userId); // TODO
    
    res.status(200).json({user: convertUserToSend(newUser)});
}