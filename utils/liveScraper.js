/**
 * Canlı veri kazıma modülü (axios yerine Node 24'ün yerleşik fetch'i + cheerio).
 *
 * - fetchLive(url): verilen URL'den HTML indirir, cheerio ile
 *   `<div class="city-data" data-city data-base data-districts>` öğelerini
 *   marketData yapısına çevirir. Başarısız olursa (ağ hatası, HTTP hatası,
 *   eşleşen veri yoksa) null döner -> çağıran seed'e geri döner.
 *
 * DİKKAT: sahibinden / hepsiemlak gibi gerçek siteler bot koruması
 * (Cloudflare vb.) kullanır ve kazımayı engeller. Bu modül doğru mimariyi
 * sunar; gerçek bir kaynağa bağlamak için SCRAPER_URL çevresel değişkenini
 * o kaynağa ayarlayın ve gerekirse parseHtml içindeki seçiciyi siteye göre
 * uyarlayın. Erişilebilir bir kaynak yoksa otomatik olarak örnek veriye düşer.
 */
const cheerio = require('cheerio');

// Yerleşik örnek (fallback) veri — canlı çekme başarısız olursa kullanılır.
const SEED_HTML = `
  <div class="city-data" data-city="İstanbul" data-base="45000" data-districts="Kadıköy:1.4,Fatih:1.0,Beylikdüzü:0.8"></div>
  <div class="city-data" data-city="Ankara" data-base="30000" data-districts="Çankaya:1.3,Keçiören:0.9,Sincan:0.7"></div>
  <div class="city-data" data-city="İzmir" data-base="38000" data-districts="Konak:1.1,Karşıyaka:1.3,Bornova:1.0"></div>
  <div class="city-data" data-city="Bursa" data-base="28000" data-districts="Nilüfer:1.3,Osmangazi:1.0,Yıldırım:0.85"></div>
  <div class="city-data" data-city="Antalya" data-base="35000" data-districts="Muratpaşa:1.1,Konyaaltı:1.4,Kepez:0.8"></div>
  <div class="city-data" data-city="Adana" data-base="24000" data-districts="Seyhan:1.0,Çukurova:1.3,Yüreğir:0.75"></div>
  <div class="city-data" data-city="Konya" data-base="22000" data-districts="Selçuklu:1.1,Meram:1.2,Karatay:0.85"></div>
  <div class="city-data" data-city="Şanlıurfa" data-base="20000" data-districts="Haliliye:1.0,Karaköprü:1.2,Eyyübiye:0.75"></div>
  <div class="city-data" data-city="Gaziantep" data-base="23000" data-districts="Şehitkamil:1.1,Şahinbey:1.0,Nizip:0.8"></div>
  <div class="city-data" data-city="Kocaeli" data-base="27000" data-districts="İzmit:1.1,Gebze:1.0,Kartepe:0.95"></div>
  <div class="city-data" data-city="Kastamonu" data-base="18000" data-districts="Merkez:1.0,Tosya:0.9,İnebolu:0.85"></div>
  <div class="city-data" data-city="Mardin" data-base="19000" data-districts="Artuklu:1.1,Midyat:1.0,Kızıltepe:0.85"></div>
  <div class="city-data" data-city="Sinop" data-base="21000" data-districts="Merkez:1.1,Boyabat:0.9,Gerze:1.0"></div>
`;

/**
 * HTML içinden city-data öğelerini parse eder.
 * @param {string} html
 * @returns {object} { city: { baseSqmPrice, districts, source, lastUpdated } }
 */
function parseHtml(html) {
    const $ = cheerio.load(html);
    const db = {};
    $('.city-data').each((i, el) => {
        const city = $(el).attr('data-city');
        const basePrice = parseInt($(el).attr('data-base'), 10);
        const districtsRaw = $(el).attr('data-districts');
        if (!city || !basePrice || !districtsRaw) return;

        const districts = {};
        districtsRaw.split(',').forEach((d) => {
            const [name, weight] = d.split(':');
            if (name) districts[name.trim()] = parseFloat(weight);
        });

        db[city] = {
            baseSqmPrice: basePrice,
            districts,
            lastUpdated: new Date().toISOString(),
            // source alanını çağıran belirler (seed mi, canlı mı)
        };
    });
    return db;
}

/**
 * Verilen URL'den canlı veri çeker. Başarısızsa null döner (fallback için).
 * @param {string} targetUrl
 * @returns {Promise<object|null>}
 */
async function fetchLive(targetUrl) {
    if (!targetUrl) return null;
    try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 10000);
        const res = await fetch(targetUrl, {
            headers: { 'User-Agent': 'EmlakPazarBot/1.0 (egitim amacli kazima)' },
            signal: controller.signal,
        });
        clearTimeout(timer);

        if (!res.ok) {
            console.warn(`  ! Canli kaynak HTTP ${res.status} döndürdü, örnek veriye dönülüyor.`);
            return null;
        }
        const html = await res.text();
        const data = parseHtml(html);
        if (Object.keys(data).length === 0) {
            console.warn('  ! Sayfada eşleşen endeks verisi yok, örnek veriye dönülüyor.');
            return null;
        }
        return data;
    } catch (err) {
        console.warn(`  ! Canlı çekme başarısız (${err.name}: ${err.message}), örnek veriye dönülüyor.`);
        return null;
    }
}

module.exports = { SEED_HTML, parseHtml, fetchLive };
