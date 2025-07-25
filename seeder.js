// seeder.js
// Amaç: Veritabanını, sunum senaryolarına uygun, zengin ve ilişkisel bir veri setiyle doldurmak.

const db = require('./models');
const { faker } = require('@faker-js/faker');
const bcrypt = require('bcrypt');

// Bu betiği çalıştırmadan önce, terminale `npm install @faker-js/faker` yazarak
// faker kütüphanesini projeye eklemeniz gerekir.

// Veri ekleme fonksiyonu
const importData = async () => {
    try {
        console.log('Mevcut veriler siliniyor...');
        await db.LeaveRequest.destroy({ where: {}, truncate: true, cascade: true });
        await db.User.destroy({ where: {}, truncate: true, cascade: true });
        console.log('Mevcut veriler başarıyla silindi.');

        // === 1. ADIM: KULLANICI VERİSİNİ HAZIRLAMA ===
        const usersToCreate = [];
        const password = 'password123';

        // 3 HR Admin oluştur (Doğrulanmış olarak)
        for (let i = 0; i < 3; i++) {
            usersToCreate.push({
                name: `Admin ${faker.person.fullName()}`,
                email: faker.internet.email().toLowerCase(),
                password: password,
                role: 'hr_admin',
                isVerified: true, // Adminler baştan doğrulanmış
                profilePicture: '/public/seed-images/hr.jpg'
            });
        }

        // 3 Manager oluştur (Doğrulanmış olarak)
        for (let i = 0; i < 3; i++) {
            usersToCreate.push({
                name: `Manager ${faker.person.fullName()}`,
                email: faker.internet.email().toLowerCase(),
                password: password,
                role: 'manager',
                isVerified: true, // Yöneticiler baştan doğrulanmış
                profilePicture: '/public/seed-images/manager1.jpg'
            });
        }

        // 9 Employee oluştur (Doğrulanmamış olarak)
        for (let i = 0; i < 9; i++) {
            usersToCreate.push({
                name: `Employee ${faker.person.fullName()}`,
                email: faker.internet.email().toLowerCase(),
                password: password,
                role: 'employee',
                isVerified: false, // Çalışanların e-posta doğrulaması yapması gerekecek
                profilePicture: '/public/seed-images/employee1.jpg'
            });
        }

        // === 2. ADIM: ŞİFRELERİ MANUEL OLARAK HASH'LEME ===
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
        const leaveReasons = ['Yıllık İzin', 'Hastalık Raporu', 'Mazeret İzni'];

        for (const employee of employees) {
            for (let i = 0; i < 3; i++) { // Her çalışan için 3'er izin talebi
                const startDate = faker.date.soon({ days: 30 });
                const endDate = new Date(startDate);
                endDate.setDate(startDate.getDate() + faker.number.int({ min: 1, max: 3 }));

                leaveRequestsToCreate.push({
                    employeeId: employee.id,
                    startDate: startDate,
                    endDate: endDate,
                    reason: faker.helpers.arrayElement(leaveReasons),
                    status: 'pending' // Tüm talepler 'pending' olarak başlasın
                });
            }
        }

        await db.LeaveRequest.bulkCreate(leaveRequestsToCreate);
        console.log(`${leaveRequestsToCreate.length} izin talebi başarıyla oluşturuldu.`);
        
        console.log('\nVeri ekleme işlemi başarıyla tamamlandı!');

    } catch (error) {
        console.error('\nHata:', error);
    } finally {
        await db.sequelize.close();
        console.log('Veritabanı bağlantısı kapatıldı.');
    }
};

// ... (deleteData ve komut satırı kontrolü aynı kalacak) ...
const deleteData = async () => { /* ... */ };
if (process.argv[2] === '-i') { importData(); } 
else if (process.argv[2] === '-d') { deleteData(); }
