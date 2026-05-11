import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import returnRoutes from './routes/returns';

dotenv.config();

const app = express();

app.use(express.json());

// Routes
app.use('/api/returns', returnRoutes);

// Health
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'return-service' });
});

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rez_returns';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 4031;

app.listen(PORT, () => {
  console.log(`Return Service running on port ${PORT}`);
});

export default app;
