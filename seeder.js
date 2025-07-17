// seeder.js
// Amaç: Veritabanını, sunum için zengin ve ilişkisel bir veri setiyle doldurmak.

const db = require('./models');
const { faker } = require('@faker-js/faker');
const bcrypt = require('bcrypt');

// Bu betiği çalıştırmadan önce, terminale `npm install @faker-js/faker` yazarak
// faker kütüphanesini projeye eklemeniz gerekir.

// Veri ekleme fonksiyonu
const importData = async () => {
    try {
        console.log('Mevcut veriler siliniyor...');
        // Önce mevcut tüm veriyi silelim ki tekrar tekrar eklenmesin.
        // { truncate: true, cascade: true } ayarı, ilişkili tablolardaki
        // verileri de güvenli bir şekilde siler.
        await db.LeaveRequest.destroy({ where: {}, truncate: true, cascade: true });
        await db.User.destroy({ where: {}, truncate: true, cascade: true });
        console.log('Mevcut veriler başarıyla silindi.');

        // === 1. ADIM: KULLANICI VERİSİNİ HAZIRLAMA (DÜZ METİN ŞİFRELERLE) ===
        const usersToCreate = [];
        const password = 'password123'; // Tüm kullanıcılar için aynı şifre

        // 5 HR Admin
        for (let i = 0; i < 5; i++) {
            usersToCreate.push({
                name: faker.person.fullName(),
                email: faker.internet.email().toLowerCase(),
                password: password,
                role: 'hr_admin',
                profilePicture: '/public/seed-images/hr.jpg'
            });
        }

        // 5 Manager
        for (let i = 0; i < 5; i++) {
            usersToCreate.push({
                name: faker.person.fullName(),
                email: faker.internet.email().toLowerCase(),
                password: password,
                role: 'manager',
                profilePicture: '/public/seed-images/manager1.jpg'
            });
        }

        // 15 Employee
        for (let i = 0; i < 15; i++) {
            usersToCreate.push({
                name: faker.person.fullName(),
                email: faker.internet.email().toLowerCase(),
                password: password,
                role: 'employee',
                profilePicture: '/public/seed-images/employee1.jpg'
            });
        }

        // === 2. ADIM: ŞİFRELERİ MANUEL OLARAK HASH'LEME ===
        // Sequelize'ın bulkCreate metodu hook'ları tetiklemediği için bu en güvenilir yöntemdir.
        console.log('Şifreler hashleniyor...');
        const usersWithHashedPasswords = await Promise.all(
            usersToCreate.map(async (user) => {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(user.password, salt);
                return user;
            })
        );
        
        // === 3. ADIM: HAZIR KULLANICILARI VERİTABANINA EKLEME ===
        console.log('Kullanıcılar oluşturuluyor...');
        const createdUsers = await db.User.bulkCreate(usersWithHashedPasswords);
        console.log(`${createdUsers.length} kullanıcı başarıyla oluşturuldu.`);

        // === 4. ADIM: YÖNETİCİ-ÇALIŞAN İLİŞKİLERİNİ KURMA ===
        console.log('Yönetici atamaları yapılıyor...');
        const managers = await db.User.findAll({ where: { role: 'manager' } });
        const employees = await db.User.findAll({ where: { role: 'employee' } });

        for (let i = 0; i < employees.length; i++) {
            const employee = employees[i];
            const manager = managers[i % managers.length]; // Her çalışana sırayla bir yönetici ata
            await employee.update({ managerId: manager.id });
        }
        console.log('Yönetici atamaları tamamlandı.');
        
        // === 5. ADIM: İZİN TALEPLERİNİ OLUŞTURMA ===
        console.log('İzin talepleri oluşturuluyor...');
        const leaveRequestsToCreate = [];
        const leaveReasons = ['Yıllık İzin', 'Hastalık Raporu', 'Mazeret İzni', 'Doğum İzni', 'Babalık İzni', 'Evlilik İzni'];
        const statuses = ['pending', 'approved', 'rejected'];

        for (const employee of employees) {
            for (let i = 0; i < 2; i++) { // Her çalışan için 2'şer izin talebi
                const startDate = faker.date.soon({ days: 60 });
                const endDate = new Date(startDate);
                endDate.setDate(startDate.getDate() + faker.number.int({ min: 1, max: 5 }));

                leaveRequestsToCreate.push({
                    employeeId: employee.id,
                    startDate: startDate,
                    endDate: endDate,
                    reason: faker.helpers.arrayElement(leaveReasons),
                    status: faker.helpers.arrayElement(statuses)
                });
            }
        }

        await db.LeaveRequest.bulkCreate(leaveRequestsToCreate);
        console.log(`${leaveRequestsToCreate.length} izin talebi başarıyla oluşturuldu.`);
        
        console.log('\nVeri ekleme işlemi başarıyla tamamlandı!');

    } catch (error) {
        console.error('\nHata:', error);
    } finally {
        // Her durumda veritabanı bağlantısını kapat
        await db.sequelize.close();
        console.log('Veritabanı bağlantısı kapatıldı.');
    }
};

// Veritabanındaki veriyi silen fonksiyon
const deleteData = async () => {
    try {
        console.log('Mevcut veriler siliniyor...');
        await db.LeaveRequest.destroy({ where: {}, truncate: true, cascade: true });
        await db.User.destroy({ where: {}, truncate: true, cascade: true });
        console.log('Veri başarıyla silindi!');
    } catch (error) {
        console.error('Hata:', error);
    } finally {
        await db.sequelize.close();
        console.log('Veritabanı bağlantısı kapatıldı.');
    }
};

// Komut satırından gelen argümanı kontrol et
if (process.argv[2] === '-i') {
    importData();
} else if (process.argv[2] === '-d') {
    deleteData();
} else {
    console.log('Lütfen bir argüman belirtin: -i (import) veya -d (delete)');
}
