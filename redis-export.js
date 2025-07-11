// redis-export.js
// Amaç: Redis'teki tüm aktif oturumları, kullanıcı detaylarıyla birlikte bir CSV dosyasına aktarmak.

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs/promises'); // Dosya yazma işlemleri için

// Veritabanı ve Redis bağlantı bilgilerini ve modellerini çağırıyoruz
dotenv.config();
const connectDB = require('./config/db');
const { redisClient, connectRedis } = require('./config/redis');
const User = require('./models/user.model');

// Bu ana fonksiyon, tüm işlemleri sırayla yapacak.
const exportSessionsToCsv = async () => {
    try {
        // 1. Adım: Veritabanlarına bağlan
        console.log('MongoDB ve Redis\'e bağlanılıyor...');
        await connectDB();
        await connectRedis();
        console.log('Bağlantılar başarılı.');

        // 2. Adım: Redis'teki tüm anahtarları (kullanıcı ID'leri) al
        const userIds = await redisClient.keys('*');

        if (userIds.length === 0) {
            console.log('Redis\'te aktif oturum bulunamadı.');
            return;
        }
        console.log(`${userIds.length} adet aktif oturum bulundu.`);

        // 3. Adım: Bu ID'lere sahip kullanıcıları MongoDB'den getir
        // $in operatörü, ID'si bu listede olan tüm kullanıcıları bulur.
        const users = await User.find({ '_id': { $in: userIds } });

        // Kullanıcıları daha hızlı bulmak için bir harita (map) oluşturalım
        const userMap = new Map();
        users.forEach(user => {
            userMap.set(user._id.toString(), {
                name: user.name,
                email: user.email
            });
        });
        
        console.log('Kullanıcı detayları MongoDB\'den çekildi.');

        // 4. Adım: CSV içeriğini oluşturma
        // Başlık satırı
        let csvContent = 'UserID,Name,Email,Token\n';
        
        // Her bir kullanıcı ID'si için token'ı Redis'ten al ve CSV satırını oluştur
        for (const userId of userIds) {
            const token = await redisClient.get(userId);
            const userDetails = userMap.get(userId);

            const name = userDetails ? userDetails.name : 'Bilinmiyor';
            const email = userDetails ? userDetails.email : 'Bilinmiyor';

            // Virgül içeren alanları tırnak içine alarak CSV formatını koruyoruz
            csvContent += `"${userId}","${name}","${email}","${token}"\n`;
        }

        // 5. Adım: CSV içeriğini dosyaya yazma
        await fs.writeFile('aktif_oturumlar.csv', csvContent, 'utf-8');
        console.log('Rapor başarıyla "aktif_oturumlar.csv" dosyasına kaydedildi.');

    } catch (error) {
        console.error('Rapor oluşturulurken bir hata oluştu:', error);
    } finally {
        // 6. Adım: Her durumda bağlantıları kapat
        await mongoose.disconnect();
        await redisClient.quit();
        console.log('Bağlantılar kapatıldı.');
    }
};

// Ana fonksiyonu çalıştır
exportSessionsToCsv();
