const Product = require('../../../infrastructure/database/models/Product');
const { sanitizeString, sanitizeNumber } = require('../../../shared/sanitize');

async function listProducts(req, res, next) {
  try {
    const products = await Product.find({ isActive: true }).sort({ createdAt: -1 });
    res.json({ data: products });
  } catch (err) {
    next(err);
  }
}

async function createProduct(req, res, next) {
  try {
    const payload = {
      name: sanitizeString(req.body.name),
      slug: sanitizeString(req.body.slug).toLowerCase(),
      description: sanitizeString(req.body.description),
      price: sanitizeNumber(req.body.price),
      type: sanitizeString(req.body.type),
    };

    if (!payload.name || !payload.slug || payload.price <= 0) {
      return res.status(400).json({ message: 'Input produk tidak valid' });
    }

    const created = await Product.create(payload);
    res.status(201).json({ data: created });
  } catch (err) {
    next(err);
  }
}

module.exports = { listProducts, createProduct };
