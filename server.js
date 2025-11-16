import express from 'express';
import errorHandler from './middleware/error.js';
import notFound from './middleware/notFound.js';
import verifyJWT from './middleware/verifyJWT.js';
import cookieParser from 'cookie-parser';
import pool from './db.js';
import { Server } from 'socket.io';

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

    await pool.query('DROP TABLE IF EXISTS chats');
    await pool.query('DROP TABLE IF EXISTS messages');

    await pool.query('CREATE TABLE chats (id SERIAL PRIMARY KEY, user_ids INT[])');
    await pool.query('CREATE TABLE messages (id SERIAL PRIMARY KEY, chat_id INT, sender_id INT, message VARCHAR(4000), is_read BOOLEAN DEFAULT FALSE, created_at BIGINT, edited_at BIGINT NULL DEFAULT NULL)');
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

io.on('connection', socket => {
    const userId = socket.handshake.query.user_id;

    console.log(`user ${socket.id} with id ${userId} connected`);

    socket.join(userId.toString());

    socket.broadcast.emit('message', `user ${socket.id.substring(0, 5)} with id ${userId} connected`);

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
        io.in(userId.toString()).emit('new_message', newMessage);
        newMessage.is_current_user = false;
        io.in(otherUserId.toString()).emit('new_message', newMessage);
        console.log(`new message ${message} emitet to ${userId}, ${otherUserId}`);

        // read messages
        const readMessagesIds = await messagesModel.readMessages(chatId, userId);
        if (readMessagesIds.length > 0) {
            io.in([userId.toString(), otherUserId.toString()]).emit('read_messages', { chat_id: chatId, sender_id: readMessagesIds[0].sender_id, messages_ids: readMessagesIds.map(obj => obj.id) });
        }


        // emit newChat
        // if (isNewChatCreated) {
        //     const chat = await chatsModel.getChatById(chatId);
        //     const currentUser = await usersModel.getUserById(userId);
        //     const otherUser = await usersModel.getUserById(otherUserId);
        //     // curent_user here will be false in both cases
        //     chat.last_message = newMessage;
        //     chat.other_user = convertUserToSend(otherUser, { userId: otherUserId });
        //     io.in(userId.toString()).emit('new_chat', chat);
        //     chat.other_user = convertUserToSend(currentUser, { userId: userId });
        //     io.in(userId.toString()).emit('new_chat', chat);
        //     console.log(`new_chat emittet`);
        // }
    });

    socket.on('disconnect', () => {
        socket.broadcast.emit('message', `user ${socket.id.substring(0, 5)} with id ${userId} disconnected`);
    });
});