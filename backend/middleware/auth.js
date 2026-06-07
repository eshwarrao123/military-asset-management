const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];

            if (token.startsWith('demo-')) {
                const parts = token.split('-');
                const role = parts[1];
                let base = parts.slice(2).join('-');
                base = base ? base.trim().toLowerCase() : 'hq';

                req.user = {
                    _id: '000000000000000000000000',
                    name: `Demo ${role}`,
                    email: `demo@${role.toLowerCase()}.com`,
                    role: role === 'Commander' ? 'Commander' : (role === 'Logistics' ? 'Logistics' : 'Admin'),
                    base: base
                };
                return next();
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password');
            if (!req.user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }
            return next();
        } catch (error) {
            console.error(error);
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    } else {
        req.user = {
            _id: '000000000000000000000000',
            name: 'Demo Admin',
            email: 'demo@admin.com',
            role: 'Admin',
            base: 'hq'
        };
        return next();
    }
};

const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: `Role: ${req.user.role} is not allowed to access this resource` });
        }
        next();
    };
};

module.exports = { protect, authorizeRoles };
