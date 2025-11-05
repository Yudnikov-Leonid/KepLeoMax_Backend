import bcrypt from 'bcrypt';
import { users } from '../db/users.js';
import jwt from 'jsonwebtoken';

const accessTokenExpireTime = '60s'
const refreshTokenExpireTime = '1d'
const refreshTokenMaxAge = 24 * 60 * 60 * 1000

// ADD FLAG secure: true when sending cookies in production

export const createNewUser = async (req, res) => {
    const {email, password} = req.body;
    if (!email || !password) {
        return res.status(400).json({message: 'Email and password are required'});
    }

    // check duplicates
    const duplicate = users.find(person => person.email === email);
    if (duplicate) {
        return res.status(409).json({ message: `User with email ${email} is alredy exists` });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = {email: email, password: hashedPassword};
        users.push(newUser);

        //console.log(`New users list: ${users.map(person => `${person.email} ${person.password}`)}`);
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

    const foundUserIndex = users.findIndex(person => person.email === email);
    if (foundUserIndex === -1) {
        return res.status(401).json({ message: `User with email ${email} was not found` });
    }

    const foundUser = users[foundUserIndex]

    const match = await bcrypt.compare(password, foundUser.password);
    if (match) {
        const accessToken = jwt.sign(
            { "email": foundUser.email },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: accessTokenExpireTime }
        );
        const refreshToken = jwt.sign(
            { "email": foundUser.email },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: refreshTokenExpireTime }
        );
        
        users[foundUserIndex].refreshToken = refreshToken
        
        //res.cookie('jwt', refreshToken, {httpOnly: true, maxAge: refreshTokenMaxAge})
        res.status(200).json({ accessToken: accessToken, refreshToken: refreshToken });
    } else {
        res.status(401).json({message: 'Password is incorrect'});
    }
}

export const refreshToken = (req, res) => {
    const refreshToken = req.body?.refreshToken;
    if (!refreshToken) return res.sendStatus(401);

    // const cookies = req.cookies;
    // if (!cookies?.jwt) return res.sendStatus(401);
    // const refreshToken = cookies.jwt;

    const foundUserIndex = users.findIndex(person => person.refreshToken === refreshToken);
    if (foundUserIndex === -1) {
        return res.sendStatus(403);
    }
    const foundUser = users[foundUserIndex];

    jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET,
        (err, decoded) => {
            if (err || foundUser.email !== decoded.email) return res.sendStatus(403);
            const accessToken = jwt.sign(
                {email: decoded.email},
                process.env.ACCESS_TOKEN_SECRET,
                { expiresIn: accessTokenExpireTime }
            );
            res.status(200).json({accessToken: accessToken});
        }
    );
}

export const logout =  (req, res) => {
    // on a client also delete the accessToken

    const refreshToken = req.body?.get('refreshToken');
    if (!refreshToken) return res.sendStatus(401);

    // const cookies = req.cookies;
    // if (!cookies?.jwt) return res.sendStatus(204);
    // const refreshToken = cookies.jwt;

    const foundUserIndex = users.findIndex(person => person.refreshToken === refreshToken);
    if (foundUserIndex === -1) {
        //res.clearCookie('jwt', {httpOnly: true, maxAge: refreshTokenMaxAge});
        return res.sendStatus(204);
    }
    
    users[foundUserIndex].refreshToken = undefined;
    //res.clearCookie('jwt', {httpOnly: true, maxAge: refreshTokenMaxAge});
    res.sendStatus(204);
}