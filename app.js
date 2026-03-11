const express = require('express');
const path = require('path');
const { connectDatabase } = require('./src/config/database');
const productRoutes = require('./src/interfaces/http/routes/productRoutes');
const orderRoutes = require('./src/interfaces/http/routes/orderRoutes');
const adminRoutes = require('./src/interfaces/http/routes/adminRoutes');
const paymentRoutes = require('./src/interfaces/http/routes/paymentRoutes');
const { notFoundHandler, errorHandler } = require('./src/interfaces/http/middlewares/errorHandler');

const app = express();

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'views', 'index.html')));
app.get('/beranda', (req, res) => res.sendFile(path.join(__dirname, 'views', 'index.html')));
app.get('/katalog/item', (req, res) => res.sendFile(path.join(__dirname, 'views', 'detail.html')));


app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await connectDatabase();
  } catch (error) {
    console.warn('MongoDB belum terhubung, server tetap berjalan untuk mode UI/API statis.');
  }

  app.listen(PORT, () => {
    console.log(`Server berjalan pada http://localhost:${PORT}`);
  });
}

startServer();
