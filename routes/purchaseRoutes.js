const express = require('express');
const router = express.Router();
const db = require('../models/db');

const {
    verifyToken,
    authorizeRoles,
    authorizeBaseAccess
} = require('../middleware/authMiddleware');

const logMiddleware = require('../middleware/logMiddleware');

// ✅ POST /purchases - Admin & Base Commander only
router.post(
    '/',
    verifyToken,
    authorizeRoles('admin', 'base_commander'),
    authorizeBaseAccess,
    logMiddleware,
    async (req, res) => {
        const { equipment_type, quantity, base_id } = req.body;

        try {
            await db.query(
                'INSERT INTO Purchases (equipment_type, quantity, base_id) VALUES ($1, $2, $3)',
                [equipment_type, quantity, base_id]
            );
            res.json({ msg: 'Purchase recorded successfully' });
        } catch (err) {
            res.status(500).json({ msg: 'Error saving purchase', error: err.message });
        }
    }
);

// ✅ GET /purchases - Admin, Base Commander, Logistics Officer
router.get(
    '/',
    verifyToken,
    authorizeRoles('admin', 'base_commander', 'logistics_officer'),
    authorizeBaseAccess,
    logMiddleware,
    async (req, res) => {
        const { equipmentType, startDate, endDate } = req.query;

        try {
            let query = 'SELECT * FROM Purchases WHERE 1=1';
            const params = [];

            if (equipmentType) {
                params.push(`%${equipmentType}%`);
                query += ` AND equipment_type ILIKE $${params.length}`;
            }
            if (startDate) {
                params.push(startDate);
                query += ` AND purchase_date >= $${params.length}`;
            }
            if (endDate) {
                params.push(endDate);
                query += ` AND purchase_date <= $${params.length}`;
            }

            const result = await db.query(query, params);
            res.json(result.rows);
        } catch (err) {
            res.status(500).json({ msg: 'Error fetching purchases', error: err.message });
        }
    }
);

module.exports = router;
