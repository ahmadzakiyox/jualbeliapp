const crypto = require('crypto');

async function createQrisTransaction({ merchantRef, amount, customerEmail }) {
  const apiKey = process.env.TRIPAY_API_KEY;
  const privateKey = process.env.TRIPAY_PRIVATE_KEY;
  const merchantCode = process.env.TRIPAY_MERCHANT_CODE;

  const signature = crypto
    .createHmac('sha256', privateKey)
    .update(`${merchantCode}${merchantRef}${amount}`)
    .digest('hex');

  const payload = {
    method: 'QRIS',
    merchant_ref: merchantRef,
    amount,
    customer_email: customerEmail,
    order_items: [{ sku: merchantRef, name: 'Digital Product', price: amount, quantity: 1 }],
    signature,
  };

  const response = await fetch('https://tripay.co.id/api-sandbox/transaction/create', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Tripay error: ${errorText}`);
  }

  const result = await response.json();
  return result.data;
}

module.exports = { createQrisTransaction };
