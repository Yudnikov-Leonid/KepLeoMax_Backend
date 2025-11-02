import express from 'express';
import router from './routes/router.js';
import authRouter from './routes/auth.js';
import errorHandler from './middleware/error.js';
import notFound from './middleware/notFound.js';
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

// Routes
//app.use('/api', router);
app.use('/api/user', authRouter);

// Error handlers
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
});