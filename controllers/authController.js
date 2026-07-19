const bcrypt = require('bcrypt');
const crypto = require('crypto');
const User = require('../models/userModel');

// Sayfaları göster
exports.getRegisterPage = (req, res) => {
    if (req.session.user) return res.redirect('/dashboard');
    res.render('register', { title: 'Kayıt Ol', error: null });
};

exports.getLoginPage = (req, res) => {
    if (req.session.user) return res.redirect('/dashboard');
    res.render('login', {
        title: 'Giriş Yap',
        next: req.query.next || '/dashboard',
    });
};

// Kayıt işlemi (JSON yanıtlı — frontend fetch ile çağırır)
exports.registerUser = async (req, res) => {
    const { username, password, role, companyName } = req.body;

    if (!username || !password || !role) {
        return res
            .status(400)
            .json({ success: false, message: 'Lütfen tüm alanları doldurun.' });
    }
    if (role === 'Emlak Ofisi / Danışman' && !companyName) {
        return res
            .status(400)
            .json({ success: false, message: 'Emlak ofisi için firma adı zorunludur.' });
    }

    try {
        if (User.findByUsername(username)) {
            return res
                .status(400)
                .json({ success: false, message: 'Bu kullanıcı adı zaten alınmış.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        User.save({
            id: crypto.randomUUID(),
            username,
            password: hashedPassword,
            role,
            companyName: role === 'Emlak Ofisi / Danışman' ? companyName : '',
        });

        return res.status(201).json({
            success: true,
            message: 'Kayıt başarılı!',
            redirectUrl: '/login',
        });
    } catch (error) {
        console.error('Kayıt Hatası:', error);
        return res.status(500).json({ success: false, message: 'Sunucu hatası oluştu.' });
    }
};

// Giriş işlemi (JSON yanıtlı)
exports.loginUser = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res
            .status(400)
            .json({ success: false, message: 'Lütfen kullanıcı adı ve şifrenizi girin.' });
    }

    try {
        const user = User.findByUsername(username);
        if (!user) {
            return res
                .status(404)
                .json({ success: false, message: 'Kullanıcı bulunamadı.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Hatalı şifre!' });
        }

        // Oturuma güvenli (şifresiz) kullanıcı bilgisini yaz
        req.session.user = User.toSafe(user);

        // `?next=` ile gelen dönüş adresine veya dashboard'a git
        const redirectUrl =
            (req.body && req.body.next) || req.query.next || '/dashboard';
        return res.status(200).json({
            success: true,
            message: 'Giriş başarılı! Yönlendiriliyorsunuz...',
            redirectUrl,
        });
    } catch (error) {
        console.error('Giriş Hatası:', error);
        return res.status(500).json({ success: false, message: 'Sunucu hatası oluştu.' });
    }
};

// Çıkış — oturumu yok et ve çerezi temizle
exports.logout = (req, res) => {
    req.session.destroy(() => {
        res.clearCookie('emlak.sid');
        res.redirect('/login');
    });
};
