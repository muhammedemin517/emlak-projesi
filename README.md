# Emlak Pazaryeri

Piyasa endeksli gayrimenkul değerleme motoru + ilan pazaryeri. Express 5 +
EJS + **SQLite (better-sqlite3)** veritabanı.

## Başlangıç

```bash
npm install          # bağımlılıklar
npm run seed         # data/marketData.json üret (13 şehir endeksi)
npm run migrate      # (bir kez) eski JSON verisini SQLite'a taşır
npm start            # sunucuyu başlat -> http://localhost:3000/login
```

İlk açılışta `data/app.db` otomatik oluşturulur ve tablolar kurulur.
`migrate` yalnızca eski `data/*.json` kayıtlarını DB'ye aktarmak içindir;
boş bir kurulumda (data/ yoksa) atlanabilir.

Ayarlar için `.env.example` dosyasını `.env` olarak kopyalayın
(özellikle production'da `SESSION_SECRET`).

## Mimari

```
app.js                # Express: EJS, session, helmet, static, 404/hata middleware
db/                   # database.js (SQLite bağlantı + şema), migrate.js (JSON→DB)
routes/               # authRoutes, estateRoutes (rotalar)
controllers/          # authController, estateController, messageController
models/               # user, estate, favorite, message (SQLite), market (JSON referans)
middleware/           # auth (requireAuth/requireRole), rateLimit
utils/                # valuation, format, escape, centroids (harita), liveScraper (kazıma), fileStore
views/                # EJS sayfaları + partials/ (head, nav)
public/               # css/style.css, uploads/ (ilan görselleri)
data/                 # app.db (veritabanı) + marketData.json (endeks) + eski JSON'lar
scraper.js            # seed: örnek piyasa endeks verisi üretir
```

**Veri depolama:** İşlemsel veriler (kullanıcı, ilan, favori, mesaj)
`data/app.db` SQLite veritabanında tutulur. Piyasa endeks verisi
(`marketData.json`) salt-okunur referans/seed verisi olduğu için JSON'da kalır
(gerçek dünyada config/lookup verisinin ayrı tutulması yaygın bir desendir).
Eski `data/users.json`, `estates.json` vb. artık yedek/ölü dosyalardır;
verinin kaynağı `app.db`'dir.

## Özellikler

- **Oturum (session)** tabanlı kimlik doğrulama (`global.currentUser` kaldırıldı).
  Çıkış yapma (`/logout`) ve korumalı rotalar (`requireAuth`).
- **Değerleme motoru**: m² × ilçe çarpanı × bina yaşı × ulaşım × oda sayısı ×
  kat × manzara × ısınma × asansör/otopark/eşyalı. Rapor, hesap dökümü ve
  PDF/yazdır ile birlikte gelir.
- **İlan pazaryeri**: kart grid, şehir/ilçe/fiyat filtresi, sıralama, sayfalama.
- **Fotoğraf yükleme**: çoklu fotoğraf + galeri (multer, `public/uploads/`, en fazla 8).
- **📍 Harita (Leaflet + OpenStreetMap)**: dashboard'da ilan konumunu haritadan
  işaretle (lat/lng), ilan detayında harita göster. İşaretlenmezse şehir merkezi kullanılır.
- **İlan yönetimi**: ekle / düzenle / sil (sadece sahip).
- **Favoriler** ve **satıcıya mesaj** (gelen kutusu + okunmadı rozeti).
- **Roller**: Bireysel (maks 3 ilan) ve Emlak Ofisi (sınırsız, listede öne çıkar).
- **Güvenlik**: helmet (CSP), rate-limit (giriş/kayıt), EJS otomatik XSS kaçışı,
  atomik dosya yazımı, şifreler bcrypt ile hash'lenir.

## Sonraki adımlar (önerilen)

- **Kazımayı gerçek kaynağa bağlama**: `SCRAPER_URL` ile bir hedef ayarlayıp
  `utils/liveScraper.js` içindeki seçiciyi siteye uyarlayın (gerçek siteler
  bot koruması kullanır; başarısız olursa otomatik örnek veriye düşer).
- İlana **ödeme entegrasyonu** ve **gelişmiş arama** (harita üzerinde bölge seçimi).
- **Testler** (Jest): değerleme motoru, auth, model katmanı.
- **Loglama** (winston/morgan) ve Docker ile bulut deploy (Render/Railway).
- İhtiyaç olursa SQLite → PostgreSQL'e geçiş (model katmanı sayesinde tek yerde).
