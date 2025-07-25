// routes/auth.routes.js

const express = require('express');
const router = express.Router();

// DÜZELTME: Yeni 'forgotPassword' ve 'resetPassword' fonksiyonlarını da çağırıyoruz.
const { 
    register, 
    verifyEmail, 
    login, 
    logout, 
    forgotPassword, 
    resetPassword 
} = require('../controllers/auth.controller');

const { protect } = require('../middleware/auth.middleware');

// Mevcut rotalar (Değişiklik yok)
router.post('/register', register);
router.get('/verify-email/:token', verifyEmail);
router.post('/login', login);
router.post('/logout', protect, logout);

// --- YENİ EKLENEN ŞİFRE SIFIRLAMA ROTALARI ---

// 1. Kullanıcı, şifre sıfırlama e-postası talep etmek için bu adrese e-postasını gönderir.
router.post('/forgot-password', forgotPassword);

// 2. Kullanıcı, e-postadaki linke tıkladıktan sonra, yeni şifresini bu adrese gönderir.
//    URL'in içinde dinamik bir sıfırlama token'ı bekliyoruz.
router.put('/reset-password/:token', resetPassword);

module.exports = router;