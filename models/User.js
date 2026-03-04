const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    namaLengkap: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // Nanti ini wajib di-hash (bcrypt)
    role: { type: String, enum: ['user', 'member'], default: 'user' },
    noHp: { type: String, default: '' },
    alamat: { type: String, default: '' },

    // --- TAMBAHAN UNTUK SMTP EMAIL ---
    otp: { type: String, default: null }, // Menyimpan 6 angka rahasia
    isVerified: { type: Boolean, default: false }, // Status akun aktif/belum
    
    // Menyimpan ID produk yang masuk keranjang & wishlist
    keranjang: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);    