export const API = '/api/index.php';
export const wa = (c, text) => `https://wa.me/${(c.contact.whatsapp || '').replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
