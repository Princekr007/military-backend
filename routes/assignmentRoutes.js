const express = require('express');
const router = express.Router();
const db = require('../models/db');

const {
    verifyToken,
    authorizeRoles,
    authorizeBaseAccess
} = require('../middleware/authMiddleware');

const logMiddleware = require('../middleware/logMiddleware');

// 🔧 Test Route
router.get('/test', (req, res) => {
    console.log('🔥 Test route was hit');
    res.send('Assignment routes are working');
});

// ✅ POST /api/assignments → Create assignment
router.post(
    '/',
    verifyToken,
    authorizeRoles('admin', 'base_commander'),
    authorizeBaseAccess,
    logMiddleware,
    async (req, res) => {
        const { personnel_name, equipment_type, quantity, base_id } = req.body;
        try {
            await db.query(
                'INSERT INTO Assignments (personnel_name, equipment_type, quantity, base_id) VALUES ($1, $2, $3, $4)',
                [personnel_name, equipment_type, quantity, base_id]
            );
            res.json({ msg: 'Assignment recorded successfully' });
        } catch (err) {
            res.status(500).json({ msg: 'Error recording assignment', error: err.message });
        }
    }
);

// ✅ GET /api/assignments → View assignments
router.get(
    '/',
    verifyToken,
    authorizeRoles('admin', 'base_commander', 'logistics_officer'),
    authorizeBaseAccess,
    logMiddleware,
    async (req, res) => {
        const { role, baseId } = req.user;
        try {
            let result;
            if (role === 'admin') {
                result = await db.query('SELECT * FROM Assignments ORDER BY id DESC');
            } else {
                result = await db.query(
                    'SELECT * FROM Assignments WHERE base_id = $1 ORDER BY id DESC',
                    [baseId]
                );
            }
            res.json(result.rows);
        } catch (err) {
            res.status(500).json({ msg: 'Error fetching assignments', error: err.message });
        }
    }
);

// ✅ PUT /api/assignments/:id/mark-expended → Mark assignment as expended
router.put(
    '/:id/mark-expended',
    verifyToken,
    authorizeRoles('admin', 'base_commander'),
    logMiddleware,
    async (req, res) => {
        const assignmentId = req.params.id;
        try {
            await db.query(
                `UPDATE Assignments SET expended_quantity = quantity WHERE id = $1`,
                [assignmentId]
            );
            res.json({ msg: 'Assignment marked as expended' });
        } catch (err) {
            res.status(500).json({ msg: 'Failed to mark as expended', error: err.message });
        }
    }
);

module.exports = router;
