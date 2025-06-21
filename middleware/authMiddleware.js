const jwt = require('jsonwebtoken');
require('dotenv').config();

// ✅ Middleware to verify JWT token
const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ msg: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // { id, role, baseId }
        next();
    } catch (error) {
        res.status(401).json({ msg: 'Invalid token' });
    }
};

// ✅ Middleware to authorize specific roles
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ msg: 'Access denied' });
        }
        next();
    };
};

// ✅ Middleware to enforce base-level access control
const authorizeBaseAccess = (req, res, next) => {
    const { role, baseId: userBaseId } = req.user;

    // Try to extract baseId from request (body, query, or URL params)
    const requestedBaseId =
        req.body?.base_id ||
        req.query?.baseId ||
        req.params?.baseId ||
        null;

    // Default to user's base if none provided
    const targetBase = requestedBaseId || userBaseId;

    // Admins have access to everything
    if (role === 'admin') return next();

    // Base Commanders can only access their own base
    if (role === 'base_commander' && String(userBaseId) === String(targetBase)) return next();

    // Logistics Officers have read-only (GET) access
    if (role === 'logistics_officer' && req.method === 'GET') return next();

    // All others denied
    return res.status(403).json({ msg: 'Unauthorized base access' });
};

// ✅ Export all middlewares
module.exports = {
    verifyToken,
    authorizeRoles,
    authorizeBaseAccess
};
