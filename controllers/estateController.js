const path = require('path');
const multer = require('multer');

const Estate = require('../models/estateModel');
const Market = require('../models/marketModel');
const Favorite = require('../models/favoriteModel');

const valuation = require('../utils/valuation');
const fmt = require('../utils/format');

// ==========================================
// FOTOĞRAF YÜKLEME (Multer)
// ==========================================
const UPLOAD_DIR = path.join(__dirname, '../public/uploads');
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, 'ilan-' + Date.now() + '-' + Math.round(Math.random() * 1e9) + ext);
    },
});
const fileFilter = (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    cb(new Error('Sadece resim dosyası (jpg, png, webp, gif) yüklenebilir.'));
};
const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});
exports.upload = upload;

// ==========================================
// 1. DASHBOARD
// ==========================================
exports.getDashboard = (req, res) => {
    res.render('dashboard', {
        title: 'Değer Hesapla',
        market: Market.getAll(),
        labels: fmt.LABELS,
        centroids: require('../utils/centroids'),
    });
};

// ==========================================
// 2. FİYAT HESAPLAMA + RAPOR
// ==========================================
exports.calculateValuation = (req, res) => {
    const { district, subDistrict, sqm, age, transport,
        roomCount, floor, view, heating,
        elevator, parking, furnished, lat, lng, address } = req.body;

    // district = adresten türetilen şehir. Yoksa desteklenmeyen şehir uyarısı.
    if (!district || !sqm || !age || !transport) {
        return res.render('error', {
            title: 'Eksik Bilgi',
            statusCode: 400,
            message: !district
                ? 'Lütfen desteklenen bir şehirdeki bir adres girin: ' + Market.getCities().join(', ') + '.'
                : 'Lütfen formdaki tüm zorunlu alanları doldurun.',
        });
    }

    const cityData = Market.getByCity(district);
    if (!cityData) {
        return res.render('error', {
            title: 'Şehir Desteklenmiyor',
            statusCode: 404,
            message: 'Bu şehir için endeks verimiz yok. Şunlardan bir adres girin: ' + Market.getCities().join(', ') + '.',
        });
    }

    const result = valuation.calculateValuation(
        {
            city: district, subDistrict, sqm, age, transport,
            roomCount: roomCount || '3+1',
            floor: floor || '4-7',
            view: view || 'standart',
            heating: heating || 'dogalgaz',
            elevator: elevator === 'on' || elevator === true,
            parking: parking === 'on' || parking === true,
            furnished: furnished === 'on' || furnished === true,
        },
        Market.getAll()
    );

    res.render('report', {
        title: 'Değerleme Raporu',
        district,
        subDistrict,
        sqm,
        age,
        transport,
        roomCount: roomCount || '3+1',
        floor: floor || '4-7',
        view: view || 'standart',
        heating: heating || 'dogalgaz',
        elevator: elevator === 'on' || elevator === true,
        parking: parking === 'on' || parking === true,
        furnished: furnished === 'on' || furnished === true,
        lat,
        lng,
        address,
        result,
        formatCurrency: fmt.formatCurrency,
        // ilan limiti bilgisi
        limit: Estate.INDIVIDUAL_LIMIT,
        user: req.session.user,
    });
};

// ==========================================
// 3. İLANI KAYDET (foto yükleme dahil)
// ==========================================
exports.publishListing = (req, res) => {
    const { district, subDistrict, sqm, age, transport,
        roomCount, floor, view, heating,
        elevator, parking, furnished,
        systemPrice, customPrice, note, lat, lng, address } = req.body;

    const user = req.session.user;

    // Bireysel hesap limiti
    if (user.role === 'Bireysel Kullanıcı') {
        if (Estate.countByOwner(user.username) >= Estate.INDIVIDUAL_LIMIT) {
            return res.render('error', {
                title: 'İlan Limiti',
                statusCode: 403,
                message: `Bireysel hesapların maksimum ilan hakkı ${Estate.INDIVIDUAL_LIMIT} adettir. Daha fazla ilan için emlak ofisi hesabına geçin.`,
            });
        }
    }

    // Çoklu fotoğraf yolları
    const photos = (req.files || []).map((f) => '/uploads/' + f.filename);
    // Geriye dönük uyum: ilk fotoğrafı eski tekil 'photo' alanına da yaz
    const photo = photos[0] || '';

    const created = Estate.create({
        district,
        subDistrict,
        sqm: Number(sqm),
        age,
        transport,
        roomCount: roomCount || '3+1',
        floor: floor || '4-7',
        view: view || 'standart',
        heating: heating || 'dogalgaz',
        elevator: elevator === 'on' || elevator === true,
        parking: parking === 'on' || parking === true,
        furnished: furnished === 'on' || furnished === true,
        userPrice: parseInt(customPrice, 10),
        systemPrice: parseInt(systemPrice, 10),
        note: note || 'Açıklama belirtilmedi.',
        photo,
        lat: lat || null,
        lng: lng || null,
        address: address || '',
        owner: user.username,
        userRole: user.role,
        companyName: user.companyName || '',
    });

    if (photos.length) Estate.addPhotos(created.id, photos);

    res.redirect('/my-listings');
};

