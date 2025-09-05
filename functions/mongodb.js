const mongoose = require('mongoose');

module.exports = {
  connect: async () => {
    const mongoURL = process.env.MONGO_URL;
    if (!mongoURL) return;

    try {
      await mongoose.connect(mongoURL, {});
      console.log('✅   Connected to MongoDB');
    } catch (err) {
      console.error('❌   Failed to connect to MongoDB:', err);
    }
  }
};
