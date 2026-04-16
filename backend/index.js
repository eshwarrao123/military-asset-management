const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');

// Load env vars
dotenv.config();

// Connect to database
const connectDB = require('./config/db');
connectDB();

// Route files
const authRoutes = require('./routes/authRoutes');
const purchaseRoutes = require('./routes/purchaseRoutes');
const transferRoutes = require('./routes/transferRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

// Middleware
const loggerMiddleware = require('./middleware/logger');

const app = express();

app.use(cors({
    origin: "*",
}));

// Body parser
app.use(bodyParser.json());
app.use(express.json());

// Apply Morgan Logger
app.use(loggerMiddleware);

// Mount routers
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/purchases', require('./routes/purchaseRoutes'));
app.use('/api/transfers', require('./routes/transferRoutes'));
app.use('/api/assignments', require('./routes/assignmentRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/inventory', require('./routes/inventoryRoutes'));

app.get('/', (req, res) => {
    res.send('Military Asset Management API running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
