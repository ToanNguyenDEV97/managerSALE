const mongoose = require('mongoose');
require('dotenv').config();


const connectDB = async () => {
    try {
        const connString = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/managerSALE';
        await mongoose.connect(connString);
        console.log('✅ MongoDBMongoDB connected successfully.');
        // await seedDatabase();
    } catch (err) {
        console.error(`❌ Lỗi kết nối MongoDB: ${err.message}`);
    }
};

module.exports = connectDB;