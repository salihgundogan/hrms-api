const User = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'Bu e-posta adresi zaten kullanılıyor.' });
        }
        let profilePicturePath;
        if (req.file) {
            profilePicturePath = `/uploads/profile_pictures/${req.file.filename}`;
        }        
        const user = await User.create({ name, email, password, role,profilePicture: profilePicturePath });
        res.status(201).json({
            message: 'Kullanıcı başarıyla oluşturuldu.',
            user: { id: user._id, name: user.name, email: user.email, role: user.role }
        });
    } catch (error) {
        res.status(500).json({ message: 'Sunucuda bir hata oluştu.', error: error.message });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email }).select('+password');
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: 'E-posta veya şifre hatalı.' });
        }
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );
        res.status(200).json({ message: 'Giriş başarılı.', token });
    } catch (error) {
        res.status(500).json({ message: 'Sunucuda bir hata oluştu.', error: error.message });
    }
};

module.exports = {
    register,
    login,
};
