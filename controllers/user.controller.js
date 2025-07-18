// controllers/user.controller.js

const db = require('../models');
const {User} = db;
// === YENİ EKLENEN VE EKSİK OLAN SATIR ===
// bcrypt kütüphanesini çağırıyoruz, çünkü onu 'changePassword' içinde kullanacağız.
const bcrypt = require('bcrypt');

const getMe = async (req, res) => {
    res.status(200).json({
        message: "Kullanıcı bilgileri başarıyla getirildi.",
        user: req.user
    });
};

const getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll({});
        res.status(200).json({
            message: "Tüm kullanıcılar başarıyla getirildi.",
            count: users.length,
            users
        });
    } catch (error) {
        res.status(500).json({ message: 'Kullanıcılar getirilirken bir hata oluştu.' });
    }
};

const updateMe = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const updateData = {};
        if (name) {updateData.name = name;}
        if (email) {updateData.email = email;}
        if (password && password.trim() !== "") {
            updateData.password = password;
        }

        const userToUpdate = await User.findByPk(req.user.id);
        if (!userToUpdate) {
            return res.status(404).json({ message: 'Güncellenecek kullanıcı bulunamadı.' });
        }
        
        await userToUpdate.update(updateData);
        
        res.status(200).json({ message: 'Profil başarıyla güncellendi.', user: userToUpdate });
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ message: 'Bu e-posta adresi zaten başka bir kullanıcı tarafından kullanılıyor.' });
        }
        res.status(500).json({ message: 'Profil güncellenirken bir hata oluştu.' });
    }
};

const changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword, passwordConfirm } = req.body;

        if (!oldPassword || !newPassword || !passwordConfirm) {
            return res.status(400).json({ message: 'Lütfen tüm şifre alanlarını doldurun.' });
        }

        if (newPassword !== passwordConfirm) {
            return res.status(400).json({ message: 'Yeni şifreler eşleşmiyor.' });
        }

        const user = await User.scope('withPassword').findByPk(req.user.id);

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Mevcut şifreniz hatalı.' });
        }

        user.password = newPassword;
        await user.save();

        res.status(200).json({ message: 'Şifreniz başarıyla güncellendi.' });

    } catch (error) {
        console.error('Change Password Error:', error);
        res.status(500).json({ message: 'Şifre güncellenirken bir hata oluştu.' });
    }
};

const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await User.destroy({ where: { id: id } });
        if (result === 0) {
            return res.status(404).json({ message: 'Bu ID ile bir kullanıcı bulunamadı.' });
        }
        res.status(204).send();
    } catch (error) {
        console.error('Delete User Error:', error);
        res.status(500).json({ message: 'Kullanıcı silinirken bir hata oluştu.' });
    }
};

module.exports = {
    getMe,
    getAllUsers,
    updateMe,
    changePassword,
    deleteUser
};
