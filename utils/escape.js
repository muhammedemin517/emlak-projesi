/**
 * HTML kaçış yardımcısı.
 * NOT: EJS `<%= %>` zaten otomatik kaçış yapar, bu yüzden çoğu yerde gerek yoktur.
 * Sadece öznitelik (attribute) içine veya JSON'u HTML'e gömerken ek güvenlik için kullanın.
 */
const escapeHtml = (str) =>
    String(str == null ? '' : str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

module.exports = { escapeHtml };
