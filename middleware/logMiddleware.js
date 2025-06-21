const db = require('../models/db');

const logMiddleware = async (req, res, next) => {
    const start = Date.now();

    // Capture original res.send to wrap response status capture
    const originalSend = res.send;

    // We'll override res.send to hook in after response is sent
    res.send = async function (body) {
        const duration = Date.now() - start;
        const user = req.user || {};
        const userId = user.id || null;
        const role = user.role || 'guest';
        const method = req.method;
        const endpoint = req.originalUrl;
        const statusCode = res.statusCode;
        const requestBody = req.body;

        try {
            await db.query(
                `INSERT INTO Logs (user_id, role, method, endpoint, body, status_code, duration_ms)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [userId, role, method, endpoint, requestBody, statusCode, duration]
            );
        } catch (err) {
            console.error('Logging failed:', err.message);
        }

        return originalSend.call(this, body); // continue sending the actual response
    };

    next(); // move to next middleware or route
};

module.exports = logMiddleware;
