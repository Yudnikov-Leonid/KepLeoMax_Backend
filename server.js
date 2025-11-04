import express from 'express';
import router from './routes/router.js';
import authRouter from './routes/auth.js';
import errorHandler from './middleware/error.js';
import notFound from './middleware/notFound.js';
import verifyJWT from './middleware/verifyJWT.js';
import cookieParser from 'cookie-parser';

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

app.use(verifyJWT);
app.use('/api', router);

// Error handlers
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
});