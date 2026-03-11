const router = require('express').Router();
const { checkout, getSuccessPageData } = require('../controllers/orderController');

router.post('/checkout', checkout);
router.get('/success/:invoiceNo', getSuccessPageData);

module.exports = router;
