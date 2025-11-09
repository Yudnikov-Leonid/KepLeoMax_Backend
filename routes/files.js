import express from 'express';
const router = express.Router();

import url from 'url';
import path from 'path';
import multer from "multer";
import verifyJWT from '../middleware/verifyJWT.js';
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    }, filename: (req, file, cb) => {
        const suffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const extension = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + suffix + extension);
    }
});
const upload = multer({ storage });

router.post('/single', verifyJWT, upload.single('file'), (req, res) => {
    res.status(201).json({ data: { path: req.file.filename } });
});

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

router.get('/:fileName', (req, res) => {
    const fileName = req.params.fileName;
    if (!fileName) {
        res.status(400).json({ message: 'fileName param is required' });
    }

    const imagePath = path.join(__dirname, '..', 'uploads', fileName);

    res.download(imagePath, (err) => {
        if (err) {
            console.error('Error downloading image:', err);
            res.status(500).json({message: `Error downloading image: ${err}`});
        }
    });
});

export default router;