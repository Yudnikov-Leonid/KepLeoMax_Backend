import express from 'express';
import { updateUsername } from '../controllers/userController.js';
const router = express.Router();

router.post('/edit', updateUsername);

export default router;