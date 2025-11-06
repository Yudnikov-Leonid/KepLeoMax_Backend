import express from 'express';
import router from './routes/router.js';
import authRouter from './routes/auth.js';
import profileRouter from './routes/profile.js';
import errorHandler from './middleware/error.js';
import notFound from './middleware/notFound.js';
import verifyJWT from './middleware/verifyJWT.js';
import cookieParser from 'cookie-parser';
import pool from './db.js';

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
app.use('/api/user', authRouter);

app.get('/setup', async (req, res) => {
    await pool.query('CREATE DATABASE KLM_db;');
    await pool.query('CREATE TABLE users (id SERIAL PRIMARY KEY, email VARCHAR(100), password VARCHAR(100), refresh_token VARCHAR(1000) NULL)');
    await pool.query('CREATE TABLE profiles (id SERIAL PRIMARY KEY, user_id INT, username VARCHAR(100), description VARCHAR(100))');
    res.json({message: 'table created'});
});

app.use(verifyJWT);
app.use('/api', router);
app.use('/profile', profileRouter);

// Error handlers
// app.use(notFound);
// app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
});