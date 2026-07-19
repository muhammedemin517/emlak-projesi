require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const helmet = require('helmet');

const app = express();

// ==========================================
// 1. UYGULAMA AYARLARI (VIEW ENGINE & STATICS)
// ==========================================
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Statik dosyalar: CSS, JS ve kullanıcıların yüklediği görseller (uploads)
app.use(express.static(path.join(__dirname, 'public')));

// ==========================================
// 2. İSTEK GÖVDESİ OKUMA (MIDDLEWARES)
// ==========================================
// fetch/JSON istekleri (giriş, kayıt)
app.use(express.json());
// Klasik HTML form POST'ları (ilan yayınla, sil, düzenle)
app.use(express.urlencoded({ extended: true }));

// ==========================================
// 3. GÜVENLİK KATMANI
// ==========================================
// Helmet: güvenli HTTP başlıkları. Mevcut arayüzdeki satır içi script/stil ve
// harici (Unsplash) görsellere izin verecek şekilde CSP esnetildi.
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                // Leaflet lokal olarak (public/vendor) sunuluyor -> 'self' yeterli
                scriptSrc: ["'self'", "'unsafe-inline'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", "data:", "https:"], // https: -> OpenStreetMap döşemeleri
                fontSrc: ["'self'", "data:"],
                // Nominatim: adres -> koordinat (geocoding) için
                connectSrc: ["'self'", "https://nominatim.openstreetmap.org"],
            },
        },
    })
);

// Brute-force koruması (giriş/kayıt): middleware/rateLimit.js -> authRoutes içinde kullanılır.

// ==========================================
// 4. OTURUM YÖNETİMİ (SESSION)
// ==========================================
// global.currentUser yerine güvenli, kullanıcı bazlı oturum.
app.use(
    session({
        name: 'emlak.sid',
        secret: process.env.SESSION_SECRET || 'emlak-projesi-gelistirme-gizli-anahtar',
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 8, // 8 saat
            // production'da HTTPS üzerinden serve edildiğinde secure: true yapılmalı
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
        },
    })
);

// Tüm view'larda erişilebilen ortak değişkenler (giriş yapan kullanıcı, yıl, rozetler)
app.use((req, res, next) => {
    res.locals.currentUser = req.session.user || null;
    res.locals.path = req.path;
    res.locals.year = new Date().getFullYear();
    // Giriş yapmışsa nav rozetleri (okunmamış mesaj, favori sayısı)
    if (req.session.user) {
        const Message = require('./models/messageModel');
        const Favorite = require('./models/favoriteModel');
        res.locals.unreadCount = Message.countUnread(req.session.user.username);
        res.locals.favoriteCount = Favorite.getByUser(req.session.user.username).length;
    } else {
        res.locals.unreadCount = 0;
        res.locals.favoriteCount = 0;
    }
    next();
});

// ==========================================
// 5. ROTA ENTEGRASYONLARI (ROUTES)
// ==========================================
const authRoutes = require('./routes/authRoutes');
const estateRoutes = require('./routes/estateRoutes');

app.use('/', authRoutes);
app.use('/', estateRoutes);

// ==========================================
// 6. HATA YAKALAMA (ERROR HANDLING)
// ==========================================
// 404 — tanımsız rota
app.use((req, res) => {
    res.status(404).render('error', {
        title: 'Sayfa Bulunamadı',
        statusCode: 404,
        message: 'Aradığınız sayfa mevcut değil veya taşınmış olabilir.',
    });
});

// Hata işleyici (4 parametre zorunlu)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    console.error('Sunucu Hatası:', err);
    res.status(err.status || 500).render('error', {
        title: 'Sunucu Hatası',
        statusCode: err.status || 500,
        message: process.env.NODE_ENV === 'production'
            ? 'Beklenmedik bir sunucu hatası oluştu.'
            : err.message,
    });
});

// ==========================================
// 7. SUNUCU BAŞLATMA
// ==========================================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log('=================================================');
    console.log(`🚀 Emlak Pazaryeri Sunucusu ${PORT} Portunda Aktif!`);
    console.log(`👉 Test: http://localhost:${PORT}/login`);
    console.log('=================================================');
});

module.exports = app;
