const mongoose = require('mongoose');

async function connectDatabase() {
  mongoose.set('strictQuery', true);
  mongoose.set('sanitizeFilter', true);

  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) throw new Error('MONGO_URI belum diset');

  await mongoose.connect(mongoUri);
  console.log('MongoDB connected');
}

module.exports = { connectDatabase };
