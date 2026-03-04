require('dotenv').config();
const mongoose = require('mongoose');

// Koneksi ke MongoDB menggunakan URI di .env
mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log('✅ Berhasil terhubung ke MongoDB untuk perbaikan...');
        
        try {
            // PERINTAH SAKTI: Menghapus aturan "userId_1" yang error
            await mongoose.connection.collection('users').dropIndex('userId_1');
            console.log('🚀 SUKSES: Index hantu "userId_1" berhasil dibasmi!');
            
            // JIKA KAMU INGIN MENGHAPUS SELURUH DATANYA SEKALIAN (Reset Total),
            // Hapus tanda garis miring (//) pada baris di bawah ini:
            // await mongoose.connection.collection('users').drop();
            // console.log('💣 SUKSES: Seluruh data users berhasil di-reset!');

        } catch (error) {
            console.log('⚠️ Info:', error.message);
            console.log('Sepertinya index sudah terhapus atau tidak ditemukan.');
        } finally {
            // Tutup koneksi setelah selesai
            mongoose.disconnect();
            console.log('🔌 Koneksi diputus. Selesai!');
        }
    })
    .catch(err => console.error('❌ Gagal koneksi DB:', err.message));