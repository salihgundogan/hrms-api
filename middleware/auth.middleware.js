const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const { redisClient } = require('../config/redis'); 


const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization?.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id).select('-password');

            if (!user) {
                return res.status(401).json({ message: 'Bu token\'a sahip kullanıcı artık mevcut değil.' });
            }

            // === YENİ EKLENEN KISIM: REDIS KONTROLÜ ===
            // Redis'e gidip, bu kullanıcının ID'si ile kayıtlı olan token'ı alıyoruz.
            const redisToken = await redisClient.get(user._id.toString());

            // Eğer Redis'te böyle bir token yoksa (çıkış yapmış) veya
            // Redis'teki token ile istekteki token eşleşmiyorsa (eski bir token kullanıyor olabilir),
            // girişe izin verme.
            if (!redisToken || redisToken !== token) {
                return res.status(401).json({ message: 'Geçersiz oturum. Lütfen tekrar giriş yapın.' });
            }

            req.user = user;
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
        // Bu middleware çalıştığında, req.user'ın artık null olamayacağından eminiz.
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Bu işlemi yapmak için yetkiniz bulunmamaktadır.' });
        }
        next();
    };
};

module.exports = { protect, authorize };

