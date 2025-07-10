const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// Controller'dan tüm fonksiyonları çağırıyoruz.
const {register,login,logout} = require('../controllers/auth.controller');
// 'protect' middleware'ini çağırıyoruz, çünkü çıkış yapmak için önce giriş yapmış olmak gerekir.
const { protect } = require('../middleware/auth.middleware');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/profile_pictures/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + extension);
    }
});

const upload = multer({ storage: storage });

router.post('/register', upload.single('profileImage'), register);

router.post('/login', login);

router.post('/logout', protect, logout);

module.exports = router;
