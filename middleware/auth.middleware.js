// middleware/auth.middleware.js

const jwt = require('jsonwebtoken');
const db = require('../models');
const {User} = db;
const { redisClient } = require('../config/redis');

exports.protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization?.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findByPk(decoded.id);

            if (!user) {
                return res.status(401).json({ message: 'Bu token\'a sahip kullanıcı artık mevcut değil.' });
            }
            const redisToken = await redisClient.get(user.id.toString());
            if (!redisToken || redisToken !== token) {
                return res.status(401).json({ message: 'Geçersiz oturum. Lütfen tekrar giriş yapın.' });
            }
            req.user = user;
            return next();

        } catch (error) {
            return res.status(401).json({ message: 'Yetkiniz yok, token geçersiz veya süresi dolmuş.' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Yetkiniz yok, token bulunamadı.' });
    }
};

exports.isVerified = (req, res, next) => {
    if (!req.user.isVerified) {
        return res.status(403).json({ 
            message: 'Erişim engellendi. Lütfen önce hesabınızı doğrulayın.' 
        });
    }
    next();
};


exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Bu işlemi yapmak için yetkiniz bulunmamaktadır.' });
        }
        next();
    };
};
