const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json()); // Parse JSON request bodies


// Basic Root Route
app.get('/', (req, res) => {
    res.send('Military Asset Management API is running');
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/purchases', require('./routes/purchaseRoutes'));
app.use('/api/assignments', require('./routes/assignmentRoutes'));
app.use('/api/transfers', require('./routes/transferRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/logs', require('./routes/logRoutes'));

// Handle 404
app.use((req, res) => {
    res.status(404).json({ msg: 'Route not found' });
});

app.listen(PORT, () => {
    console.log(`✅ Server is running on port ${PORT}`);
});
