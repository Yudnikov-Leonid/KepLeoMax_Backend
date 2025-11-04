import bcrypt from 'bcrypt';
import { users } from '../db/users.js';
import jwt from 'jsonwebtoken';

// TODO MOVE MAXAGE NUMBER IN .ENV
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
        // create JWTs
        const accessToken = jwt.sign(
            { "email": foundUser.email },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: process.env.ACCESS_TOKEN_EXPIRE_TIME }
        );
        const refreshToken = jwt.sign(
            { "email": foundUser.email },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: process.env.REFRESH_TOKEN_EXPIRE_TIME }
        );
        
        users.splice(foundUserIndex, 1)
        foundUser.refreshToken = refreshToken
        users.push(foundUser)
        
        res.cookie('jwt', refreshToken, {httpOnly: true, maxAge: 24 * 60 * 60 * 1000})
        res.status(200).json({ accessToken });
    } else {
        res.status(401).json({message: 'Password is incorrect'});
    }
}

export const refreshToken = (req, res) => {
    const cookies = req.cookies;
    if (!cookies?.jwt) return res.sendStatus(401);
    const refreshToken = cookies.jwt;

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
                { expiresIn: process.env.ACCESS_TOKEN_EXPIRE_TIME }
            );
            res.json({accessToken});
        }
    );
}

export const logout =  (req, res) => {
    // on a client also delete the accessToken

    const cookies = req.cookies;
    if (!cookies?.jwt) return res.sendStatus(204);
    const refreshToken = cookies.jwt;

    const foundUserIndex = users.findIndex(person => person.refreshToken === refreshToken);
    if (foundUserIndex === -1) {
        res.clearCookie('jwt', {httpOnly: true, maxAge: 24 * 60 * 60 * 1000});
        return res.sendStatus(204);
    }
    
    users[foundUserIndex].refreshToken = undefined;
    res.clearCookie('jwt', {httpOnly: true, maxAge: 24 * 60 * 60 * 1000});
    res.sendStatus(204);
}