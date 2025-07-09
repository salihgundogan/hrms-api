const User = require('../models/user.model');

const getMe = async (req, res) => {
    res.status(200).json({
        message: "Kullanıcı bilgileri başarıyla getirildi.",
        user: req.user
    });
};

const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({});
        res.status(200).json({
            message: "Tüm kullanıcılar başarıyla getirildi.",
            count: users.length,
            users
        });
    } catch (error) {
        res.status(500).json({ message: 'Kullanıcılar getirilirken bir hata oluştu.' });
    }
};

module.exports = {
    getMe,
    getAllUsers,
};