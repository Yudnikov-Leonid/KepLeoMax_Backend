import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import * as usersModel from '../models/usersModel.js'
import * as profilesModel from '../models/profilesModel.js';

const accessTokenExpireTime = '300s'
const refreshTokenExpireTime = '1d'

export const createNewUser = async (req, res) => {
    const { email, password } = req.body;

    // check duplicates
    if (await usersModel.haveDuplicateWithEmail(email)) {
        return res.status(409).json({ message: `User with email ${email} is alredy exists` });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const userId = await usersModel.createUser(email, hashedPassword);
        await profilesModel.createUserProfile(userId);

        res.status(201).json({ success: `New user ${email} created` });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: err.message });
    }
}

export const login = async (req, res) => {
    const { email, password } = req.body;

    const foundUser = await usersModel.getUserByEmail(email);
    if (!foundUser) {
        return res.status(401).json({ message: `User with email ${email} not found` });
    }

    const match = await bcrypt.compare(password, foundUser.password);
    if (match) {
        const accessToken = jwt.sign(
            {
                "UserInfo": {
                    "id": foundUser.id,
                    "email": foundUser.email
                }
            },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: accessTokenExpireTime }
        );
        const refreshToken = jwt.sign(
            {
                "UserInfo": {
                    "id": foundUser.id,
                    "email": foundUser.email
                }
            },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: refreshTokenExpireTime }
        );

        await usersModel.updateRefreshTokens(foundUser.id, [...foundUser.refresh_tokens, refreshToken]);

        res.status(200).json({ accessToken: accessToken, refreshToken: refreshToken });
    } else {
        res.status(401).json({ message: 'Password is incorrect' });
    }
}

// const jwtVerify = (refreshToken) => new Promise((resolve, reject) => {
//     jwt.verify(
//         refreshToken,
//         process.env.REFRESH_TOKEN_SECRET,
//         async (err, decoded) => {
//             if (err) reject(err);
//             resolve(decoded);
//         });
// });


export const refreshToken = async (req, res) => {
    const refreshToken = req.body?.refreshToken;
    if (!refreshToken) return res.sendStatus(401);

    const foundUser = await usersModel.getUserByRefreshToken(refreshToken);
    if (!foundUser) {
        jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET,
            async (err, decoded) => {
                if (err) return;
                const hackedUser = await usersModel.getUserById(decoded.UserInfo.id);
                if (!hackedUser) return;
                await usersModel.resetRefreshTokensByUserId(hackedUser.id);
            });
        return res.sendStatus(403);
    }

    jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET,
        async (err, decoded) => {
            if (err || foundUser.email !== decoded.UserInfo.email) return res.sendStatus(403);
            const newAccessToken = jwt.sign(
                {
                    "UserInfo": {
                        "id": decoded.UserInfo.id,
                        "email": decoded.UserInfo.email
                    }
                },
                process.env.ACCESS_TOKEN_SECRET,
                { expiresIn: accessTokenExpireTime }
            );
            const newRefreshToken = jwt.sign(
                {
                    "UserInfo": {
                        "id": decoded.UserInfo.id,
                        "email": decoded.UserInfo.email
                    }
                },
                process.env.REFRESH_TOKEN_SECRET,
                { expiresIn: refreshTokenExpireTime }
            );

            const newRefreshTokens = [foundUser.refresh_tokens.filter(token => token !== refreshToken), newRefreshToken];
            await usersModel.updateRefreshTokens(foundUser.id, newRefreshTokens);

            res.status(200).json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
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

    const newRefreshTokens = [foundUser.refresh_tokens.filter(token => token !== refreshToken)];
    await usersModel.updateRefreshTokens(foundUser.id, newRefreshTokens);

    res.sendStatus(204);
}