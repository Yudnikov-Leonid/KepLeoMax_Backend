import express from 'express';
import { getUser, updateUser } from '../controllers/userController.js';
const router = express.Router();


router.get('/', getUser);
router.post('/edit', updateUser);

export default router;