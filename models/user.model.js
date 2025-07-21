const { DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');

module.exports = (sequelize) => {
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
        isVerified: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        verificationToken: {
            type: DataTypes.STRING
        },
        verificationTokenExpires: {
            type: DataTypes.DATE
        }
    }, {
        hooks: {
            beforeCreate: async (user) => {
                if (user.password) {
                    const salt = await bcrypt.genSalt(12);
                    user.password = await bcrypt.hash(user.password, salt);
                }
            },
            beforeUpdate: async (user) => {
                if (user.changed('password')) {
                    const salt = await bcrypt.genSalt(12);
                    user.password = await bcrypt.hash(user.password, salt);
                }
            },
            
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