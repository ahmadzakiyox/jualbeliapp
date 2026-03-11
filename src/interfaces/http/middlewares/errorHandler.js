function notFoundHandler(req, res) {
  res.status(404).json({ message: 'Route tidak ditemukan' });
}

function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  res.status(status).json({ message: err.message || 'Internal server error' });
}

module.exports = { notFoundHandler, errorHandler };
