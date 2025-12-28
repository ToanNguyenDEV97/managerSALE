const jwt = require('jsonwebtoken');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'secret_key', { expiresIn: '12h' });
};

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

module.exports = { generateToken, generateOTP };