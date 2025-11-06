import express from 'express';
import { getProfile, editProfile } from '../controllers/profileController.js';
const router = express.Router();

router.get('/', getProfile);
router.post('/', editProfile);

export default router;