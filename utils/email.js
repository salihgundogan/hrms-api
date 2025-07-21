// utils/email.js

const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // 1. Bir "taşıyıcı" (transporter) oluşturuyoruz. Bu, e-postaları gönderecek olan servistir.
    //    Ayarları doğrudan .env dosyamızdan alıyoruz.
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    // 2. E-posta seçeneklerini tanımlıyoruz (kime, kimden, konu, içerik).
    const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: options.email,
        subject: options.subject,
        text: options.text,
        // html: options.html // İstersek HTML formatında da gönderebiliriz.
    };

    // 3. E-postayı gerçekten gönderiyoruz.
    await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;