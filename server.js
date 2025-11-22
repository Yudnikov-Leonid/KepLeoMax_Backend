import express from 'express';
import errorHandler from './middleware/error.js';
import notFound from './middleware/notFound.js';
import verifyJWT from './middleware/verifyJWT.js';
import cookieParser from 'cookie-parser';
import pool from './db.js';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

import router from './routes/router.js';
import authRouter from './routes/auth.js';
import userRouter from './routes/user.js';
import profileRouter from './routes/profile.js';
import filesRouter from './routes/files.js';
import postsRouter from './routes/posts.js';
import messagesRouter from './routes/messages.js';
import chatsRouter from './routes/chats.js';

import * as chatsModel from './models/chatsModel.js';
import * as messagesModel from './models/messagesModel.js';
import * as usersModel from './models/usersModel.js';
import convertUserToSend from './utills/convertUser.js';
import { sendNotification } from './services/notificationService.js';

const PORT = process.env.PORT;

const app = express();

// logger
app.use((req, res, next) => {
    console.log(`${req.method} ${req.protocol}://${req.host}${req.originalUrl}`);
    next();
});

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRouter);

app.get('/setup', async (req, res) => {
    // await pool.query('DROP DATABASE IF EXISTS KLM_db');
    // await pool.query('DROP TABLE IF EXISTS users');
    // await pool.query('DROP TABLE IF EXISTS profiles');
    // await pool.query('DROP TABLE IF EXISTS posts');

    // await pool.query('CREATE DATABASE KLM_db;');
    // await pool.query('CREATE TABLE users (id SERIAL PRIMARY KEY, username VARCHAR(50), email VARCHAR(100), password VARCHAR(100), profile_image VARCHAR(32), refresh_tokens TEXT[])');
    // await pool.query('CREATE TABLE profiles (id SERIAL PRIMARY KEY, user_id INT, description VARCHAR(200))');
    // await pool.query('CREATE TABLE posts (id SERIAL PRIMARY KEY, user_id INT, content VARCHAR(4000), images VARCHAR(32)[], users_who_liked_ids INT[], created_at BIGINT, edited_at BIGINT NULL)');

    // await pool.query('DROP TABLE IF EXISTS chats');
    // await pool.query('DROP TABLE IF EXISTS messages');

    // await pool.query('CREATE TABLE chats (id SERIAL PRIMARY KEY, user_ids INT[])');
    // await pool.query('CREATE TABLE messages (id SERIAL PRIMARY KEY, chat_id INT, sender_id INT, message VARCHAR(4000), is_read BOOLEAN DEFAULT FALSE, created_at BIGINT, edited_at BIGINT NULL DEFAULT NULL)');

    await pool.query('ALTER TABLE users ADD fcm_tokens TEXT[]');
    res.json({ message: 'tables created' });
});

// app.use(express.static(path.join(__dirname, 'uploads')))

app.use('/api/files', filesRouter);

app.use(verifyJWT);
app.use('/api/user', userRouter);
app.use('/api', router);
app.use('/api/profile', profileRouter);
app.use('/api/posts', postsRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/chats', chatsRouter);

// Error handlers
app.use(notFound);
app.use(errorHandler);

// 192.168.0.106
const expressServer = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`)
});

/// websocet
const io = new Server(expressServer);

io.use((socket, next) => {
    /// needs to sent an error to user
    const authHeader = socket.handshake.auth?.token;
    if (!authHeader) {
        return next(new Error('Authentication error: No token provided.'));
    }

    if (!authHeader?.startsWith('Bearer ')) return next(new Error('Authentication error: The token is invalid.'));
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
        next(new Error('Authentication error: Forbidden.')); // Invailid token
    }
});

io.on('connection', socket => {
    const userId = socket.userId;

    console.log(`user ${socket.id} with id ${userId} connected`);

    socket.join(userId.toString());

    socket.on('message', async (data) => {
        const otherUserId = data.recipient_id;
        const message = data.message;
        let chatId = await chatsModel.getChatId([userId, otherUserId]);
        if (!chatId) {
            console.log(`creating new chat between ${userId} and ${otherUserId}`);
            chatId = await chatsModel.createNewChat([userId, otherUserId]);
        }
        console.log(`chat id: ${chatId}, userId: ${userId}, otherUserId: ${otherUserId}`);
        const messageId = await messagesModel.createNewMessage(chatId, userId, message);
        const newMessage = await messagesModel.getMessageById(messageId);

        newMessage.is_current_user = true;
        newMessage.other_user_id = otherUserId;
        io.in(userId.toString()).emit('new_message', newMessage);
        newMessage.is_current_user = false;
        newMessage.other_user_id = Number(userId);
        io.in(otherUserId.toString()).emit('new_message', newMessage);
        console.log(`new message ${message} emitet to ${userId}, ${otherUserId}`);

        // read messages
        const readMessagesIds = await messagesModel.readMessages(chatId, userId);
        if (readMessagesIds.length > 0) {
            io.in([userId.toString(), otherUserId.toString()]).emit('read_messages', { chat_id: chatId, sender_id: readMessagesIds[0].sender_id, messages_ids: readMessagesIds.map(obj => obj.id) });
        }

        // send notification
        const user = await usersModel.getUserById(userId);
        const otherUser = await usersModel.getUserById(otherUserId);
        sendNotification(otherUser, user.username, newMessage.message, { chat_id: chatId.toString(), type: 'new', ids: JSON.stringify([newMessage.id]) });
    });

    socket.on('read_all', async (data) => {
        const chatId = data.chat_id;
        const readMessagesIds = await messagesModel.readMessages(chatId, userId);
        if (readMessagesIds.length > 0) {
            const chat = await chatsModel.getChatById(chatId);
            const otherUserId = chat.user_ids.filter(id => id != userId)[0];
            io.in([userId.toString(), otherUserId.toString()]).emit('read_messages', { chat_id: chatId, sender_id: readMessagesIds[0].sender_id, messages_ids: readMessagesIds.map(obj => obj.id) });
            // this logic was made locally on the client
            // const user = await usersModel.getUserById(userId);
            // sendNotification(user, 'clear', 'clear', { chat_id: chatId.toString(), type: 'cancel', ids: JSON.stringify(readMessagesIds.map(obj => obj.id)) });
        }
    });

    socket.on('read_before_time', async (data) => {
        const chatId = data.chat_id;
        const readMessagesIds = await messagesModel.readMessages(chatId, userId, data.time);
        if (readMessagesIds.length > 0) {
            const chat = await chatsModel.getChatById(chatId);
            const otherUserId = chat.user_ids.filter(id => id != userId)[0];
            io.in([userId.toString(), otherUserId.toString()]).emit('read_messages', { chat_id: chatId, sender_id: readMessagesIds[0].sender_id, messages_ids: readMessagesIds.map(obj => obj.id) });
            // const user = await usersModel.getUserById(userId);
            // sendNotification(user, 'clear', 'clear', { chat_id: chatId.toString(), type: 'cancel', ids: JSON.stringify(readMessagesIds.map(obj => obj.id)) });
        }
    });

    socket.on('disconnect', () => {
        console.log(`user ${socket.id} with id ${userId} disconnected`);
    });
});