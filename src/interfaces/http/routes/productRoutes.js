const router = require('express').Router();
const { listProducts } = require('../controllers/productController');

router.get('/', listProducts);

module.exports = router;
