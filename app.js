
require('dotenv').config();
const express = require('express');
const cors = require('cors'); // cors'u çağırıyoruz.
const path = require('path');
const db = require('./models');
const { connectRedis } = require('./config/redis'); 

// Rotalar
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const leaveRoutes = require('./routes/leave.routes');

const app = express();

// === YENİ VE GÜNCELLENMİŞ CORS YAPILANDIRMASI ===
// Hangi adreslerin bizim API'mize erişebileceğini bir listede tutuyoruz.
const allowedOrigins = [
    'http://localhost:5173', // Yerel geliştirme için
    'https://hrms-frontend-j5zh.onrender.com'   
];

const corsOptions = {
  origin: function (origin, callback) {
    // Eğer istek yapan adres (origin) izin verilenler listesindeyse veya
    // origin yoksa (sunucunun kendisinden gelen istekler gibi), devam et.
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      callback(new Error('Bu site tarafından CORS politikası engellendi.'))
    }
  }
};

// cors middleware'ini bu yeni seçeneklerle kullanıyoruz.
app.use(cors(corsOptions));
// ===============================================

// Diğer middleware'ler...
app.use(express.json());
app.use('/public', express.static(path.join(__dirname, 'public')));

// Rota Tanımlamaları
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/leaves', leaveRoutes);

// Ana sayfa rotası
app.get('/', (req, res) => {
    res.send('İK Yönetim Sistemi API - PostgreSQL Versiyonu');
});

const port = process.env.PORT || 5001;

// Sunucuyu başlatan ana fonksiyon
const startServer = async () => {
    try {
        // 1. Adım: Veritabanı bağlantısını test et.
        await db.sequelize.authenticate();
        console.log('PostgreSQL bağlantısı başarıyla kuruldu.');

        // 2. Adım (EN ÖNEMLİ YENİ ADIM): Modelleri veritabanıyla senkronize et.
        // Bu komut, models klasöründeki tanımlamalara bakar ve veritabanında
        // eksik olan tabloları veya sütunları oluşturur.
        // { force: false } ayarı, mevcut tabloları silmemesini söyler.
        // Geliştirme aşamasında bazen { force: true } kullanılarak tablolar sıfırlanır.
        await db.sequelize.sync({ force: false });
        console.log('Veritabanı senkronize edildi. (Tablolar hazır)');

        // 3. Adım: Redis bağlantısını bekle.
        await connectRedis();

        // 4. Adım: Her şey hazır olduğunda, sunucuyu dinlemeye başlat.
        app.listen(port, '0.0.0.0', () => {
            console.log(`Sunucu http://localhost:${port} adresinde çalışıyor.`);
        });

    } catch (error) {
        console.error("Sunucu başlatılamadı:", error);
        process.exit(1);
    }
};

// Ana fonksiyonu çağırarak her şeyi başlatıyoruz.
startServer();