const path = require('path');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const movieRoutes = require('./routes/movieRoutes');
const showRoutes = require('./routes/showRoutes');
const seatRoutes = require('./routes/seatRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const aiRoutes = require('./routes/aiRoutes');
const setupRoutes = require('./routes/setupRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use(authRoutes);
app.use(movieRoutes);
app.use(showRoutes);
app.use(seatRoutes);
app.use(bookingRoutes);
app.use(paymentRoutes);
app.use(adminRoutes);
app.use(aiRoutes);
app.use(setupRoutes);

app.use(express.static(path.join(__dirname, 'public')));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
