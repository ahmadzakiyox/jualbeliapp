const router = require('express').Router();
const { tripayWebhook } = require('../controllers/paymentController');

router.post('/tripay/webhook', tripayWebhook);

module.exports = router;
