# JualBeli App - Clean Architecture (Digital Product E-commerce)

## Struktur Folder

```bash
.
├── app.js
├── public/
├── src/
│   ├── application/
│   │   └── use-cases/
│   │       ├── createOrder.js
│   │       └── processPaymentWebhook.js
│   ├── config/
│   │   └── database.js
│   ├── infrastructure/
│   │   ├── database/models/
│   │   │   ├── Order.js
│   │   │   └── Product.js
│   │   ├── email/mailer.js
│   │   └── payment/tripayClient.js
│   ├── interfaces/http/
│   │   ├── controllers/
│   │   │   ├── adminController.js
│   │   │   ├── orderController.js
│   │   │   ├── paymentController.js
│   │   │   └── productController.js
│   │   ├── middlewares/errorHandler.js
│   │   └── routes/
│   │       ├── adminRoutes.js
│   │       ├── orderRoutes.js
│   │       ├── paymentRoutes.js
│   │       └── productRoutes.js
│   └── shared/sanitize.js
└── views/
```

## Catatan Fitur

- Katalog produk digital lewat `GET /api/products`.
- Checkout membuat transaksi QRIS (contoh Tripay sandbox) lewat `POST /api/orders/checkout`.
- Webhook payment gateway ke `POST /api/payments/tripay/webhook` untuk update status otomatis jadi `Paid`.
- Setelah `Paid`, sistem membuat `licenseKey` + `downloadUrl` lalu kirim email delivery otomatis.
- Halaman success dapat polling ke `GET /api/orders/success/:invoiceNo`.
- Admin dashboard sederhana lewat:
  - `POST /api/admin/products` (input produk)
  - `GET /api/admin/dashboard` (ringkasan)
  - `GET /api/admin/transactions` (riwayat transaksi)

## Keamanan Input

- `mongoose.set('sanitizeFilter', true)` untuk mengurangi NoSQL injection di query/filter.
- Validasi ObjectId untuk endpoint checkout.
- Sanitasi string/number di `src/shared/sanitize.js`.

## Environment Variable

```bash
MONGO_URI=
PORT=3000
TRIPAY_API_KEY=
TRIPAY_PRIVATE_KEY=
TRIPAY_MERCHANT_CODE=
```
