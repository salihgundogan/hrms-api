const jwt = require('jsonwebtoken');
// DÜZELTME: Artık tüm modellerimizi, ilişkileri kuran 'models/index.js' dosyasından alıyoruz.
const db = require('../models');
const {User} = db;
const { redisClient } = require('../config/redis');

const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization?.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // DÜZELTME: Mongoose'un .findById(id) komutu yerine,
            // Sequelize'ın .findByPk(id) (Find by Primary Key) komutunu kullanıyoruz.
            const user = await User.findByPk(decoded.id);

            if (!user) {
                return res.status(401).json({ message: 'Bu token\'a sahip kullanıcı artık mevcut değil.' });
            }

            // DÜZELTME: Mongoose'un ._id'si yerine, Sequelize'ın standart .id'sini kullanıyoruz.
            const redisToken = await redisClient.get(user.id.toString());

            if (!redisToken || redisToken !== token) {
                return res.status(401).json({ message: 'Geçersiz oturum. Lütfen tekrar giriş yapın.' });
            }

            // req.user'a şifre olmadan kullanıcıyı ekliyoruz.
            // Modeldeki 'defaultScope' bunu zaten yapıyor ama burada da emin olabiliriz.
            const { password, ...userWithoutPassword } = user.get({ plain: true });
            req.user = userWithoutPassword;
            
            next();

        } catch (error) {
            return res.status(401).json({ message: 'Yetkiniz yok, token geçersiz.' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Yetkiniz yok, token bulunamadı.' });
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        // Bu fonksiyonun mantığı veritabanından bağımsız olduğu için aynı kalıyor.
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Bu işlemi yapmak için yetkiniz bulunmamaktadır.' });
        }
        next();
    };
};

module.exports = { protect, authorize };
