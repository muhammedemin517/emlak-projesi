const fs = require('fs');
const path = require('path');

/**
 * JSON dosyalarını güvenli oku/yaz için yardımcı katman.
 * - readJSON: dosya yoksa fallback döner, bozuk JSON'da hata fırlatır.
 * - writeJSONAtomic: önce geçici (.tmp) dosyaya yazar, sonra atomik olarak
 *   yeniden adlandırır. Bu sayede yazım sırasında yarıda kesilme olursa
 *   ana veri dosyası bozulmaz.
 */
function readJSON(filePath, fallback) {
    try {
        const raw = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(raw);
    } catch (err) {
        if (err.code === 'ENOENT') return fallback;
        // Bozuk JSON: fallback dönerek uygulamanın çökmesini engelle
        console.error(`[fileStore] Okuma hatası (${filePath}):`, err.message);
        return fallback;
    }
}

function writeJSONAtomic(filePath, data) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const tmp = filePath + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8');
    // rename aynı volume üzerinde atomiktir
    fs.renameSync(tmp, filePath);
}

module.exports = { readJSON, writeJSONAtomic };
