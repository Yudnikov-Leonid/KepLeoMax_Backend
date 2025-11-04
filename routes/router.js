import express from 'express';
const router = express.Router();

router.get('/getData', (req, res) => {
    res.send('hello from KepLeoMax');
});

export default router;