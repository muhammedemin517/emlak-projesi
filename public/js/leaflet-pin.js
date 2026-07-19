/**
 * Leaflet marker ikonu — lokal yollarla açıkça tanımlanır.
 * Leaflet'in varsayılan ikon yol çözümü lokal/bundle kurulumlarda bazen
 * çalışmadığı için işaretçi görünmez. Bu global ikonu marker'lara doğrudan
 * veriyoruz (güvenilir yöntem).
 */
window.LEAFLET_PIN = L.icon({
    iconUrl: '/vendor/leaflet/images/marker-icon.png',
    iconRetinaUrl: '/vendor/leaflet/images/marker-icon-2x.png',
    shadowUrl: '/vendor/leaflet/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});
