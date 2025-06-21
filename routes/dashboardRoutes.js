const express = require('express');
const router = express.Router();
const db = require('../models/db');

const {
    verifyToken,
    authorizeRoles,
    authorizeBaseAccess
} = require('../middleware/authMiddleware');

const logMiddleware = require('../middleware/logMiddleware');

// ✅ GET /api/dashboard → View dashboard metrics
router.get(
    '/',
    verifyToken,
    authorizeRoles('admin', 'base_commander', 'logistics_officer'),
    authorizeBaseAccess,
    logMiddleware,
    async (req, res) => {
        const { role, baseId: userBaseId } = req.user;
        const { startDate, endDate, equipmentType, baseId } = req.query;

        const effectiveBaseId = role === 'admin' && baseId ? baseId : userBaseId;

        try {
            const params = [effectiveBaseId];
            let dateClause = '';
            let typeClause = '';

            if (startDate && endDate) {
                params.push(startDate, endDate);
                dateClause = `AND purchase_date BETWEEN $${params.length - 1} AND $${params.length}`;
            }

            if (equipmentType) {
                params.push(equipmentType);
                typeClause = `AND equipment_type = $${params.length}`;
            }

            const [purchases, transfersIn, transfersOut, assignments] = await Promise.all([
                db.query(`SELECT COALESCE(SUM(quantity),0) AS count FROM Purchases WHERE base_id = $1 ${dateClause} ${typeClause}`, params),
                db.query(`SELECT COALESCE(SUM(quantity),0) AS count FROM Transfers WHERE to_base_id = $1 ${dateClause} ${typeClause}`, params),
                db.query(`SELECT COALESCE(SUM(quantity),0) AS count FROM Transfers WHERE from_base_id = $1 ${dateClause} ${typeClause}`, params),
                db.query(`SELECT COALESCE(SUM(quantity),0) AS count FROM Assignments WHERE base_id = $1 ${dateClause} ${typeClause}`, params),
            ]);

            const purchasesCount = parseInt(purchases.rows[0].count);
            const transfersInCount = parseInt(transfersIn.rows[0].count);
            const transfersOutCount = parseInt(transfersOut.rows[0].count);
            const assignmentsCount = parseInt(assignments.rows[0].count);

            const closingBalance = purchasesCount + transfersInCount - transfersOutCount - assignmentsCount;

            res.json({
                purchases: purchasesCount,
                transfersIn: transfersInCount,
                transfersOut: transfersOutCount,
                assignments: assignmentsCount,
                closingBalance
            });
        } catch (err) {
            res.status(500).json({ msg: 'Dashboard data fetch failed', error: err.message });
        }
    }
);

module.exports = router;
