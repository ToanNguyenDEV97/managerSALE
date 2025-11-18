const mongoose = require('mongoose');
require('dotenv').config();

const Product = require('./models/product.model');
const Category = require('./models/category.model');
const Customer = require('./models/customer.model');
const Supplier = require('./models/supplier.model');
const Quote = require('./models/quote.model');
const Order = require('./models/order.model');
const Invoice = require('./models/invoice.model');
const Delivery = require('./models/delivery.model');
const Purchase = require('./models/purchase.model');
const CashFlowTransaction = require('./models/cashFlowTransaction.model');

const initialData = require('./data.js');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB connected successfully.');
        // await seedDatabase();
    } catch (err) {
        console.error('MongoDB connection error:', err.message);
        process.exit(1);
    }
};

const seedDatabase = async () => {
    try {
        const productCount = await Product.countDocuments();
        if (productCount === 0) {
            console.log('Database is empty. Seeding data...');
            
            await Category.insertMany(initialData.categories);
            await Product.insertMany(initialData.products);
            await Customer.insertMany(initialData.customers);
            await Supplier.insertMany(initialData.suppliers);
            await Quote.insertMany(initialData.quotes);
            await Order.insertMany(initialData.orders);
            await Invoice.insertMany(initialData.invoices);
            await Delivery.insertMany(initialData.deliveries);
            await Purchase.insertMany(initialData.purchases);
            await CashFlowTransaction.insertMany(initialData.cashFlowTransactions);
            
            console.log('Database seeding completed.');
        }
    } catch (error) {
        console.error('Error seeding database:', error);
    }
};


module.exports = connectDB;