import jwt from 'jsonwebtoken';

const verifyWSJWT = (socket, next) => {
    /// needs to sent an error to user
    const authHeader = socket.handshake.auth?.token;
    if (!authHeader) {
        console.log('WebSocket: No token provided');
        return next();
    }

    if (!authHeader?.startsWith('Bearer ')) {
        console.log('WebSocket: The token is incorrect');
        return next();
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(
            token,
            process.env.ACCESS_TOKEN_SECRET,
        );
        console.log(`decodedData: ${JSON.stringify(decoded)}`);
        if (!decoded.UserInfo.id || isNaN(decoded.UserInfo.id)) {
            throw 'The token doesn\'t contain userId';
        }
        socket.userId = decoded.UserInfo.id;
        next();
    } catch (e) {
        // Invailid token
        console.log('WS error while verify jwt: ' + e);
        next();
    }
};

export default verifyWSJWT;