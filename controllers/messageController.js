const Estate = require('../models/estateModel');
const Message = require('../models/messageModel');

// Gelen kutusu
exports.getInbox = (req, res) => {
    const messages = Message.getInbox(req.session.user.username);
    res.render('messages', {
        title: 'Mesajlarım',
        messages,
        helpers: require('../utils/format'),
    });
};

// Bir ilan için satıcıya mesaj gönder
exports.sendMessage = (req, res) => {
    const { id } = req.params;
    const { body, phone } = req.body;
    const listing = Estate.getById(id);

    if (!listing) {
        return res.render('error', {
            title: 'İlan Yok', statusCode: 404, message: 'İlan bulunamadı.',
        });
    }
    if (!body || body.trim() === '') {
        return res.redirect('/listings/' + id);
    }

    const fromUser = req.session.user ? req.session.user.username : 'Misafir';

    // Kendi ilanına mesaj göndermeyi engelle
    if (fromUser === listing.owner) {
        return res.redirect('/listings/' + id);
    }

    Message.create({
        listingId: id,
        fromUser,
        toUser: listing.owner,
        body: body.trim(),
        phone: (phone || '').trim(),
    });

    res.redirect('/listings/' + id + '?sent=1');
};

// Mesajı okundu işaretle
exports.markRead = (req, res) => {
    Message.markRead(req.params.id, req.session.user.username);
    res.redirect('/messages');
};
