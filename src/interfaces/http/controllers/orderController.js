const mongoose = require('mongoose');
const Order = require('../../../infrastructure/database/models/Order');
const { createOrder } = require('../../../application/use-cases/createOrder');
const { sanitizeString } = require('../../../shared/sanitize');

async function checkout(req, res, next) {
  try {
    const { productId, customerEmail } = req.body;
    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ message: 'productId tidak valid' });
    }

    const order = await createOrder({
      productId,
      customerEmail: sanitizeString(customerEmail),
    });

    res.status(201).json({
      invoiceNo: order.invoiceNo,
      status: order.paymentStatus,
      qris: order.qrisPayload,
    });
  } catch (err) {
    next(err);
  }
}

async function getSuccessPageData(req, res, next) {
  try {
    const order = await Order.findOne({ invoiceNo: req.params.invoiceNo }).populate('productId');
    if (!order) return res.status(404).json({ message: 'Order tidak ditemukan' });

    if (order.paymentStatus !== 'Paid') {
      return res.status(200).json({
        message: 'Menunggu pembayaran',
        paymentStatus: order.paymentStatus,
      });
    }

    return res.json({
      message: 'Pembayaran berhasil, produk digital siap dipakai.',
      paymentStatus: order.paymentStatus,
      productName: order.productId.name,
      downloadUrl: order.digitalDelivery?.downloadUrl,
      licenseKey: order.digitalDelivery?.licenseKey,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { checkout, getSuccessPageData };
