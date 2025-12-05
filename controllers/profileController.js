import * as profilesModel from "../models/profilesModel.js";
import * as usersModel from '../models/usersModel.js';
import convertUserToSend from "../utills/convertUser.js";

export const editProfile = async (req, res) => {
    const userId = req.userId;

    const username = req.body.username?.trim();
    const description = req.body.description?.trim();
    const profileImage = req.body.profileImage?.trim();
    if (!username) {
        return res.status(400).json({ message: 'the username field is required' });
    }

    const newProfile = await profilesModel.editProfileByUserId(userId, description ?? '');
    await usersModel.updateUser(userId, username, profileImage ?? '');
    const newUser = await usersModel.getUserById(req.userId); // TODO double query
    newProfile.user = convertUserToSend(newUser, req);
    res.status(200).json({ data: newProfile });
}

export const getProfile = async (req, res) => {
    const userId = req.query.userId?.trim();
    if (!userId) {
        return res.status(400).json({ message: 'userId param is required' });
    } else if (isNaN(userId)) {
        return res.status(400).json({ message: 'userId must be int' });
    }

    const profile = await profilesModel.getProfileByUserId(userId);
    if (!profile) {
        return res.status(404).json({ message: `Profile of user with id ${userId} not found` });
    }
    const user = await usersModel.getUserById(userId);
    profile.user = convertUserToSend(user, req);

    res.status(200).json({ data: profile });
}