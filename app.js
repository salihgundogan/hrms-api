require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
// DÜZELTME: Artık redis.js'den hem istemciyi hem de fonksiyonu çağırıyoruz.
const { connectRedis } = require('./config/redis'); 
const path = require('path');

// Rotalar
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const leaveRoutes = require('./routes/leave.routes');

const app = express();

// Middleware'ler
app.use(express.json());
app.use('/public', express.static(path.join(__dirname, 'public')));

// Rota Tanımlamaları
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/leaves', leaveRoutes);

app.get('/', (req, res) => {
    res.send('İK Yönetim Sistemi API Ana Sayfası');
});

// === SUNUCUYU BAŞLATMA FONKSİYONU (NİHAİ VERSİYON) ===
const port = process.env.PORT || 5001;

const startServer = async () => {
    try {
        // 1. Adım: MongoDB bağlantısını bekle.
        await connectDB();
        
        // 2. Adım: Redis bağlantısını bekle.
        await connectRedis();

        // 3. Adım: ANCAK ikisi de başarılı olduktan SONRA, sunucuyu dinlemeye başlat.
        app.listen(port, () => {
            console.log(`Sunucu http://localhost:${port} adresinde çalışıyor.`);
        });

    } catch (error) {
        console.error("Sunucu başlatılamadı, veritabanı bağlantılarından biri kurulamadı.", error);
        process.exit(1);
    }
};

// Ana fonksiyonumuzu çağırarak her şeyi başlatıyoruz.
startServer();