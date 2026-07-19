const crypto = require('crypto');
const db = require('../db/database');

const stmt = {
    all: db.prepare('SELECT * FROM favorites'),
    byUser: db.prepare('SELECT * FROM favorites WHERE username = ? ORDER BY createdAt DESC'),
    exists: db.prepare('SELECT 1 FROM favorites WHERE username = ? AND listingId = ?'),
    insert: db.prepare(
        'INSERT INTO favorites (id, username, listingId, createdAt) VALUES (?, ?, ?, ?)'
    ),
    delete: db.prepare('DELETE FROM favorites WHERE username = ? AND listingId = ?'),
};

const Favorite = {
    getAll: () => stmt.all.all(),

    getIdsByUser: (username) => stmt.byUser.all(username).map((f) => f.listingId),

    getByUser: (username) => stmt.byUser.all(username),

    isFavorite: (username, listingId) => !!stmt.exists.get(username, listingId),

    add: (username, listingId) => {
        if (Favorite.isFavorite(username, listingId)) return false;
        stmt.insert.run(crypto.randomUUID(), username, listingId, new Date().toISOString());
        return true;
    },

    remove: (username, listingId) => stmt.delete.run(username, listingId).changes > 0,

    toggle: (username, listingId) => {
        if (Favorite.isFavorite(username, listingId)) {
            Favorite.remove(username, listingId);
            return false; // artık favori değil
        }
        Favorite.add(username, listingId);
        return true; // favoriye eklendi
    },
};

module.exports = Favorite;
