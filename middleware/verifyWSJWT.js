import jwt from 'jsonwebtoken';

const verifyWSJWT = (socket, next) => {
    /// needs to sent an error to user
    const authHeader = socket.handshake.auth?.token;
    console.log(`auth: ${JSON.stringify(socket.handshake.auth)}`);
    if (!authHeader) {
        console.log('WebSocket: No token provided');
        return next();
    }
    console.log('connecting with token: ' + authHeader);

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
        socket.userEmail = decoded.UserInfo.email;
        socket.userId = decoded.UserInfo.id;
        next();
    } catch (e) {
        // Invailid token
        console.log('error while verify jwt: ' + e);
        next();
    }
};

export default verifyWSJWT;