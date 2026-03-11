const { processPaymentWebhook } = require('../../../application/use-cases/processPaymentWebhook');

async function tripayWebhook(req, res, next) {
  try {
    const signature = req.headers['x-callback-signature'];
    const rawBody = JSON.stringify(req.body);

    await processPaymentWebhook({
      rawBody,
      signature,
      event: req.body,
    });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { tripayWebhook };
