const express = require('express');
const dotenv = require('dotenv');
dotenv.config();
const cors = require('cors');

const connectDB = require('./config/mongo');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes')
const recommendationRoutes = require('./routes/recommendationRoutes');
const searchRoutes = require('./routes/searchRoutes');

const app = express();

const corsOptions = {
  origin: "http://localhost:3000",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization", "x-auth-token"]
};

app.use(cors(corsOptions));

connectDB();

app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/search', searchRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