// ==========================================
// 4. TÜM İLANLAR (sayfalama + filtre + sıralama)
// ==========================================
exports.getListings = (req, res) => {
    let listings = Estate.getAll();

    const { city, sub, minPrice, maxPrice, q } = req.query;
    const sort = req.query.sort || 'newest';
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const perPage = 6;

    // Filtreleme
    if (city) listings = listings.filter((l) => l.district === city);
    if (sub) listings = listings.filter((l) => l.subDistrict === sub);
    if (minPrice) listings = listings.filter((l) => l.userPrice >= Number(minPrice));
    if (maxPrice) listings = listings.filter((l) => l.userPrice <= Number(maxPrice));
    if (q) {
        const t = String(q).toUpperCase();
        listings = listings.filter((l) =>
            `${l.district} ${l.subDistrict} ${l.note}`.toUpperCase().includes(t)
        );
    }

    // Sıralama (emlak ofisi her zaman önde, sonra seçilen kritere göre)
    listings.sort((a, b) => {
        const aOffice = a.userRole === 'Emlak Ofisi / Danışman' ? 0 : 1;
        const bOffice = b.userRole === 'Emlak Ofisi / Danışman' ? 0 : 1;
        if (aOffice !== bOffice) return aOffice - bOffice;
        switch (sort) {
            case 'priceAsc': return a.userPrice - b.userPrice;
            case 'priceDesc': return b.userPrice - a.userPrice;
            case 'sqmDesc': return b.sqm - a.sqm;
            default: return a.createdAt < b.createdAt ? 1 : -1; // newest
        }
    });

    const total = listings.length;
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const paged = listings.slice((page - 1) * perPage, page * perPage);

    // Giriş yapan kullanıcının favorileri (kalp dolu/boş için)
    const favIds = req.session.user
        ? Favorite.getIdsByUser(req.session.user.username)
        : [];

    // İlk fotoğraflar (N+1 sorgu yerine tek sorgu)
    const firstPhotos = Estate.getPhotosMap();

    res.render('listings', {
        title: 'Tüm İlanlar',
        listings: paged,
        total,
        page,
        totalPages,
        perPage,
        filters: { city, sub, minPrice, maxPrice, q, sort },
        cities: Market.getCities(),
        districts: city && Market.getByCity(city) ? Object.keys(Market.getByCity(city).districts) : [],
        favIds,
        firstPhotos,
        helpers: fmt,
    });
};

// ==========================================
// 5. İLAN DETAY + mesaj formu
// ==========================================
exports.getListingDetail = (req, res) => {
    const listing = Estate.getById(req.params.id);
    if (!listing) {
        return res.render('error', {
            title: 'İlan Yok',
            statusCode: 404,
            message: 'Aradığınız ilan bulunamadı veya kaldırılmış.',
        });
    }
    const isOwner = req.session.user && req.session.user.username === listing.owner;
    const isFav = req.session.user && Favorite.isFavorite(req.session.user.username, listing.id);

    // Fotoğraflar: yeni çoklu foto tablosu, yoksa eski tekil photo alanı
    let photos = Estate.getPhotos(listing.id);
    if (photos.length === 0 && listing.photo) photos = [listing.photo];

    // Harita merkezi: ilanın lat/lng'si varsa onu kullan, yoksa şehir merkezi
    const { getCenter } = require('../utils/centroids');
    const center = (listing.lat && listing.lng)
        ? [Number(listing.lat), Number(listing.lng)]
        : getCenter(listing.district);
    const hasExactLocation = !!(listing.lat && listing.lng);

    res.render('detail', {
        title: `${listing.district} ${listing.subDistrict} İlan`,
        listing,
        photos,
        center,
        hasExactLocation,
        isOwner,
        isFav,
        helpers: fmt,
    });
};

