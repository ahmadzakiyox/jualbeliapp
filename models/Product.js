const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    namaProduk: { type: String, required: true },
    kategori: { type: String, required: true },
    harga: { type: Number, required: true },
    stok: { type: Number, required: true },
    gambarUrl: { type: String, default: 'https://via.placeholder.com/300' },
    deskripsi: { type: String, required: true },
    penjualId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Product', ProductSchema);