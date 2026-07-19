const crypto = require('crypto');
const db = require('../db/database');

const stmt = {
    all: db.prepare('SELECT * FROM messages'),
    inbox: db.prepare('SELECT * FROM messages WHERE toUser = ? ORDER BY createdAt DESC'),
    unread: db.prepare('SELECT COUNT(*) AS n FROM messages WHERE toUser = ? AND read = 0'),
    insert: db.prepare(`
        INSERT INTO messages (id, listingId, fromUser, toUser, body, phone, read, createdAt)
        VALUES (@id, @listingId, @fromUser, @toUser, @body, @phone, @read, @createdAt)
    `),
    markRead: db.prepare('UPDATE messages SET read = 1 WHERE id = ? AND toUser = ?'),
};

// read alanı DB'de 0/1 — JS boolean'a çevir
const rowToMsg = (m) => (m ? { ...m, read: !!m.read } : m);

const Message = {
    getAll: () => stmt.all.all().map(rowToMsg),

    getInbox: (username) => stmt.inbox.all(username).map(rowToMsg),

    countUnread: (username) => stmt.unread.get(username).n,

    create: ({ listingId, fromUser, toUser, body, phone }) => {
        const m = {
            id: crypto.randomUUID(),
            listingId,
            fromUser,
            toUser,
            body,
            phone: phone || '',
            read: 0,
            createdAt: new Date().toISOString(),
        };
        stmt.insert.run(m);
        return rowToMsg(m);
    },

    markRead: (id, username) => stmt.markRead.run(id, username).changes > 0,
};

module.exports = Message;
