const User = require('../models/user.model');

const getMe = async (req, res) => {
    res.status(200).json({
        message: "Kullanıcı bilgileri başarıyla getirildi.",
        user: req.user
    });
};

const getAllUsers = async (req, res) => {
    try {
        // === TEST İÇİN GEÇİCİ YAVAŞLATMA ===
        console.log("Tüm kullanıcıları listeleme isteği geldi, 3 saniye bekletiliyor...");
        await new Promise(resolve => setTimeout(resolve, 3000)); // 3 saniye bekle
        // ===================================

        // 1. Veritabanından tüm kullanıcıları al.
        const users = await User.find({});

        // 2. (EKSİK OLAN ADIM) Bulduğun kullanıcıları,
        //    başarılı bir 200 durum kodu ile cevap olarak gönder.
        res.status(200).json({
            message: "Tüm kullanıcılar başarıyla getirildi.",
            count: users.length,
            users: users // veya kısaca sadece 'users'
        });

    } catch (error) {
        // Eğer bir hata olursa, 500 durum kodu ile bir hata mesajı gönder.
        res.status(500).json({ message: 'Kullanıcılar getirilirken bir hata oluştu.' });
    }
};

module.exports = {
    getMe,
    getAllUsers,
};