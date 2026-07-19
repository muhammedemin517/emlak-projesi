/** Görünüm yardımcıları: para, tarih, etiket çevirileri ve yatırım analizi rozetleri. */

const formatCurrency = (n) =>
    Number(n || 0).toLocaleString('tr-TR') + ' TL';

/** ISO veya "17.05.2026 19:24:29" formatını okunaklı tarihe çevirir. */
const formatDate = (value) => {
    if (!value) return '-';
    const iso = typeof value === 'string' && value.includes('.') ? null : value;
    if (iso) {
        const d = new Date(iso);
        if (!isNaN(d)) return d.toLocaleDateString('tr-TR');
    }
    return String(value).split(' ')[0] || value;
};

// ==========================================
// MERKEZİ ETİKET TABLOSU
// Ham anahtar (sobali, yerdenisitma, 4-7...) -> insan-okur etiket.
// Dashboard select'leri ve detail sayfası dahil her yerde buradan beslenir.
// ==========================================
const LABELS = {
    age: {
        '0-5': '0 - 5 Yıl (Yeni)',
        '6-15': '6 - 15 Yıl',
        '16+': '16+ Yıl (Eski)',
    },
    transport: {
        yakin: 'Yürüme Mesafesi',
        uzak: 'Araç Mesafesi',
    },
    roomCount: {
        '1+0': 'Stüdyo (1+0)',
        '1+1': '1+1',
        '2+1': '2+1',
        '3+1': '3+1',
        '4+1': '4+1',
        '5+1': '5+1',
    },
    floor: {
        giris: 'Giriş / Zemin Kat',
        '1-3': '1 - 3. Kat',
        '4-7': '4 - 7. Kat',
        '8+': '8+ Kat (Üst Kat)',
    },
    view: {
        standart: 'Standart',
        park: 'Park',
        sehir: 'Şehir',
        deniz: 'Deniz',
        bogaz: 'Boğaz',
    },
    heating: {
        sobali: 'Sobalı',
        kombi: 'Kombi',
        dogalgaz: 'Doğalgaz (Kombi)',
        yerdenisitma: 'Yerden Isıtma',
        merkezi: 'Merkezi',
    },
};

/** Kategori + anahtar -> etiket. Bilinmeyense anahtarın kendisini döner. */
const labelFor = (category, key) => {
    const map = LABELS[category];
    return (map && map[key]) || key || '-';
};

// Kısayol fonksiyonları (geriye dönük uyum)
const ageLabel = (age) => labelFor('age', age);
const transportLabel = (t) => labelFor('transport', t);
const viewLabel = (v) => labelFor('view', v);
const heatingLabel = (h) => labelFor('heating', h);
const floorLabel = (f) => labelFor('floor', f);
const roomLabel = (r) => labelFor('roomCount', r);

/**
 * userPrice / systemPrice oranına göre yatırım rozeti döndürür.
 */
const trendBadge = (userPrice, systemPrice) => {
    const ratio = Number(systemPrice) > 0
        ? Number(userPrice) / Number(systemPrice)
        : 1;
    if (ratio > 1.12) return { label: 'Yüksek Fiyat', emoji: '🔴', cls: 'badge-high' };
    if (ratio < 0.88) return { label: 'Kelepir / Fırsat', emoji: '🟢', cls: 'badge-low' };
    return { label: 'Dengeli Piyasa', emoji: '🟡', cls: 'badge-mid' };
};

/** Görsel yoksa yer tutucu döndürür. */
const photoOrPlaceholder = (photo) =>
    photo
        ? photo
        : 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&auto=format&fit=crop&q=60';

module.exports = {
    formatCurrency,
    formatDate,
    LABELS,
    labelFor,
    ageLabel,
    transportLabel,
    viewLabel,
    heatingLabel,
    floorLabel,
    roomLabel,
    trendBadge,
    photoOrPlaceholder,
};
