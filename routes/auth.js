import express from 'express';
const router = express.Router();
import { createNewUser, login, logout, refreshToken } from '../controllers/authController.js'

router.post('/register', createNewUser);
router.post('/login', login);
router.post('/refresh', refreshToken);
router.post('/logout', logout);

export default router;