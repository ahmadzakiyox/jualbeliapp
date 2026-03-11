const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    invoiceNo: { type: String, required: true, unique: true, index: true },
    customerEmail: { type: String, required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductV2', required: true },
    grossAmount: { type: Number, required: true, min: 0 },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Paid', 'Failed', 'Expired'],
      default: 'Pending',
      index: true,
    },
    paymentProviderRef: { type: String },
    qrisPayload: { type: Object },
    digitalDelivery: {
      licenseKey: { type: String },
      downloadUrl: { type: String },
      deliveredAt: { type: Date },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('OrderV2', orderSchema);
