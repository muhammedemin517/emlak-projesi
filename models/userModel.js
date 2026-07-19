const crypto = require('crypto');
const db = require('../db/database');

const stmt = {
    insert: db.prepare(`
        INSERT INTO users (id, username, password, role, companyName, createdAt)
        VALUES (@id, @username, @password, @role, @companyName, @createdAt)
    `),
    all: db.prepare('SELECT * FROM users ORDER BY createdAt DESC'),
    byUsername: db.prepare('SELECT * FROM users WHERE username = ?'),
};

const User = {
    getAll: () => stmt.all.all(),

    save: (userData) => {
        const u = {
            id: userData.id || crypto.randomUUID(),
            username: userData.username,
            password: userData.password,
            role: userData.role,
            companyName: userData.companyName || '',
            createdAt: userData.createdAt || new Date().toISOString(),
        };
        stmt.insert.run(u);
        return u;
    },

    findByUsername: (username) => stmt.byUsername.get(username) || null,

    // Şifre hariç güvenli temsil — oturuma yazarken kullanılır
    toSafe: (user) => {
        if (!user) return null;
        const { password, ...safe } = user;
        return safe;
    },
};

module.exports = User;
