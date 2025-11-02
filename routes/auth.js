import express from 'express';
const router = express.Router();
import { createNewUser, login } from '../comtrollers/authController.js'

router.post('/register', createNewUser);
router.post('/login', login);

export default router;