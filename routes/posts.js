import express from 'express';
import { createPost as createNewPost, deletePost, getPostsByUserId } from '../controllers/postsController.js';
const router = express.Router();

router.get('/byUserId', getPostsByUserId);
router.post('/', createNewPost);
router.delete('/', deletePost);

export default router;