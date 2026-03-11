const Product = require('../../infrastructure/database/models/Product');
const Order = require('../../infrastructure/database/models/Order');
const { createQrisTransaction } = require('../../infrastructure/payment/tripayClient');

async function createOrder({ productId, customerEmail }) {
  const product = await Product.findById(productId);
  if (!product || !product.isActive) {
    const err = new Error('Produk tidak tersedia');
    err.status = 404;
    throw err;
  }

  const merchantRef = `INV-${Date.now()}`;

  const qris = await createQrisTransaction({
    merchantRef,
    amount: product.price,
    customerEmail,
  });

  const order = await Order.create({
    invoiceNo: merchantRef,
    customerEmail,
    productId: product._id,
    grossAmount: product.price,
    paymentProviderRef: qris.reference,
    qrisPayload: qris,
  });

  return order;
}

module.exports = { createOrder };
