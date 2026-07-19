const path = require('path');
const { readJSON } = require('../utils/fileStore');

const dataPath = path.join(__dirname, '../data/marketData.json');

const Market = {
    // Tüm şehir endeks verisi
    getAll: () => readJSON(dataPath, {}),

    // Bir şehrin verisi (baseSqmPrice + districts)
    getByCity: (city) => Market.getAll()[city] || null,

    // Şehir listesi (dashboard select için)
    getCities: () => Object.keys(Market.getAll()),

    // Bir şehir + ilçe için m² çarpanı
    getMultiplier: (city, subDistrict) => {
        const cityData = Market.getByCity(city);
        if (!cityData || !cityData.districts) return null;
        const mult = cityData.districts[subDistrict];
        if (mult === undefined) return null;
        return { baseSqmPrice: cityData.baseSqmPrice, multiplier: mult };
    },
};

module.exports = Market;
