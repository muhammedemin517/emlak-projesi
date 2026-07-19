/**
 * Piyasa endeks verisini üretir.
 *
 * Öncelik sırası:
 *   1) SCRAPER_URL çevresel değişkeni tanımlıysa o kaynaktan CANLI kazıma (fetch + cheerio)
 *   2) Başarısız olursa / tanımlı değilse -> yerleşik örnek (seed) veri
 *
 * Çalıştırma:
 *   npm run seed                       # örnek veriyle üret
 *   SCRAPER_URL=https://... npm run seed   # canlı kaynaktan üret
 */
const fs = require('fs');
const path = require('path');
const { SEED_HTML, parseHtml, fetchLive } = require('./utils/liveScraper');

const dataPath = path.join(__dirname, 'data/marketData.json');
const TARGET = process.env.SCRAPER_URL || '';

async function run() {
    console.log('🌐 İl/İlçe emlak endeks verisi üretiliyor...\n');

    let data = null;
    let sourceLabel = 'örnek (simülasyon)';

    if (TARGET) {
        console.log(`📡 Canlı kazıma deneniyor: ${TARGET}`);
        data = await fetchLive(TARGET);
        if (data) {
            sourceLabel = `canlı kaynak (${TARGET})`;
            console.log(`✅ Canlı kazıma başarılı.`);
        }
    } else {
        console.log('ℹ️  SCRAPER_URL tanımlı değil; doğrudan örnek veri kullanılacak.');
    }

    if (!data) {
        console.log('📦 Yerleşik örnek veri işleniyor...');
        data = parseHtml(SEED_HTML);
    }

    const dir = path.dirname(dataPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    // Kaynak bilgisini tüm kayıtlara yaz
    Object.keys(data).forEach((city) => {
        data[city].source = data[city].source || sourceLabel;
    });

    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`\n💾 ${Object.keys(data).length} şehir -> data/marketData.json kaydedildi (kaynak: ${sourceLabel}).`);
}

run();
