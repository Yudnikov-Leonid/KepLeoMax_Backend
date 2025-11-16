import express from 'express';
import { getChats, getChatWithUser } from '../controllers/chatController.js';
const router = express.Router();

router.get('/', getChats);
router.get('/withUser', getChatWithUser);

export default router;