import express from 'express';
import { getChat, getChats, getChatWithUser } from '../controllers/chatController.js';
const router = express.Router();

router.get('/', getChats);
router.get('/withId', getChat);
router.get('/withUser', getChatWithUser);

export default router;