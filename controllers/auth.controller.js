// controllers/auth.controller.js

const User = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { redisClient } = require('../config/redis'); 

const register = async (req, res) => {
    try {
        // Gelen isteğin gövdesinden (body) ve dosyasından (file) bilgileri alıyoruz.
        const { name, email, password, role } = req.body;

        // E-posta veya şifre gelmemişse hata döndür.
        if (!email || !password || !name) {
            return res.status(400).json({ message: 'İsim, e-posta ve şifre alanları zorunludur.' });
        }

        // Bu e-posta ile daha önce bir kullanıcı kaydedilmiş mi diye kontrol et.
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'Bu e-posta adresi zaten kullanılıyor.' });
        }

        // Yüklenecek dosya yolu için bir değişken oluşturalım.
        let profilePicturePath;
        if (req.file) {
            // Veritabanına URL'den erişilebilecek göreceli yolu kaydediyoruz.
            profilePicturePath = `/uploads/profile_pictures/${req.file.filename}`;
        }

        // Yeni bir kullanıcı oluştur.
        // Şifrenin hash'lenmesi işlemi modelin içindeki pre-save hook'u ile otomatik olarak yapılır.
        const user = await User.create({
            name,
            email,
            password,
            role,
            profilePicture: profilePicturePath
        });

        // Başarılı olduğuna dair 201 "Created" durum kodu ile yeni kullanıcıyı geri dön.
        // Cevapta şifreyi göndermiyoruz.
        res.status(201).json({
            message: 'Kullanıcı başarıyla oluşturuldu.',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                profilePicture: user.profilePicture
            }
        });

    } catch (error) {
        // Herhangi bir hata olursa, 500 "Server Error" hatası gönder.
        res.status(500).json({ message: 'Sunucuda bir hata oluştu.', error: error.message });
    }
};


// === 2. KULLANICI GİRİŞİ FONKSİYONU (LOGIN) ===
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email }).select('+password');

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: 'E-posta veya şifre hatalı.' });
        }

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        await redisClient.set(user._id.toString(), token, {
            EX: 86400, // 1 gün
        });

        res.status(200).json({ message: 'Giriş başarılı.', token });
    } catch (error) {
        res.status(500).json({ message: 'Sunucuda bir hata oluştu.', error: error.message });
    }
};

// === 3. KULLANICI ÇIKIŞI FONKSİYONU (LOGOUT) ===
const logout = async (req, res) => {
    try {
        await redisClient.del(req.user.id);
        res.status(200).json({ message: 'Çıkış başarılı.' });
    } catch (error) {
        res.status(500).json({ message: 'Sunucuda bir hata oluştu.', error: error.message });
    }
};

// Tüm fonksiyonları dışarıya açıyoruz.
module.exports = {
    register,
    login,
    logout,
};
