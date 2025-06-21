const express = require('express');
const router = express.Router();
const db = require('../models/db');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

router.get(
    '/',
    verifyToken,
    authorizeRoles('admin'),
    async (req, res) => {
        const { userId, role, method, endpoint, startDate, endDate, page = 1, limit = 10 } = req.query;

        const offset = (parseInt(page) - 1) * parseInt(limit);
        const params = [];
        let whereClause = 'WHERE 1=1';

        if (userId) {
            params.push(userId);
            whereClause += ` AND user_id = $${params.length}`;
        }

        if (role) {
            params.push(role);
            whereClause += ` AND role = $${params.length}`;
        }

        if (method) {
            params.push(method.toUpperCase());
            whereClause += ` AND method = $${params.length}`;
        }

        if (endpoint) {
            params.push(`%${endpoint}%`);
            whereClause += ` AND endpoint ILIKE $${params.length}`;
        }

        if (startDate) {
            params.push(startDate);
            whereClause += ` AND timestamp >= $${params.length}`;
        }

        if (endDate) {
            params.push(endDate);
            whereClause += ` AND timestamp <= $${params.length}`;
        }

        // Count total for pagination
        const countResult = await db.query(`SELECT COUNT(*) FROM Logs ${whereClause}`, params);
        const total = parseInt(countResult.rows[0].count);

        // Fetch paginated results
        params.push(limit, offset);
        const result = await db.query(
            `SELECT * FROM Logs ${whereClause} ORDER BY timestamp DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
            params
        );

        res.json({
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / limit),
            data: result.rows
        });
    }
);


module.exports = router;
