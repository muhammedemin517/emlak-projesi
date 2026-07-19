/**
 * Gelişmiş gayrimenkul değerleme motoru.
 * m² taban fiyat × ilçe çarpanı × özellik çarpanları.
 * Her faktör için çarpan tabloları dışarıdan okunabilir şekilde tutuldu,
 * böylece raporda bir "döküm" gösterilebilir.
 */

const AGE_FACTORS = { '0-5': 1.2, '6-15': 1.0, '16+': 0.8 };
const TRANSPORT_FACTORS = { yakin: 1.15, uzak: 0.95 };
const ROOM_FACTORS = {
    '1+0': 0.85, '1+1': 0.9, '2+1': 1.0, '3+1': 1.05,
    '4+1': 1.12, '5+1': 1.2,
};
const FLOOR_FACTORS = { giris: 0.95, '1-3': 1.05, '4-7': 1.0, '8+': 1.08 };
const VIEW_FACTORS = {
    standart: 1.0, park: 1.04, sehir: 1.06, deniz: 1.15, bogaz: 1.25,
};
const HEATING_FACTORS = {
    sobali: 0.92, kombi: 1.0, dogalgaz: 1.0,
    yerdenisitma: 1.05, merkezi: 1.03,
};

const pick = (map, key, fallback = 1) => (map[key] !== undefined ? map[key] : fallback);

/**
 * @param {object} input  - ilan özellikleri
 * @param {object} marketData - marketData.json içeriği ({ city: { baseSqmPrice, districts } })
 * @returns {{ price:number, sahibindenEstimate:number, breakdown:Array, base:number, multiplier:number }}
 */
function calculateValuation(input, marketData) {
    const {
        city, subDistrict, sqm, age, transport,
        roomCount, floor, view, heating,
        elevator, parking, furnished,
    } = input;

    const cityData = marketData && marketData[city];
    const baseSqmPrice = (cityData && cityData.baseSqmPrice) || 0;
    const subMultiplier = (cityData && cityData.districts && cityData.districts[subDistrict]) || 1;

    const factors = [
        ['Bina Yaşı', pick(AGE_FACTORS, age)],
        ['Ulaşım Yakınlığı', pick(TRANSPORT_FACTORS, transport)],
        ['Oda Sayısı', pick(ROOM_FACTORS, roomCount)],
        ['Bulunduğu Kat', pick(FLOOR_FACTORS, floor)],
        ['Manzara', pick(VIEW_FACTORS, view)],
        ['Isınma Tipi', pick(HEATING_FACTORS, heating)],
        ['Asansör', elevator ? 1.02 : 1.0],
        ['Otopark', parking ? 1.03 : 1.0],
        ['Eşyalı', furnished ? 1.05 : 1.0],
    ];

    let price = Number(sqm) * baseSqmPrice * subMultiplier;
    const breakdown = factors.map(([label, factor]) => {
        price *= factor;
        return { label, factor };
    });

    price = Math.round(price);
    // Sahibinden benzer ilan karşılaştırması (ör. %8 prim varsayımı)
    const sahibindenEstimate = Math.round(price * 1.08);

    return {
        price,
        sahibindenEstimate,
        breakdown,
        base: Math.round(Number(sqm) * baseSqmPrice),
        multiplier: subMultiplier,
    };
}

module.exports = {
    calculateValuation,
    // Etiket/çarpan tabloları (dashboard select'leri için de kullanılır)
    AGE_FACTORS,
    TRANSPORT_FACTORS,
    ROOM_FACTORS,
    FLOOR_FACTORS,
    VIEW_FACTORS,
    HEATING_FACTORS,
};
