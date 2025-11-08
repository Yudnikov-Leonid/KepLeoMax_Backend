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

    const newProfile = await profilesModel.editProfileByUserId(userId, description);
    res.status(200).json(newProfile);
}

export const getProfile = async (req, res) => {
    const userId = req.query.userId;
    if (!userId) {
        return res.status(400).json({message: 'Query param userId is required'});
    }

    const profile = await profilesModel.getProfileByUserId(userId);
    if (!profile) {
        return res.status(404).json({message: `User with id ${userId} not found`});
    }
    res.status(409).json(profile);
}