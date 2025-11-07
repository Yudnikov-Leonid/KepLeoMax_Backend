import express from 'express';
const router = express.Router();
import { createNewUser, login, logout, refreshToken } from '../controllers/authController.js'
import { registrationRules, validateRegistration } from '../middleware/validateRegistration.js';

router.post('/register', registrationRules, validateRegistration, createNewUser);
router.post('/login', registrationRules, validateRegistration, login);
router.post('/refresh', refreshToken);
router.post('/logout', logout);

export default router;