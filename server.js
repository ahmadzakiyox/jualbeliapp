const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const path = require('path');

// PANGGIL SEMUA MODEL DATABASE
const User = require('./models/User'); 
const Product = require('./models/Product');
const AccountStock = require('./models/AccountStock');
const Order = require('./models/Order');

const app = express();
const PORT = process.env.PORT || 3000;

// Konfigurasi "Tukang Pos" (Nodemailer Brevo)
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false, // true untuk 465, false untuk port lain
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
    }
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// HANYA folder 'public' (CSS & JS) yang terekspos langsung
app.use(express.static(path.join(__dirname, 'public')));

// --- KONEKSI DATABASE MONGODB ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ Database MongoDB Atlas Terhubung!'))
    .catch(err => console.error('❌ Gagal koneksi DB:', err.message));


// ==========================================
// 1. ENDPOINT VIEWS (URL DISAMARKAN)
// ==========================================
const renderHTML = (res, filename) => {
    res.sendFile(path.join(__dirname, 'views', `${filename}.html`));
};

app.get('/', (req, res) => renderHTML(res, 'index'));
app.get('/beranda', (req, res) => renderHTML(res, 'index'));
app.get('/katalog/item', (req, res) => renderHTML(res, 'detail'));
app.get('/portal/masuk', (req, res) => renderHTML(res, 'login'));
app.get('/portal/daftar', (req, res) => renderHTML(res, 'register'));
app.get('/portal/verifikasi', (req, res) => renderHTML(res, 'verify'));
app.get('/transaksi/keranjang', (req, res) => renderHTML(res, 'cart'));
app.get('/akun/dasbor', (req, res) => renderHTML(res, 'profile'));
app.get('/akun/favorit', (req, res) => renderHTML(res, 'waitlist'));
app.get('/akun/pengaturan', (req, res) => renderHTML(res, 'settings'));


// ==========================================
// 2. FUNGSI SATPAM (MIDDLEWARE JWT)
// ==========================================
const verifikasiToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    
    if (!authHeader) {
        return res.status(403).json({ success: false, message: 'Akses Ditolak: Anda harus login terlebih dahulu!' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; 
        next(); 
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Sesi habis atau token tidak valid. Silakan login ulang.' });
    }
};


// ==========================================
// 3. ENDPOINT API (UNTUK MENGIRIM/MENGAMBIL DATA)
// ==========================================

// POST: Tambah Etalase Produk Baru (Khusus Member/Penjual)
app.post('/api/v1/produk/tambah', verifikasiToken, async (req, res) => {
    try {
        if (req.user.role !== 'member') {
            return res.status(403).json({ success: false, message: 'Hanya Penjual yang bisa menambah produk!' });
        }

        const { namaProduk, kategori, harga, stok, gambarUrl, deskripsi } = req.body;
        
        const produkBaru = new Product({ 
            namaProduk, kategori, harga, stok, gambarUrl, deskripsi, 
            penjualId: req.user.id 
        });
        
        await produkBaru.save();
        res.status(201).json({ success: true, message: 'Etalase produk berhasil dibuat!', data: produkBaru });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Gagal membuat produk.' });
    }
});

// POST: Tambah Stok Akun ke Varian Tertentu (Khusus Member/Penjual)
app.post('/api/v1/stok/tambah', async (req, res) => {
    try {
        const { productId, varianId, daftarAkun } = req.body;
        const stokDisiapkan = daftarAkun.map(akun => ({
            productId, varianId, email: akun.email, username: akun.username || '',
            password: akun.password, twoFactorAuth: akun.twoFactorAuth || '', isSold: false
        }));
        await AccountStock.insertMany(stokDisiapkan);
        res.status(201).json({ success: true, message: `${daftarAkun.length} stok akun ditambahkan!` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Gagal menambah stok akun.' });
    }
});

// POST: Beli Akun Digital (Checkout) - Sebaiknya ini juga dipasang satpam nanti
app.post('/api/v1/transaksi/beli', async (req, res) => {
    try {
        const { pembeliId, productId, varianId, penjualId, hargaBeli } = req.body;

        const akunTersedia = await AccountStock.findOneAndUpdate(
            { productId, varianId, isSold: false },
            { isSold: true, buyerId: pembeliId },
            { new: true }
        );

        if (!akunTersedia) return res.status(400).json({ success: false, message: 'Stok kosong!' });

        const orderBaru = new Order({
            pembeliId, penjualId, totalHarga: hargaBeli, statusPesanan: 'success',
            itemDibeli: [{ productId, namaProduk: "Akun Digital", namaVarian: "Sesuai Pilihan", hargaBeli, akunId: akunTersedia._id }]
        });

        await orderBaru.save();
        akunTersedia.orderId = orderBaru._id;
        await akunTersedia.save();

        res.status(200).json({ success: true, message: 'Pembelian berhasil!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Gagal memproses transaksi.' });
    }
});

// GET: Lihat Riwayat Pesanan (DILINDUNGI SATPAM)
app.get('/api/v1/pesanan/saya', verifikasiToken, async (req, res) => {
    try {
        const pembeliIdAsli = req.user.id; 
        const riwayatPesanan = await Order.find({ pembeliId: pembeliIdAsli })
            .populate({ path: 'itemDibeli.akunId', select: 'email username password twoFactorAuth' })
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, data: riwayatPesanan });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Gagal mengambil riwayat pesanan.' });
    }
});

// GET: Ambil Semua Produk untuk Beranda (Public / Bisa diakses siapa saja)
app.get('/api/v1/produk', async (req, res) => {
    try {
        // Cari semua produk di database, urutkan dari yang paling baru diupload
        const daftarProduk = await Product.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: daftarProduk });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Gagal memuat produk dari database.' });
    }
});

