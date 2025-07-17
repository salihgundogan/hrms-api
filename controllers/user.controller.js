const db = require('../models');
const {User} = db
const getMe = async (req, res) => {
    // Bu fonksiyonun mantığı aynı kalır, çünkü veriyi middleware'den alıyor.
    res.status(200).json({
        message: "Kullanıcı bilgileri başarıyla getirildi.",
        user: req.user
    });
};

const getAllUsers = async (req, res) => {
    try {
        // Mongoose: User.find({})
        // Sequelize: User.findAll({})
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
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params; // Silinecek kullanıcının ID'si

        // Sequelize'da silme işlemi 'destroy' metodu ile yapılır.
        const result = await User.destroy({
            where: { id: id }
        });

        // Eğer result 0 ise, o ID ile bir kullanıcı bulunamamıştır.
        if (result === 0) {
            return res.status(404).json({ message: 'Bu ID ile bir kullanıcı bulunamadı.' });
        }

        // 204 "No Content" durum kodu, silme işlemi başarılı olduğunda
        // ve geriye bir içerik döndürülmediğinde kullanılır.
        res.status(204).send();

    } catch (error) {
        console.error('Delete User Error:', error);
        res.status(500).json({ message: 'Kullanıcı silinirken bir hata oluştu.' });
    }
};

module.exports = { getMe, getAllUsers, deleteUser };