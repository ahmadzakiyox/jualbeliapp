const Order = require('../../../infrastructure/database/models/Order');
const Product = require('../../../infrastructure/database/models/Product');

async function dashboardSummary(req, res, next) {
  try {
    const [totalProduct, totalOrder, paidOrder] = await Promise.all([
      Product.countDocuments(),
      Order.countDocuments(),
      Order.countDocuments({ paymentStatus: 'Paid' }),
    ]);

    res.json({
      totalProduct,
      totalOrder,
      paidOrder,
    });
  } catch (err) {
    next(err);
  }
}

async function transactionHistory(req, res, next) {
  try {
    const history = await Order.find().populate('productId').sort({ createdAt: -1 });
    res.json({ data: history });
  } catch (err) {
    next(err);
  }
}

module.exports = { dashboardSummary, transactionHistory };
