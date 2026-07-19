const path = require('path');
const Database = require('better-sqlite3');

const DB_PATH = path.join(__dirname, '../data/app.db');

// Tek bağlantı (synchronous API — better-sqlite3 bloklu çalışır, event-loop dostu)
const db = new Database(DB_PATH);

// WAL modu: eşzamanlı okuma/yazma için daha iyi performans
db.pragma('journal_mode = WAL');
// Yabancı anahtar kısıtları aktif
db.pragma('foreign_keys = ON');

// ==========================================
// ŞEMA
// ==========================================
db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id          TEXT PRIMARY KEY,
        username    TEXT UNIQUE NOT NULL,
        password    TEXT NOT NULL,
        role        TEXT NOT NULL,
        companyName TEXT DEFAULT '',
        createdAt   TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS estates (
        id          TEXT PRIMARY KEY,
        district    TEXT,
        subDistrict TEXT,
        sqm         INTEGER,
        age         TEXT,
        transport   TEXT,
        roomCount   TEXT,
        floor       TEXT,
        view        TEXT,
        heating     TEXT,
        elevator    INTEGER DEFAULT 1,   -- 0/1 (boolean)
        parking     INTEGER DEFAULT 0,
        furnished   INTEGER DEFAULT 0,
        userPrice   INTEGER,
        systemPrice INTEGER,
        note        TEXT,
        photo       TEXT DEFAULT '',     -- eski tekil foto (geriye dönük uyum)
        lat         REAL,
        lng         REAL,
        address     TEXT DEFAULT '',     -- tam adres (sokak/mahalle/ilçe/il)
        owner       TEXT,
        userRole    TEXT,
        companyName TEXT DEFAULT '',
        createdAt   TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS estate_photos (
        id        TEXT PRIMARY KEY,
        estateId  TEXT NOT NULL,
        path      TEXT NOT NULL,
        createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS favorites (
        id        TEXT PRIMARY KEY,
        username  TEXT NOT NULL,
        listingId TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        UNIQUE(username, listingId)
    );

    CREATE TABLE IF NOT EXISTS messages (
        id        TEXT PRIMARY KEY,
        listingId TEXT,
        fromUser  TEXT,
        toUser    TEXT,
        body      TEXT,
        phone     TEXT DEFAULT '',
        read      INTEGER DEFAULT 0,     -- 0/1 (boolean)
        createdAt TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_estates_owner ON estates(owner);
    CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(username);
    CREATE INDEX IF NOT EXISTS idx_messages_to ON messages(toUser, read);
    CREATE INDEX IF NOT EXISTS idx_photos_estate ON estate_photos(estateId);
`);

// ==========================================
// ŞEMA EVRİMİ (mevcut app.db için)
// ==========================================
// İlk sürümde olmayan kolonlar varsa güvenli şekilde ekle.
function addColumnIfMissing(table, column, definition) {
    const cols = db.prepare(`PRAGMA table_info(${table})`).all().map((c) => c.name);
    if (!cols.includes(column)) {
        db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    }
}
addColumnIfMissing('estates', 'lat', 'REAL');
addColumnIfMissing('estates', 'lng', 'REAL');
addColumnIfMissing('estates', 'address', 'TEXT');

module.exports = db;
