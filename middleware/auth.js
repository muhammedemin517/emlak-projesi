/**
 * Oturum (session) tabanlı yetki middleware'leri.
 * global.currentUser yerine req.session.user kullanılır.
 */

// Giriş zorunlu — değilse /login'e yönlendir (dönüş adresi `next` ile saklanır)
const requireAuth = (req, res, next) => {
    if (req.session && req.session.user) return next();
    return res.redirect('/login?next=' + encodeURIComponent(req.originalUrl));
};

// Giriş opsiyonel — herkese açık sayfalarda kullanılır
const optionalAuth = (req, res, next) => next();

// Sadece belirli roller (ör. emlak ofisi)
const requireRole = (...roles) => (req, res, next) => {
    if (!req.session || !req.session.user) {
        return res.redirect('/login?next=' + encodeURIComponent(req.originalUrl));
    }
    if (roles.includes(req.session.user.role)) return next();
    return res.status(403).render('error', {
        title: 'Yetkisiz Erişim',
        statusCode: 403,
        message: 'Bu işlem için yetkiniz bulunmuyor.',
        currentUser: req.session.user,
    });
};

module.exports = { requireAuth, optionalAuth, requireRole };
