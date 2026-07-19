const express = require('express');
const router = express.Router();
const estateController = require('../controllers/estateController');
const messageController = require('../controllers/messageController');
const { requireAuth } = require('../middleware/auth');

// 1. Dashboard (giriş gerekli)
router.get('/', requireAuth, estateController.getDashboard);
router.get('/dashboard', requireAuth, estateController.getDashboard);

// 2. Değer hesaplama + rapor
router.post('/calculate', requireAuth, estateController.calculateValuation);

// 3. İlanı yayına al (çoklu foto yükleme dahil)
router.post('/publish', requireAuth, estateController.upload.array('photos', 8), estateController.publishListing);

// 4. Pazaryeri (herkese açık) — sayfalama/filtre/sıralama
router.get('/listings', estateController.getListings);

// 5. İlan detay (herkese açık; mesaj formu içerir)
router.get('/listings/:id', estateController.getListingDetail);

// 6. Benim ilanlarım
router.get('/my-listings', requireAuth, estateController.getMyListings);

// 7. İlan düzenle
router.get('/edit-listing/:id', requireAuth, estateController.getEditForm);
router.post('/edit-listing/:id', requireAuth, estateController.upload.array('photos', 8), estateController.updateListing);

// 8. İlan sil
router.post('/delete-listing', requireAuth, estateController.deleteListing);

// 9. Profil
router.get('/profile', requireAuth, estateController.getProfile);

// 10. Favoriler
router.post('/favorite/:id', requireAuth, estateController.toggleFavorite);
router.get('/favorites', requireAuth, estateController.getFavorites);

// 11. Mesajlar
router.get('/messages', requireAuth, messageController.getInbox);
router.post('/listings/:id/message', requireAuth, messageController.sendMessage);
router.post('/messages/:id/read', requireAuth, messageController.markRead);

module.exports = router;
