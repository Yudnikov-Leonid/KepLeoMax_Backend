import express from 'express';
import errorHandler from './middleware/error.js';
import notFound from './middleware/notFound.js';
import verifyJWT from './middleware/verifyJWT.js';
import verifyWSJWT from './middleware/verifyWSJWT.js';
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
import webSocketRouter from './routes/websocket.js';


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

io.use(verifyWSJWT);

io.on('connection', (socket) => webSocketRouter(io, socket));