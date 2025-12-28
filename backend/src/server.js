require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const connectDB = require('./config/database');
const { startOrderStatusSyncJob } = require('./jobs/orderStatusSync');
const { startTopzaBalanceCheckJob } = require('./jobs/topzaBalanceCheck');

const app = express();

connectDB();

if (process.env.ORDER_SYNC_ENABLED !== 'false') {
  try {
    startOrderStatusSyncJob();
  } catch (error) {
    console.error('Failed to initialize order sync job:', error.message);
  }
}

if (process.env.TOPZA_BALANCE_CHECK_ENABLED !== 'false') {
  try {
    startTopzaBalanceCheckJob();
  } catch (error) {
    console.error('Failed to initialize topza balance check job:', error.message);
  }
}

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
  : [];

app.use(cors({ 
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  if (req.path.endsWith('.jsx') || req.path.endsWith('.js')) {
    res.type('application/javascript');
  }
  next();
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/user', require('./routes/user'));
app.use('/api/wallet', require('./routes/wallet'));
app.use('/api/purchases', require('./routes/purchases'));
app.use('/api/dataplans', require('./routes/dataplans'));
app.use('/api/public', require('./routes/public'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/admin/notifications', require('./routes/notifications'));

app.get('/health', (req, res) => {
  res.json({ success: true, message: 'Server is running' });
});

app.use(express.static(path.join(__dirname, '../../frontend/dist')));

app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
});

app.use((err, req, res, _next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    success: false, 
    message: 'Internal server error' 
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✓ Server running on port ${PORT}`);
});
