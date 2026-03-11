async function sendDigitalDeliveryEmail({ to, invoiceNo, downloadUrl, licenseKey }) {
  // Ganti dengan nodemailer/third party email provider di production.
  console.log('Send delivery email', { to, invoiceNo, downloadUrl, licenseKey });
}

module.exports = { sendDigitalDeliveryEmail };
