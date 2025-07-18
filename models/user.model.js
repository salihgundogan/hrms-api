const { DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');

module.exports = (sequelize) => {
    // Değişken oluşturmak yerine, sequelize.define'ın sonucunu doğrudan geri döndürüyoruz.
    return sequelize.define('User', {
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true,
            },
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        role: {
            type: DataTypes.ENUM('employee', 'manager', 'hr_admin'),
            allowNull: false,
            defaultValue: 'employee',
            index: true
        },
        profilePicture: {
            type: DataTypes.STRING,
            defaultValue: '/public/defaults/default-avatar.png'
        },
    }, {
        hooks: {
            beforeCreate: async (user) => {
                if (user.password) {
                    const salt = await bcrypt.genSalt(10);
                    user.password = await bcrypt.hash(user.password, salt);
                }
            },
            beforeUpdate: async (user) => {
                // Sadece ve sadece 'password' alanı değiştirildiyse bu işlemi yap
                if (user.changed('password')) {
                    const salt = await bcrypt.genSalt(10);
                    user.password = await bcrypt.hash(user.password, salt);
                }
            }
        },
        defaultScope: {
            attributes: { exclude: ['password'] },
        },
        scopes: {
            withPassword: {
                attributes: {},
            },
        },
    });
};