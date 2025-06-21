const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// ✅ CORS setup (optional: specify allowed frontend domains)
app.use(cors({
    origin: ['http://localhost:3000', 'https://dapper-druid-c15f72.netlify.app/'],
    credentials: true,
}));

app.use(express.json());

// ✅ Routes
const authRoutes = require('./routes/authRoutes');
const purchasesRoutes = require('./routes/purchases');

app.use('/api/auth', authRoutes);
app.use('/api/purchases', purchasesRoutes);

// ✅ Root route (cleaned)
app.get('/', (req, res) => {
    res.send('✅ Military Asset Management Backend Running');
});

// ✅ Start server using Render-compatible port
app.listen(port, () => {
    console.log(`✅ Server running on port ${port}`);
});
