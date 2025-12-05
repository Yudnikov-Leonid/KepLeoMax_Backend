import jwt from 'jsonwebtoken';

const verifyJWT = (req, res, next) => {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.sendStatus(401);
    const token = authHeader.split(' ')[1];
    jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET,
        (err, decoded) => {
            if (err || !decoded.UserInfo.id || isNaN(decoded.UserInfo.id)) return res.sendStatus(403); // Invailid token
            req.userId = decoded.UserInfo.id;
            next();
        }
    );
};

export default verifyJWT;