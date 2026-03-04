const mongoose = require('mongoose');

const AccountStockSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    email: { type: String, required: true },
    username: { type: String, default: '' },
    password: { type: String, required: true },
    twoFactorEmail: { type: String, default: '' }, // 2FA Khusus Email
    twoFactorApp: { type: String, default: '' },   // 2FA Backup Code/App (Opsional)
    isSold: { type: Boolean, default: false },
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true });

module.exports = mongoose.model('AccountStock', AccountStockSchema);