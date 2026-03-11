function sanitizeString(value = '') {
  if (typeof value !== 'string') return '';
  return value.replace(/[<>$]/g, '').trim();
}

function sanitizeNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

module.exports = {
  sanitizeString,
  sanitizeNumber,
};
