/**
 * Tek seferlik migrasyon: data/*.json dosyalarındaki veriyi SQLite (data/app.db)
 * tablolarına taşır. Tekrar çalıştırılabilir (INSERT OR REPLACE).
 *
 * Çalıştırma:  node db/migrate.js
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const db = require('./database');

const DATA = path.join(__dirname, '../data');
const readJSON = (file, fallback) => {
    const p = path.join(DATA, file);
    try {
        return JSON.parse(fs.readFileSync(p, 'utf8'));
    } catch (e) {
        console.warn(`  ! ${file} okunamadı (${e.code || e.message}), atlanıyor.`);
        return fallback;
    }
};

const uuid = () => crypto.randomUUID();
const now = () => new Date().toISOString();

// Hazır ifadeler (prepared statements)
const stmts = {
    user: db.prepare(`
        INSERT OR REPLACE INTO users (id, username, password, role, companyName, createdAt)
        VALUES (@id, @username, @password, @role, @companyName, @createdAt)
    `),
    estate: db.prepare(`
        INSERT OR REPLACE INTO estates
        (id, district, subDistrict, sqm, age, transport, roomCount, floor, view, heating,
         elevator, parking, furnished, userPrice, systemPrice, note, photo,
         owner, userRole, companyName, createdAt)
        VALUES
        (@id, @district, @subDistrict, @sqm, @age, @transport, @roomCount, @floor, @view, @heating,
         @elevator, @parking, @furnished, @userPrice, @systemPrice, @note, @photo,
         @owner, @userRole, @companyName, @createdAt)
    `),
    favorite: db.prepare(`
        INSERT OR REPLACE INTO favorites (id, username, listingId, createdAt)
        VALUES (@id, @username, @listingId, @createdAt)
    `),
    message: db.prepare(`
        INSERT OR REPLACE INTO messages (id, listingId, fromUser, toUser, body, phone, read, createdAt)
        VALUES (@id, @listingId, @fromUser, @toUser, @body, @phone, @read, @createdAt)
    `),
};

const tx = (fn) => db.transaction(fn);

// --- USERS ---
const users = readJSON('users.json', []);
tx(() => {
    users.forEach((u) => {
        stmts.user.run({
            id: u.id || uuid(),
            username: u.username,
            password: u.password,
            role: u.role || 'Bireysel Kullanıcı',
            companyName: u.companyName || '',
            createdAt: u.createdAt || now(),
        });
    });
})();
console.log(`✓ users: ${users.length} kayıt taşındı`);

// --- ESTATES ---
const estates = readJSON('estates.json', []);
tx(() => {
    estates.forEach((e) => {
        const system = Number(e.systemPrice || e.estimatedPrice || 0);
        const userP = Number(e.userPrice || e.estimatedPrice || system);
        stmts.estate.run({
            id: e.id || uuid(),
            district: e.district || '',
            subDistrict: e.subDistrict || 'Merkez',
            sqm: Number(e.sqm) || 0,
            age: e.age || '0-5',
            transport: e.transport || 'yakin',
            roomCount: e.roomCount || '3+1',
            floor: e.floor || '4-7',
            view: e.view || 'standart',
            heating: e.heating || 'dogalgaz',
            elevator: e.elevator === undefined ? 1 : e.elevator ? 1 : 0,
            parking: e.parking ? 1 : 0,
            furnished: e.furnished ? 1 : 0,
            userPrice: userP,
            systemPrice: system,
            note: e.note || 'Açıklama belirtilmedi.',
            photo: e.photo || '',
            owner: e.owner || 'Bilinmiyor',
            userRole: e.userRole || 'Bireysel Kullanıcı',
            companyName: e.companyName || '',
            createdAt: e.createdAt || now(),
        });
    });
})();
console.log(`✓ estates: ${estates.length} kayıt taşındı`);

// --- FAVORITES ---
const favorites = readJSON('favorites.json', []);
tx(() => {
    favorites.forEach((f) => {
        stmts.favorite.run({
            id: f.id || uuid(),
            username: f.username,
            listingId: f.listingId,
            createdAt: f.createdAt || now(),
        });
    });
})();
console.log(`✓ favorites: ${favorites.length} kayıt taşındı`);

// --- MESSAGES ---
const messages = readJSON('messages.json', []);
tx(() => {
    messages.forEach((m) => {
        stmts.message.run({
            id: m.id || uuid(),
            listingId: m.listingId || '',
            fromUser: m.fromUser || '',
            toUser: m.toUser || '',
            body: m.body || '',
            phone: m.phone || '',
            read: m.read ? 1 : 0,
            createdAt: m.createdAt || now(),
        });
    });
})();
console.log(`✓ messages: ${messages.length} kayıt taşındı`);

// --- ÖZET ---
console.log('\n📊 Tablo satır sayıları:');
['users', 'estates', 'favorites', 'messages'].forEach((t) => {
    const c = db.prepare(`SELECT COUNT(*) AS n FROM ${t}`).get();
    console.log(`   ${t}: ${c.n}`);
});
console.log('\n✅ Migrasyon tamamlandı. Veritabanı: data/app.db');