// ==========================================
// 6. BENİM İLANLARIM
// ==========================================
exports.getMyListings = (req, res) => {
    const listings = Estate.getByOwner(req.session.user.username);
    res.render('my-listings', {
        title: 'İlanlarım',
        listings,
        limit: Estate.INDIVIDUAL_LIMIT,
        helpers: fmt,
    });
};

// ==========================================
// 7. İLAN DÜZENLEME
// ==========================================
exports.getEditForm = (req, res) => {
    const listing = Estate.getById(req.params.id);
    if (!listing) {
        return res.render('error', {
            title: 'İlan Yok', statusCode: 404, message: 'İlan bulunamadı.',
        });
    }
    if (listing.owner !== req.session.user.username) {
        return res.render('error', {
            title: 'Yetkisiz', statusCode: 403, message: 'Bu ilanı düzenleme yetkiniz yok.',
        });
    }
    res.render('edit-listing', {
        title: 'İlanı Düzenle',
        listing,
        photos: Estate.getPhotos(listing.id),
        market: Market.getAll(),
        helpers: fmt,
        factors: {
            room: valuation.ROOM_FACTORS,
            floor: valuation.FLOOR_FACTORS,
            view: valuation.VIEW_FACTORS,
            heating: valuation.HEATING_FACTORS,
        },
    });
};

exports.updateListing = (req, res) => {
    const id = req.params.id;
    const listing = Estate.getById(id);
    if (!listing) {
        return res.render('error', { title: 'İlan Yok', statusCode: 404, message: 'İlan bulunamadı.' });
    }
    if (listing.owner !== req.session.user.username) {
        return res.render('error', { title: 'Yetkisiz', statusCode: 403, message: 'Bu ilanı düzenleme yetkiniz yok.' });
    }

    const { customPrice, note } = req.body;
    const patch = {
        userPrice: parseInt(customPrice, 10) || listing.userPrice,
        note: note || listing.note,
    };

    // Yeni fotoğraflar yüklendiyse ekle (çoklu)
    const newPhotos = (req.files || []).map((f) => '/uploads/' + f.filename);
    if (newPhotos.length) {
        Estate.addPhotos(id, newPhotos);
        // geriye dönük uyum: tekil photo alanını da güncelle
        patch.photo = newPhotos[0];
    }

    Estate.update(id, patch);
    res.redirect('/my-listings');
};

// ==========================================
// 8. İLAN SİLME
// ==========================================
exports.deleteListing = (req, res) => {
    const { id } = req.body;
    const listing = Estate.getById(id);
    if (listing && listing.owner === req.session.user.username) {
        Estate.delete(id);
    }
    res.redirect('/my-listings');
};

// ==========================================
// 9. PROFİL
// ==========================================
exports.getProfile = (req, res) => {
    const user = req.session.user;
    const count = Estate.countByOwner(user.username);
    const limit = Estate.INDIVIDUAL_LIMIT;
    res.render('profile', {
        title: 'Profilim',
        user,
        listingCount: count,
        limit,
        unlimited: user.role === 'Emlak Ofisi / Danışman',
    });
};

// ==========================================
// 10. FAVORİLER
// ==========================================
exports.toggleFavorite = (req, res) => {
    const id = req.params.id;
    const listing = Estate.getById(id);
    if (!listing) return res.redirect('/listings');

    const nowFav = Favorite.toggle(req.session.user.username, id);

    // AJAX isteği ise JSON, değilse geri yönlendir
    if (req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'))) {
        return res.json({ success: true, favorite: nowFav });
    }
    res.redirect(req.get('referer') || '/listings');
};

exports.getFavorites = (req, res) => {
    const favRecords = Favorite.getByUser(req.session.user.username);
    const listings = favRecords
        .map((f) => Estate.getById(f.listingId))
        .filter(Boolean);
    res.render('favorites', {
        title: 'Favorilerim',
        listings,
        helpers: fmt,
    });
};