// ==========================================
// RUTE API TAMBAHAN (PROFIL & PRODUK BERANDA)
// ==========================================

// GET: Ambil Data Profil User (Untuk ganti teks "Memuat...")
app.get('/api/v1/user/profil', verifikasiToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password -otp');
        if (!user) return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
        res.status(200).json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Gagal memuat profil.' });
    }
});

// PUT: Simpan/Update Profil User (Untuk halaman Pengaturan)
app.put('/api/v1/user/profil', verifikasiToken, async (req, res) => {
    try {
        const { namaLengkap, noHp, alamat } = req.body;
        const updatedUser = await User.findByIdAndUpdate(
            req.user.id, { namaLengkap, noHp, alamat }, { new: true }
        ).select('-password -otp');
        res.status(200).json({ success: true, message: 'Profil diperbarui!', data: updatedUser });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Gagal menyimpan profil.' });
    }
});

app.get('/api/v1/produk/detail/:id', async (req, res) => {
// GET: Ambil Detail SATU Produk Berdasarkan ID (Untuk halaman detail.html)
    try {
        // .populate() digunakan untuk menarik nama penjual langsung dari database User
        const produk = await Product.findById(req.params.id).populate('penjualId', 'namaLengkap');
        
        if (!produk) return res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });
        res.status(200).json({ success: true, data: produk });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Gagal memuat detail produk.' });
    }
});

// GET: Ambil Produk Penjual untuk Tabel Dashboard
app.get('/api/v1/produk/saya', verifikasiToken, async (req, res) => {
    try {
        const produk = await Product.find({ penjualId: req.user.id }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: produk });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Gagal mengambil data produk.' });
    }
});

