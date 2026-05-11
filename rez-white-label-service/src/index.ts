import express from 'express';
import mongoose from 'mongoose';
import partnerRoutes from './routes/partner';

const app = express();
const PORT = process.env.PORT || 3083;

app.use(express.json());
app.use('/api/partners', partnerRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'rez-white-label-service' });
});

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rez_whitelabel')
  .then(() => {
    app.listen(PORT, () => {
      console.log(`White-label Service running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('MongoDB error:', err);
    process.exit(1);
  });
