import * as profilesModel from "../models/profilesModel.js";

export const editProfile = async (req, res) => {
    const userId = req.userId;
    if (!userId) {
        return res.sendStatus(401);
    }

    const { username, description } = req.body;
    if ( !username || !description) {
        return res.status(400).json({message: 'username and descriprion fields are required'});
    }

    const newProfile = await profilesModel.editProfileByUserId(userId, username, description);
    res.status(200).json(newProfile);
}

export const getProfile = async (req, res) => {
    const userId = req.userId;
    if (!userId) {
        return res.sendStatus(401);
    }

    const profile = await profilesModel.getProfileByUserId(userId);
    res.status(409).json(profile);
}