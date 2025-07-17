const db = require('../models');
const { User } = db;
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { redisClient } = require('../config/redis');

exports.register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'Bu e‑posta adresi zaten kullanılıyor.' });
        }

        // DÜZELTME: Manuel hash'leme satırını siliyoruz.
        // const hashedPassword = await bcrypt.hash(password, 10);

        // DÜZELTME: User.create'e şifreyi düz metin olarak veriyoruz.
        // Modelin içindeki 'beforeCreate' hook'u hash'leme işini otomatik olarak yapacak.
        const newUser = await User.create({
            name,
            email,
            password, // Düz metin şifre
            role,
        });

        const userData = newUser.get({ plain: true });
        delete userData.password;

        return res.status(201).json({ message: 'Kullanıcı başarıyla oluşturuldu.', user: userData });
    } catch (error) {
        console.error('Register error:', error);
        return res.status(500).json({ message: 'Sunucuda bir hata oluştu.', error: error.message });
    }
};

// ─────────────── LOGIN ───────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Şifre sütunu dâhil gelsin diye kendi scope’unu kullandık
    const user = await User.scope('withPassword').findOne({ where: { email } });

    const isMatch = user && (await bcrypt.compare(password, user.password));
    if (!isMatch) {
      return res.status(401).json({ message: 'E‑posta veya şifre hatalı.' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Redis’e token yaz
    await redisClient.set(user.id.toString(), token, { EX: 60 * 60 * 24 }); // 24 saat

    return res.status(200).json({ message: 'Giriş başarılı.', token });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Sunucuda bir hata oluştu.', error: error.message });
  }
};

// ─────────────── LOGOUT ───────────────
exports.logout = async (req, res) => {
  try {
    await redisClient.del(req.user.id.toString());
    return res.status(200).json({ message: 'Çıkış başarılı.' });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ message: 'Sunucuda bir hata oluştu.', error: error.message });
  }
};