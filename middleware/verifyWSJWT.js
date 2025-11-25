import jwt from 'jsonwebtoken';

const verifyWSJWT = (socket, next) => {
    /// needs to sent an error to user
    const authHeader = socket.handshake.auth?.token;
    if (!authHeader) {
        console.log('WebScoket: No token provided');
        return next(new Error('Authentication error: No token provided.'));
    }
    console.log('connecting with token: ' + authHeader);

    if (!authHeader?.startsWith('Bearer ')) {
        console.log('WebScoket: The token is incorrect');
        return next(new Error('Authentication error: The token is invalid.'));
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
        console.log('error while verify jwt');
        socket.disconnect();
        next(new Error('Authentication error: Forbidden.')); // Invailid token
    }
};

export default verifyWSJWT;