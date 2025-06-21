const express = require('express');
const router = express.Router();
const db = require('../models/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config(); // Ensure environment variables work

// ✅ Import middlewares
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

// ✅ Register route
router.post('/register', async (req, res) => {
    const { name, email, password, role, baseId } = req.body;

    try {
        const hash = await bcrypt.hash(password, 10);

        await db.query(
            `INSERT INTO Users (name, email, password, role, base_id) VALUES ($1, $2, $3, $4, $5)`,
            [name, email, hash, role, baseId]
        );

        res.json({ msg: "User registered" });
    } catch (err) {
        res.status(500).json({ msg: "Error registering user", error: err.message });
    }
});

// ✅ Login route
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const result = await db.query(`SELECT * FROM Users WHERE email = $1`, [email]);
        const user = result.rows[0];

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ msg: "Invalid credentials" });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role, baseId: user.base_id },
            process.env.JWT_SECRET
        );

        res.json({ token });
    } catch (err) {
        res.status(500).json({ msg: "Login error", error: err.message });
    }
});

// ✅ Protected route (any authenticated user)
router.get('/protected', verifyToken, (req, res) => {
    res.json({ msg: `Hello, ${req.user.role}! This is a protected route.` });
});

// ✅ Admin-only route
router.get('/admin-only', verifyToken, authorizeRoles('admin'), (req, res) => {
    res.json({ msg: "Welcome Admin. You have full access." });
});

module.exports = router;
