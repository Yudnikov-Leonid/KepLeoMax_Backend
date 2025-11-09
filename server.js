import express from 'express';
import errorHandler from './middleware/error.js';
import notFound from './middleware/notFound.js';
import verifyJWT from './middleware/verifyJWT.js';
import cookieParser from 'cookie-parser';
import pool from './db.js';

import router from './routes/router.js';
import authRouter from './routes/auth.js';
import userRouter from './routes/user.js';
import profileRouter from './routes/profile.js';
import filesRouter from './routes/files.js';

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
    await pool.query('DROP DATABASE IF EXISTS KLM_db');
    await pool.query('DROP TABLE IF EXISTS users');
    await pool.query('DROP TABLE IF EXISTS profiles');

    await pool.query('CREATE DATABASE KLM_db;');
    await pool.query('CREATE TABLE users (id SERIAL PRIMARY KEY, username VARCHAR(50), email VARCHAR(100), password VARCHAR(100), profile_image VARCHAR(32), refresh_tokens text[])');
    await pool.query('CREATE TABLE profiles (id SERIAL PRIMARY KEY, user_id INT, description VARCHAR(200))');
    res.json({message: 'tables created'});
});

// app.use(express.static(path.join(__dirname, 'uploads')))

app.use('/api/files', filesRouter);

app.use(verifyJWT);
app.use('/api/user', userRouter);
app.use('/api', router);
app.use('/api/profile', profileRouter);

// Error handlers
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
});