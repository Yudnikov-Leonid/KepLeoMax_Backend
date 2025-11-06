import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../db.js';

const accessTokenExpireTime = '60s'
const refreshTokenExpireTime = '1d'

export const createNewUser = async (req, res) => {
    const {email, password} = req.body;
    if (!email || !password) {
        return res.status(400).json({message: 'Email and password are required'});
    }

    // check duplicates
    const duplicates = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (duplicates.rows.length !== 0) {
        return res.status(409).json({ message: `User with email ${email} is alredy exists` });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query('INSERT INTO users (email, password, refreshToken) VALUES ($1, $2, $3)', [email, hashedPassword, null])

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

    let foundUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (foundUser.rows.length === 0) {
        return res.status(401).json({ message: `User with email ${email} was not found` });
    }
    foundUser = foundUser.rows[0];

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
        
        await pool.query('UPDATE users SET refreshToken = $1 WHERE id = $2', [refreshToken, foundUser.email]);
        
        res.status(200).json({ accessToken: accessToken, refreshToken: refreshToken });
    } else {
        res.status(401).json({message: 'Password is incorrect'});
    }
}

export const refreshToken = async (req, res) => {
    const refreshToken = req.body?.refreshToken;
    if (!refreshToken) return res.sendStatus(401);

    let foundUser = await pool.query('SELECT * FROM users WHERE refreshToken = $1', [refreshToken]);
    if (foundUser.rows.length === 0) {
        return res.sendStatus(403);
    }
    foundUser = foundUser.rows[0];

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

export const logout = async (req, res) => {
    // on a client also delete the accessToken

    const refreshToken = req.body?.refreshToken;
    if (!refreshToken) return res.sendStatus(401);

    let foundUser = await pool.query('SELECT * FROM users WHERE refreshToken = $1', [refreshToken]);
    if (foundUser.rows.length === 0) {
        return res.sendStatus(204);
    }
    foundUser = foundUser.rows[0];

    await pool.query('UPDATE users SET refreshToken = NULL WHERE id = $1', [foundUser.id])
    res.sendStatus(204);
}