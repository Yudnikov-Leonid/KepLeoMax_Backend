import express from 'express';
import { createPost as createNewPost, getPostsByUserId } from '../controllers/postsController.js';
const router = express.Router();

router.get('/byUserId', getPostsByUserId);
router.post('/', createNewPost);

export default router;