const express = require('express');
const router = express.Router();
const db = require('../models/db');

const {
    verifyToken,
    authorizeRoles,
    authorizeBaseAccess
} = require('../middleware/authMiddleware');

const logMiddleware = require('../middleware/logMiddleware');

console.log("transferRoutes loaded");

// ✅ POST /api/transfers → Record a transfer
router.post(
    '/',
    verifyToken,
    authorizeRoles('admin', 'base_commander'),
    authorizeBaseAccess,
    logMiddleware,
    async (req, res) => {
        console.log("POST /api/transfers hit");

        const { equipment_type, quantity, from_base_id, to_base_id } = req.body;

        try {
            await db.query(
                'INSERT INTO Transfers (equipment_type, quantity, from_base_id, to_base_id) VALUES ($1, $2, $3, $4)',
                [equipment_type, quantity, from_base_id, to_base_id]
            );
            res.json({ msg: 'Transfer recorded successfully' });
        } catch (err) {
            console.error("Error saving transfer:", err.message);
            res.status(500).json({ msg: 'Error saving transfer', error: err.message });
        }
    }
);

// ✅ GET /api/transfers/history → Fetch transfer history
router.get(
    '/history',
    verifyToken,
    authorizeRoles('admin', 'base_commander', 'logistics_officer'),
    authorizeBaseAccess,
    logMiddleware,
    async (req, res) => {
        console.log("GET /api/transfers/history hit");

        const baseId = req.user.baseId;

        try {
            const result = await db.query(
                `SELECT * FROM Transfers WHERE from_base_id = $1 OR to_base_id = $1 ORDER BY id DESC`,
                [baseId]
            );
            res.json(result.rows);
        } catch (err) {
            console.error("Error fetching transfer history:", err.message);
            res.status(500).json({ msg: 'Error fetching transfer history', error: err.message });
        }
    }
);

module.exports = router;
