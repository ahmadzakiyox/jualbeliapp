const router = require('express').Router();
const { createProduct } = require('../controllers/productController');
const { dashboardSummary, transactionHistory } = require('../controllers/adminController');

router.post('/products', createProduct);
router.get('/dashboard', dashboardSummary);
router.get('/transactions', transactionHistory);

module.exports = router;
