import express from 'express';
import mongoose from 'mongoose';
import loanRoutes from './routes/loans';

const app = express();
const PORT = process.env.PORT || 3081;

app.use(express.json());
app.use('/api/loans', loanRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'rez-merchant-loans-service' });
});

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rez_merchant_loans';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Merchant Loans Service connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Merchant Loans Service running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
