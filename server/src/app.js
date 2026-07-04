const path = require('path');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const env = require('./config/env');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();

app.use(cors({ origin: env.clientOrigin, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/notifications', require('./routes/notification.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/profiles', require('./routes/profile.routes'));

// Locally stored uploads (disk storage driver)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.use('/api', notFound);
app.use(errorHandler);

module.exports = app;
