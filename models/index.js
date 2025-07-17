const sequelize = require('../config/db');
const { Sequelize, DataTypes } = require('sequelize');

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Modelleri import et ve sequelize bağlantısını onlara geçir
db.User = require('./user.model.js')(sequelize, DataTypes);
db.LeaveRequest = require('./leaveRequest.model.js')(sequelize, DataTypes);

// === İLİŞKİLERİ (ASSOCIATIONS) TANIMLAMA ===
// Bu, SQL dünyasının en güçlü özelliğidir.

// Bir Yöneticinin birden çok çalışanı olabilir.
// Bu, User tablosuna 'managerId' adında bir sütun ekler.
db.User.hasMany(db.User, { as: 'teamMembers', foreignKey: 'managerId' });
db.User.belongsTo(db.User, { as: 'manager', foreignKey: 'managerId' });

// Bir Çalışanın birden çok izin talebi olabilir.
// Bu, LeaveRequest tablosuna 'employeeId' adında bir sütun ekler.
db.User.hasMany(db.LeaveRequest, { foreignKey: 'employeeId' });
db.LeaveRequest.belongsTo(db.User, { as: 'employee', foreignKey: 'employeeId' });

// Tüm veritabanı yapısını dışarıya açıyoruz.
module.exports = db;