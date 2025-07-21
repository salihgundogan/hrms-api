const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
    'hrms_db',
    'postgres',
    'mysecretpassword',
    {
        host: 'postgres',
        dialect: 'postgres',
        logging: false
    }
);

module.exports = sequelize;
