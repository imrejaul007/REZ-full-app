import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { copilotRoutes } from './services/copilot';

const app = express();
const PORT = process.env.PORT || 4026;

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use('/api/copilot', copilotRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'rez-copilot' });
});

app.listen(PORT, () => {
  console.log(`Copilot service running on port ${PORT}`);
});
