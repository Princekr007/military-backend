const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

const purchasesRoutes = require('./routes/purchases');
app.use('/api/purchases', purchasesRoutes);


// Test route
app.get('/', (req, res) => {
    res.send('Military Asset Management Backend Running');
});

// Start server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
