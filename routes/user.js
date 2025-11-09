import express from 'express';
import { getUser, updateUsername } from '../controllers/userController.js';
const router = express.Router();


router.get('/', getUser);
router.post('/edit', updateUsername);

export default router;