const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization?.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Kullanıcıyı veritabanından buluyoruz.
            req.user = await User.findById(decoded.id).select('-password');

            // === YENİ VE KRİTİK KONTROL ===
            // Eğer token geçerli ama veritabanında böyle bir kullanıcı artık yoksa...
            if (!req.user) {
                return res.status(401).json({ message: 'Bu token\'a sahip kullanıcı artık mevcut değil.' });
            }

            // Her şey yolunda, bir sonraki adıma geç.
            next();

        } catch (error) {
            // Token geçersizse veya süresi dolmuşsa bu blok çalışır.
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
