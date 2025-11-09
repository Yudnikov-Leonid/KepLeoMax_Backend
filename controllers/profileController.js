import * as profilesModel from "../models/profilesModel.js";
import * as usersModel from '../models/usersModel.js';
import convertUserToSend from "../utills/convertUser.js";

export const editProfile = async (req, res) => {
    const userId = req.userId;
    if (!userId) {
        return res.sendStatus(401);
    }

    const { username, description } = req.body;
    if (!username || !description) {
        return res.status(400).json({message: 'username and descriprion fields are required'});
    }

    const newProfile = await profilesModel.editProfileByUserId(userId, description);
    await usersModel.updateUsername(userId, username);
    const newUser = await usersModel.getUserById(req.userId); // TODO double query
    newProfile.user = convertUserToSend(newUser);
    res.status(200).json({data: newProfile});
}

export const getProfile = async (req, res) => {
    const userId = req.query.userId;
    if (!userId) {
        return res.status(400).json({message: 'Query param userId is required'});
    }

    const profile = await profilesModel.getProfileByUserId(userId);
    if (!profile) {
        return res.status(404).json({message: `Profile of user with id ${userId} not found`});
    }
    const user = await usersModel.getUserById(userId);
    profile.user = convertUserToSend(user);

    res.status(200).json({data: profile});
}