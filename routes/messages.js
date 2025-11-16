import express from 'express';
import { getMessagesByChatId } from '../controllers/messagesController.js';
const router = express.Router();

router.get('/', getMessagesByChatId);

export default router;