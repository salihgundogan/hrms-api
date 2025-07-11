const redis = require('redis');

const redisClient = redis.createClient({
    url: process.env.REDIS_URL
});

redisClient.on('error', (err) => console.log('Redis Client Hatası', err));

const connectRedis = async () => {
    try {
        await redisClient.connect();
        console.log('Redis bağlantısı başarıyla kuruldu.');
    } catch (error) {
        console.error('Redis bağlantısı kurulamadı:', error);
        process.exit(1);
    }
};

module.exports = {
    redisClient,
    connectRedis
};