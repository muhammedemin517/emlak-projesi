const rateLimit = require('express-rate-limit');

// Giriş/kayıt denemelerini IP başına sınırlar (brute-force koruması)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 dakika
    max: 20, // IP başına en fazla 20 deneme
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Çok fazla deneme yaptınız, lütfen 15 dakika sonra tekrar deneyin.',
    },
});

module.exports = { authLimiter };
