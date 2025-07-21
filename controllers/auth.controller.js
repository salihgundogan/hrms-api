const db = require('../models');
const { User } = db;
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/email');
const crypto = require('crypto'); 
const { redisClient } = require('../config/redis');

// --- REGISTER FONKSİYONU ---
// --- REGISTER FONKSİYONU ---
exports.register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'Bu e‑posta adresi zaten kullanılıyor.' });
        }

        // 1. Yüklenecek dosya yolu için bir değişken oluşturalım.
        let profilePicturePath;
        if (req.file) {
            // Veritabanına, URL'den erişilebilecek göreceli yolu kaydediyoruz.
            profilePicturePath = `/uploads/profile_pictures/${req.file.filename}`;
        }

        // 2. Yeni kullanıcıyı, resim yoluyla birlikte oluştur.
        // Şifre, modeldeki 'beforeCreate' hook'u sayesinde otomatik olarak hash'lenir.
        const newUser = await User.create({
            name,
            email,
            password,
            role,
            profilePicture: profilePicturePath
        });

        // 3. Kullanıcı için benzersiz bir doğrulama token'ı oluştur.
        const verificationToken = crypto.randomBytes(32).toString('hex');

        // 4. Bu token'ı, hash'leyerek veritabanına kaydet.
        newUser.verificationToken = crypto
            .createHash('sha256')
            .update(verificationToken)
            .digest('hex');
        
        newUser.verificationTokenExpires = Date.now() + 10 * 60 * 1000;
        await newUser.save({ hooks: false });

        const verificationURL = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
        const message = `Hesabınızı doğrulamak için lütfen bu linke tıklayın: ${verificationURL}\n\nBu link 10 dakika sonra geçersiz olacaktır.`;

        await sendEmail({
            email: newUser.email,
            subject: 'İK Portalı Hesap Doğrulama',
            text: message
        });

        return res.status(201).json({ message: 'Kayıt başarılı! Lütfen hesabınızı doğrulamak için e-postanızı kontrol edin.' });

    } catch (error) {
        console.error('Register error:', error);
        return res.status(500).json({ message: 'Sunucuda bir hata oluştu.', error: error.message });
    }
};

exports.verifyEmail = async (req, res) => {
    try {
        const hashedToken = crypto
            .createHash('sha256')
            .update(req.params.token)
            .digest('hex');

        const user = await User.findOne({
            where: {
                verificationToken: hashedToken,
                verificationTokenExpires: { [db.Sequelize.Op.gt]: Date.now() }
            }
        });
        
        if (!user) {
            return res.status(400).json({ message: 'Doğrulama linki geçersiz veya süresi dolmuş.' });
        }

        user.isVerified = true;
        user.verificationToken = null;
        user.verificationTokenExpires = null;
        await user.save({ hooks: false });

        res.status(200).json({ message: 'Hesabınız başarıyla doğrulandı! Artık giriş yapabilirsiniz.' });

    } catch (error) {
        console.error('Verify Email error:', error);
        return res.status(500).json({ message: 'Sunucuda bir hata oluştu.' });
    }
};


exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.scope('withPassword').findOne({ where: { email } });
        const isMatch = user ? await bcrypt.compare(password, user.password) : false;

        if (!isMatch) {
            return res.status(401).json({ message: 'E‑posta veya şifre hatalı.' });
        }

        // === YENİ EKLENEN ANLIK KONTROL ===
        // Eğer şifre doğru ama kullanıcı hesabını doğrulamamışsa...
        if (!user.isVerified) {
            // 403 Forbidden hatası ile bir uyarı mesajı gönder.
            return res.status(403).json({ 
                message: 'Giriş yapılamadı. Lütfen hesabınızı doğrulamak için e-postanızı kontrol edin.' 
            });
        }
        
        // Eğer bu noktaya geldiyse, kullanıcı hem doğru şifreyi girdi hem de hesabı doğrulanmış demektir.
        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
        await redisClient.set(user.id.toString(), token, { EX: 60 * 60 * 24 });
        return res.status(200).json({ message: 'Giriş başarılı.', token });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ message: 'Sunucuda bir hata oluştu.' });
    }
};

exports.logout = async (req, res) => {
try {
    await redisClient.del(req.user.id.toString());
    return res.status(200).json({ message: 'Çıkış başarılı.' });
} catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ message: 'Sunucuda bir hata oluştu.', error: error.message });
}
};

module.exports = {
    register: exports.register,
    verifyEmail: exports.verifyEmail,
    login: exports.login,
    logout: exports.logout
};