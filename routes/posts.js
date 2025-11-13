import express from 'express';
import { createPost as createNewPost, deletePost, getPosts, getPostsByUserId, updatePost } from '../controllers/postsController.js';
const router = express.Router();

router.get('/byUserId', getPostsByUserId);
router.get('/', getPosts);
router.post('/', createNewPost);
router.delete('/', deletePost);
router.put('/', updatePost);

export default router;