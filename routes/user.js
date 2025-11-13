import express from 'express';
import { getUser, searchUsers, updateUser } from '../controllers/userController.js';
const router = express.Router();


router.get('/', getUser);
router.post('/edit', updateUser);
router.get('/search', searchUsers);

export default router;