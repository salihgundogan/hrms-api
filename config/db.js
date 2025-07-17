
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
    process.env.DB_NAME,      // Veritabanı adı (örn: 'hrms_db')
    process.env.DB_USER,      // Kullanıcı adı (örn: 'postgres')
    process.env.DB_PASSWORD,  // Şifre (örn: 'mysecretpassword')
    {
        host: process.env.DB_HOST, // Sunucu adresi (örn: 'postgres' - docker servis adı)
        dialect: 'postgres',       // Hangi SQL veritabanını kullandığımızı belirtiyoruz.
        
        // Bu ayar, Sequelize'ın her veritabanı sorgusunu konsola yazdırmasını engeller.
        // Bu, loglarımızın daha temiz kalmasını sağlar.
        logging: false 
    }
);

// Oluşturduğumuz bu ana bağlantı objesini (sequelize), projenin diğer
// dosyalarında kullanabilmek için dışarıya açıyoruz (export).
module.exports = sequelize;
