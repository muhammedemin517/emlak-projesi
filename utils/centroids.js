/**
 * Şehir merkez koordinatları (lat/lng) — Leaflet haritası için.
 * Kullanıcı dashboard'da kendi konumunu seçmediyse, ilan detayındaki harita
 * şehir merkezine konumlanır. (Yaklaşık değerler; hassas konum için
 * dashboard harita seçicisini kullanın.)
 */
const CITY_CENTROIDS = {
    İstanbul: [41.0082, 28.9784],
    Ankara: [39.9334, 32.8597],
    İzmir: [38.4237, 27.1428],
    Bursa: [40.1828, 29.0665],
    Antalya: [36.8969, 30.7133],
    Adana: [37.0, 35.3213],
    Konya: [37.8714, 32.4847],
    'Şanlıurfa': [37.1674, 38.7955],
    Gaziantep: [37.0662, 37.3833],
    Kocaeli: [40.8533, 29.8815],
    Kastamonu: [41.3887, 33.7817],
    Mardin: [37.3122, 40.734],
    Sinop: [42.0231, 35.1531],
};

const DEFAULT_CENTER = [39.0, 35.0]; // Türkiye ortası

/** Şehir adı -> [lat, lng] (bilinmiyorsa Türkiye ortası). */
const getCenter = (city) => CITY_CENTROIDS[city] || DEFAULT_CENTER;

module.exports = { CITY_CENTROIDS, DEFAULT_CENTER, getCenter };
