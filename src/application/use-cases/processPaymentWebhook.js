const crypto = require('crypto');
const Order = require('../../infrastructure/database/models/Order');
const Product = require('../../infrastructure/database/models/Product');
const { sendDigitalDeliveryEmail } = require('../../infrastructure/email/mailer');

function verifyTripaySignature(rawBody, callbackSignature) {
  const privateKey = process.env.TRIPAY_PRIVATE_KEY;
  const computed = crypto.createHmac('sha256', privateKey).update(rawBody).digest('hex');
  return computed === callbackSignature;
}

async function processPaymentWebhook({ rawBody, signature, event }) {
  if (!verifyTripaySignature(rawBody, signature)) {
    const err = new Error('Invalid signature');
    err.status = 401;
    throw err;
  }

  const { merchant_ref: merchantRef, status } = event;
  const order = await Order.findOne({ invoiceNo: merchantRef });
  if (!order) {
    const err = new Error('Order tidak ditemukan');
    err.status = 404;
    throw err;
  }

  if (status === 'PAID' && order.paymentStatus !== 'Paid') {
    const product = await Product.findById(order.productId);

    order.paymentStatus = 'Paid';
    order.digitalDelivery = {
      licenseKey: `LIC-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
      downloadUrl: `https://cdn.example.com/download/${order.invoiceNo}`,
      deliveredAt: new Date(),
    };
    await order.save();

    await sendDigitalDeliveryEmail({
      to: order.customerEmail,
      invoiceNo: order.invoiceNo,
      downloadUrl: order.digitalDelivery.downloadUrl,
      licenseKey: order.digitalDelivery.licenseKey,
      productName: product?.name,
    });
  }

  if (['EXPIRED', 'FAILED'].includes(status)) {
    order.paymentStatus = status === 'EXPIRED' ? 'Expired' : 'Failed';
    await order.save();
  }

  return order;
}

module.exports = { processPaymentWebhook };
