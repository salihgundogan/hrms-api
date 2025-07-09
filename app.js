require('dotenv').config();

const express = require('express');
const connectDB = require('./config/db');


const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const leaveRoutes = require('./routes/leave.routes');

const app = express();

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/leaves', leaveRoutes);

app.get('/', (req, res) => {
    res.send('İK Yönetim Sistemi API Ana Sayfası');
});

const port = process.env.PORT || 5001;

const startServer = async () => {
    try {
        await connectDB();

        app.listen(port, () => {
            console.log(`Sunucu http://localhost:${port} adresinde çalışıyor.`);
        });

    } catch (error) {
        console.error("Sunucu başlatılamadı, veritabanı bağlantısı kurulamadı.", error);
        process.exit(1);
    }
};

startServer();
