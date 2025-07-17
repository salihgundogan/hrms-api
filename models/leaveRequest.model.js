const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    // Değişken oluşturmak yerine, sequelize.define'ın sonucunu doğrudan geri döndürüyoruz.
    return sequelize.define('LeaveRequest', {
        startDate: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        endDate: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        reason: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM('pending', 'approved', 'rejected'),
            allowNull: false,
            defaultValue: 'pending',
        },
    });
};