// controllers/auth.controller.js

// Gerekli tüm modülleri ve modelleri çağırıyoruz
const db = require('../models');
const { User } = db;
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('../utils/email');
const { redisClient } = require('../config/redis');

// ========================================================
// 1. YENİ KULLANICI KAYDI (REGISTER)
// ========================================================
exports.register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'Bu e-posta adresi zaten kullanılıyor.' });
        }

        let profilePicturePath;
        if (req.file) {
            profilePicturePath = `/uploads/profile_pictures/${req.file.filename}`;
        }

        // 1. Doğrulama token'ını oluşturun.
        const verificationToken = crypto.randomBytes(32).toString('hex');

        // 2. Token'ı hash'leyin.
        const hashedVerificationToken = crypto
            .createHash('sha256')
            .update(verificationToken)
            .digest('hex');
        
        // 3. Yeni kullanıcıyı, hash'lenmiş token ile birlikte oluşturun.
        // 'beforeCreate' hook'u şifreyi otomatik olarak hash'leyecektir.
        const newUser = await User.create({
            name,
            email,
            password,
            role,
            profilePicture: profilePicturePath,
            verificationToken: hashedVerificationToken, // Hash'lenmiş token'ı kaydedin
            verificationTokenExpires: Date.now() + 10 * 60 * 1000 // 10 dakika
        });

        // 4. E-postayı, hash'lenmemiş (orijinal) token ile gönderin.
        const verificationURL = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
        const message = `Hesabınızı doğrulamak için lütfen bu linke tıklayın: ${verificationURL}\n\nBu link 10 dakika sonra geçersiz olacaktır.`;

        await sendEmail({
            email: newUser.email,
            subject: 'İK Portalı Hesap Doğrulama',
            text: message
        });

        // 5. İkinci 'save' çağrısını kaldırın. 'create' işlemi zaten kaydı tamamladı.

        return res.status(201).json({ message: 'Kayıt başarılı! Lütfen hesabınızı doğrulamak için e-postanızı kontrol edin.' });

    } catch (error) {
        console.error('Register error:', error);
        return res.status(500).json({ message: 'Sunucuda bir hata oluştu.', error: error.message });
    }
};
// ========================================================
// 2. E-POSTA DOĞRULAMA (VERIFY EMAIL)
// ========================================================
exports.verifyEmail = async (req, res) => {
    try {
        const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
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
        res.status(500).json({ message: 'Sunucuda bir hata oluştu.' });
    }
};
// ========================================================
// 3. KULLANICI GİRİŞİ (LOGIN)
// ========================================================
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Şifre sütununu da getirmek için özel scope'u kullanıyoruz
        const user = await User.scope('withPassword').findOne({ where: { email } });

        // Kullanıcının varlığını ve şifrenin doğruluğunu tek seferde kontrol et
        const isMatch = user && (await bcrypt.compare(password, user.password));
        if (!isMatch) {
            return res.status(401).json({ message: 'E-posta veya şifre hatalı.' });
        }

        // Hesabın doğrulanmış olup olmadığını kontrol et
        if (!user.isVerified) {
            return res.status(403).json({ 
                message: 'Giriş yapılamadı. Lütfen hesabınızı doğrulamak için e-postanızı kontrol edin.' 
            });
        }
        
        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        // Token'ı Redis'e kaydet
        await redisClient.set(user.id.toString(), token, { EX: 60 * 60 * 24 }); // 24 saat

        return res.status(200).json({ message: 'Giriş başarılı.', token });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ message: 'Sunucuda bir hata oluştu.', error: error.message });
    }
};

// ========================================================
// 4. KULLANICI ÇIKIŞI (LOGOUT)
// ========================================================
exports.logout = async (req, res) => {
    try {
        // Redis'ten kullanıcının oturumunu sil
        await redisClient.del(req.user.id.toString());
        return res.status(200).json({ message: 'Çıkış başarılı.' });
    } catch (error) {
        console.error('Logout error:', error);
        return res.status(500).json({ message: 'Sunucuda bir hata oluştu.', error: error.message });
    }
};

// ========================================================
// 5. ŞİFREMİ UNUTTUM (FORGOT PASSWORD)
// ========================================================
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ where: { email } });

        // Kullanıcı yoksa veya doğrulanmamışsa, güvenlik için yine de başarılı mesajı gönder
        if (!user?.isVerified) {
            return res.status(200).json({ message: 'Eğer bu e-posta adresi sistemimizde kayıtlı ve doğrulanmış ise, size bir şifre sıfırlama linki gönderilmiştir.' });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 dakika
        await user.save({ hooks: false });

        const resetURL = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
        const message = `Şifrenizi sıfırlamak için lütfen bu linke tıklayın: ${resetURL}\n\nBu link 10 dakika sonra geçersiz olacaktır.`;

        await sendEmail({
            email: user.email,
            subject: 'İK Portalı Şifre Sıfırlama İsteği',
            text: message
        });

        res.status(200).json({ message: 'Eğer bu e-posta adresi sistemimizde kayıtlı ve doğrulanmış ise, size bir şifre sıfırlama linki gönderilmiştir.' });
    } catch (error) {
        console.error('Forgot Password Error:', error);
        return res.status(200).json({ message: 'Eğer bu e-posta adresi sistemimizde kayıtlı ve doğrulanmış ise, size bir şifre sıfırlama linki gönderilmiştir.' });
    }
};

// ========================================================
// 6. ŞİFREYİ SIFIRLAMA (RESET PASSWORD)
// ========================================================
exports.resetPassword = async (req, res) => {
    try {
        const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
        const user = await User.findOne({
            where: {
                passwordResetToken: hashedToken,
                passwordResetExpires: { [db.Sequelize.Op.gt]: Date.now() }
            }
        });

        if (!user) {
            return res.status(400).json({ message: 'Şifre sıfırlama linki geçersiz veya süresi dolmuş.' });
        }

        // Yeni şifreyi ayarla. Modeldeki 'beforeUpdate' kancası hash'lemeyi yapacak.
        user.password = req.body.password;
        user.passwordResetToken = null;
        user.passwordResetExpires = null;
        await user.save();

        res.status(200).json({ message: 'Şifreniz başarıyla sıfırlandı! Artık yeni şifrenizle giriş yapabilirsiniz.' });
    } catch (error) {
        console.error('Reset Password Error:', error);
        return res.status(500).json({ message: 'Sunucuda bir hata oluştu.' });
    }
};
