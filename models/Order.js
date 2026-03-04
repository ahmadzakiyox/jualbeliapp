const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    pembeliId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    penjualId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    totalHarga: { type: Number, required: true },
    // Menyimpan data akun yang dikirim (Email, Pass, 2FA) agar permanen di riwayat pembeli
    detailAkunTerbeli: {
        email: String,
        username: String,
        password: String,
        twoFactorEmail: String,
        twoFactorApp: String
    },
    statusPesanan: { type: String, default: 'success' }
}, { timestamps: true });

module.exports = mongoose.model('Order', OrderSchema);