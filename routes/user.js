import express from 'express';
import { addFCMToken, getUser, searchUsers, updateUser, deleteFCMToken } from '../controllers/userController.js';
const router = express.Router();


router.get('/', getUser);
router.get('/search', searchUsers);
router.post('/edit', updateUser);
router.post('/fcmToken', addFCMToken);
router.delete('/fcmToken', deleteFCMToken);

export default router;