// POST: Tambah Detail Akun (Username, Email, Pass, 2FA)
app.post('/api/v1/stok/tambah-detail', verifikasiToken, async (req, res) => {
    try {
        const { productId, email, username, password, twoFactorEmail, twoFactorApp } = req.body;
        
        const stokBaru = new AccountStock({
            productId, email, username, password, twoFactorEmail, twoFactorApp
        });
        await stokBaru.save();

        // Otomatis tambah angka stok di tabel Product
        await Product.findByIdAndUpdate(productId, { $inc: { stok: 1 } });

        res.status(201).json({ success: true, message: 'Data akun berhasil disimpan!' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Gagal menambah stok detail.' });
    }
});

// DELETE: Hapus Produk & Semua Stok Akunnya
app.delete('/api/v1/produk/:id', verifikasiToken, async (req, res) => {
    try {
        const produk = await Product.findOneAndDelete({ _id: req.params.id, penjualId: req.user.id });
        if (!produk) return res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });
        
        // Hapus juga semua stok akun yang belum terjual terkait produk ini
        await AccountStock.deleteMany({ productId: req.params.id, isSold: false });
        
        res.status(200).json({ success: true, message: 'Produk berhasil dihapus!' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Gagal menghapus produk.' });
    }
});
    
// REGISTER -> KIRIM OTP
app.post('/api/v1/auth/register', async (req, res) => {
    try {
        const { namaLengkap, email, role, password } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ success: false, message: 'Email sudah terdaftar!' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString(); // Buat 6 angka OTP

        const newUser = new User({ 
            namaLengkap, email, role, password: hashedPassword,
            otp: otpCode, isVerified: false 
        });
        await newUser.save(); 

        const mailOptions = {
            from: `"JualBeli.app Security" <${process.env.SMTP_FROM_EMAIL}>`,
            to: email,
            subject: '🔒 Kode Verifikasi Akun JualBeli.app',
            html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f6; margin: 0; padding: 0; }
                    .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
                    .header { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); padding: 30px 20px; text-align: center; color: white; }
                    .header h1 { margin: 0; font-size: 28px; letter-spacing: 1px; }
                    .content { padding: 40px 30px; text-align: center; color: #333333; }
                    .otp-box { background: #f8fafc; border: 2px dashed #4facfe; border-radius: 8px; padding: 20px; margin: 30px 0; font-size: 40px; font-weight: bold; color: #4facfe; letter-spacing: 12px; }
                    .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 13px; color: #888888; border-top: 1px solid #eeeeee; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1><span style="font-size: 24px;">🏪</span> JualBeli.app</h1>
                    </div>
                    <div class="content">
                        <h2 style="margin-top:0;">Halo, ${namaLengkap}!</h2>
                        <p style="font-size: 16px; line-height: 1.6; color: #555;">Terima kasih telah bergabung dengan <b>JualBeli.app</b>. Untuk menyelesaikan pendaftaran dan mengaktifkan akun Anda, silakan masukkan 6 digit kode keamanan berikut:</p>
                        
                        <div class="otp-box">${otpCode}</div>
                        
                        <p style="font-size: 14px; color: #e63946; background: #fff0f0; padding: 12px; border-radius: 6px; display: inline-block; border: 1px solid #ffcdcd;">
                            ⚠️ <b>RAHASIA:</b> Jangan pernah memberikan kode ini kepada siapa pun, termasuk admin atau pihak JualBeli.app.
                        </p>
                    </div>
                    <div class="footer">
                        <p>Email ini dikirim secara otomatis, mohon tidak membalas email ini.</p>
                        <p>&copy; 2026 JualBeli.app. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
            `
        };
        await transporter.sendMail(mailOptions);
        res.status(201).json({ success: true, message: 'OTP terkirim ke email Anda!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan saat mendaftar.' });
    }
});

// VERIFIKASI OTP
app.post('/api/v1/auth/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;
        const user = await User.findOne({ email });

        if (!user) return res.status(404).json({ success: false, message: 'User tidak ditemukan!' });
        if (user.isVerified) return res.status(400).json({ success: false, message: 'Akun sudah terverifikasi!' });
        if (user.otp !== otp) return res.status(400).json({ success: false, message: 'Kode OTP salah!' });

        user.isVerified = true;
        user.otp = null;
        await user.save();
        res.status(200).json({ success: true, message: 'Verifikasi berhasil! Silakan masuk.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
    }
});

// LOGIN (CEK STATUS VERIFIKASI)
app.post('/api/v1/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        
        if (!user) return res.status(404).json({ success: false, message: 'Email tidak terdaftar!' });
        if (!user.isVerified) return res.status(403).json({ success: false, message: 'Akun Anda belum diverifikasi OTP!' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ success: false, message: 'Password salah!' });

        const payload = { id: user._id, role: user.role, namaLengkap: user.namaLengkap };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });

        res.status(200).json({ success: true, message: 'Berhasil masuk!', token, userData: payload });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
    }
});

app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'views', '404.html'));
});

// Mulai Server
app.listen(PORT, () => {
    console.log(`🚀 Server E-Commerce aktif di: http://localhost:${PORT}`);
    console.log(`👉 Buka Beranda: http://localhost:${PORT}/beranda`);
    console.log(`👉 Buka Dasbor: http://localhost:${PORT}/akun/dasbor`);
});
