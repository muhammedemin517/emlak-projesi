const crypto = require('crypto');
const db = require('../db/database');

const INDIVIDUAL_LISTING_LIMIT = 3;

const stmt = {
    all: db.prepare('SELECT * FROM estates ORDER BY createdAt DESC'),
    byId: db.prepare('SELECT * FROM estates WHERE id = ?'),
    byOwner: db.prepare('SELECT * FROM estates WHERE owner = ? ORDER BY createdAt DESC'),
    countOwner: db.prepare('SELECT COUNT(*) AS n FROM estates WHERE owner = ?'),
    insert: db.prepare(`
        INSERT INTO estates
        (id, district, subDistrict, sqm, age, transport, roomCount, floor, view, heating,
         elevator, parking, furnished, userPrice, systemPrice, note, photo, lat, lng, address,
         owner, userRole, companyName, createdAt)
        VALUES
        (@id, @district, @subDistrict, @sqm, @age, @transport, @roomCount, @floor, @view, @heating,
         @elevator, @parking, @furnished, @userPrice, @systemPrice, @note, @photo, @lat, @lng, @address,
         @owner, @userRole, @companyName, @createdAt)
    `),
    update: db.prepare(`
        UPDATE estates SET userPrice = @userPrice, note = @note, photo = @photo
        WHERE id = @id
    `),
    delete: db.prepare('DELETE FROM estates WHERE id = ?'),
};

// Çoklu fotoğraf için hazır ifadeler
const photoStmt = {
    insert: db.prepare(
        'INSERT INTO estate_photos (id, estateId, path, createdAt) VALUES (?, ?, ?, ?)'
    ),
    byEstate: db.prepare(
        'SELECT path FROM estate_photos WHERE estateId = ? ORDER BY createdAt ASC'
    ),
    allByIds: db.prepare('SELECT estateId, path FROM estate_photos ORDER BY createdAt ASC'),
    deleteOne: db.prepare('DELETE FROM estate_photos WHERE id = ? AND estateId = ?'),
    deleteAll: db.prepare('DELETE FROM estate_photos WHERE estateId = ?'),
};

// DB'de 0/1 tutulan boolean alanları JS boolean'a çevir
const rowToEstate = (r) =>
    r
        ? {
              ...r,
              elevator: !!r.elevator,
              parking: !!r.parking,
              furnished: !!r.furnished,
          }
        : r;

const Estate = {
    getAll: () => stmt.all.all().map(rowToEstate),

    getById: (id) => rowToEstate(stmt.byId.get(id) || null),

    getByOwner: (username) => stmt.byOwner.all(username).map(rowToEstate),

    countByOwner: (username) => stmt.countOwner.get(username).n,

    create: (data) => {
        const e = {
            id: crypto.randomUUID(),
            district: data.district || '',
            subDistrict: data.subDistrict || 'Merkez',
            sqm: Number(data.sqm) || 0,
            age: data.age || '0-5',
            transport: data.transport || 'yakin',
            roomCount: data.roomCount || '3+1',
            floor: data.floor || '4-7',
            view: data.view || 'standart',
            heating: data.heating || 'dogalgaz',
            elevator: data.elevator ? 1 : 0,
            parking: data.parking ? 1 : 0,
            furnished: data.furnished ? 1 : 0,
            userPrice: Number(data.userPrice) || 0,
            systemPrice: Number(data.systemPrice) || 0,
            note: data.note || 'Açıklama belirtilmedi.',
            photo: data.photo || '',
            lat: data.lat || null,
            lng: data.lng || null,
            address: data.address || '',
            owner: data.owner || 'Bilinmiyor',
            userRole: data.userRole || 'Bireysel Kullanıcı',
            companyName: data.companyName || '',
            createdAt: new Date().toISOString(),
        };
        stmt.insert.run(e);
        return rowToEstate(e);
    },

    update: (id, patch) => {
        const existing = Estate.getById(id);
        if (!existing) return null;
        stmt.update.run({
            id,
            userPrice: Number(patch.userPrice) || existing.userPrice,
            note: patch.note !== undefined ? patch.note : existing.note,
            photo: patch.photo !== undefined ? patch.photo : existing.photo,
        });
        return Estate.getById(id);
    },

    delete: (id) => stmt.delete.run(id).changes > 0,

    // ---------- Çoklu fotoğraf ----------
    // Bir ilana birden fazla fotoğraf ekle
    addPhotos: (estateId, paths) => {
        if (!Array.isArray(paths) || paths.length === 0) return [];
        const ts = new Date().toISOString();
        const ids = [];
        const tx = db.transaction(() => {
            paths.forEach((p) => {
                const id = crypto.randomUUID();
                photoStmt.insert.run(id, estateId, p, ts);
                ids.push(id);
            });
        });
        tx();
        return ids;
    },

    // Bir ilanın tüm fotoğraf yolları
    getPhotos: (estateId) =>
        photoStmt.byEstate.all(estateId).map((r) => r.path),

    // Çoklu ilan için { estateId: [paths] } haritası (N+1 sorguyu önler)
    getPhotosMap: () => {
        const map = {};
        photoStmt.allByIds.all().forEach((r) => {
            (map[r.estateId] = map[r.estateId] || []).push(r.path);
        });
        return map;
    },

    INDIVIDUAL_LIMIT: INDIVIDUAL_LISTING_LIMIT,
};

module.exports = Estate;
