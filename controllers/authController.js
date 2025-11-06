import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { usersModel } from '../models/usersModel.js';
import { profilesModel } from '../models/profilesModel.js';

const accessTokenExpireTime = '300s'
const refreshTokenExpireTime = '1d'

export const createNewUser = async (req, res) => {
    const {email, password} = req.body;
    if (!email || !password) {
        return res.status(400).json({message: 'Email and password are required'});
    }

    // check duplicates
    if (await usersModel.haveDuplicateWithEmail(email)) {
        return res.status(409).json({ message: `User with email ${email} is alredy exists` });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = await usersModel.createUser(email, hashedPassword);
        await profilesModel.createUserProfile(userId);

        res.status(201).json({success: `New user ${email} created`});
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
}

export const login = async (req, res) => {
    const {email, password} = req.body;
    if (!email || !password) {
        return res.status(400).json({message: 'Email and password are required'});
    }

    const foundUser = await usersModel.getUserByEmail(email);
    if (!foundUser) {
        return res.status(401).json({ message: `User with email ${email} was not found` });
    }

    const match = await bcrypt.compare(password, foundUser.password);
    if (match) {
        const accessToken = jwt.sign(
            { "UserInfo": {
                "id": foundUser.id,
                "email": foundUser.email
            }
            },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: accessTokenExpireTime }
        );
        const refreshToken = jwt.sign(
            { "UserInfo": {
                "id": foundUser.id,
                "email": foundUser.email
            }
            },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: refreshTokenExpireTime }
        );

        await usersModel.updateRefreshToken(foundUser.id, refreshToken);
                
        res.status(200).json({ accessToken: accessToken, refreshToken: refreshToken });
    } else {
        res.status(401).json({message: 'Password is incorrect'});
    }
}

export const refreshToken = async (req, res) => {
    const refreshToken = req.body?.refreshToken;
    if (!refreshToken) return res.sendStatus(401);

    const foundUser = await usersModel.getUserByRefreshToken(refreshToken);
    if (!foundUser) {
        return res.sendStatus(403);
    }

    jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET,
        (err, decoded) => {
            if (err || foundUser.email !== decoded.email) return res.sendStatus(403);
            const accessToken = jwt.sign(
                { "UserInfo": {
                    "id": decoded.id,
                    "email": decoded.email
                }
                },
                process.env.ACCESS_TOKEN_SECRET,
                { expiresIn: accessTokenExpireTime }
            );
            res.status(200).json({accessToken: accessToken});
        }
    );
}

export const logout = async (req, res) => {
    const refreshToken = req.body?.refreshToken;
    if (!refreshToken) return res.sendStatus(401);

    const foundUser = await usersModel.getUserByRefreshToken(refreshToken);
    if (!foundUser) {
        return res.sendStatus(204);
    }

    await usersModel.resetRefreshTokenByUserId(foundUser.id);

    res.sendStatus(204);
}