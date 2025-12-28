const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
            req.user = await User.findById(decoded.id).select('-password');
            if (!req.user) return res.status(401).json({ message: 'User not found' });
            req.organizationId = req.user.organizationId.toString(); 
            next();
        } catch (error) { res.status(401).json({ message: 'Token failed' }); }
    } else { res.status(401).json({ message: 'No token' }); }
};

module.exports = { protect };