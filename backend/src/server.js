import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initSchema } from './db.js';
import { ensureSeeded } from './seed.js';
import authRoutes from './routes/auth.js';
import publicRoutes from './routes/public.js';
import savedRoutes from './routes/saved.js';
import vendorRoutes from './routes/vendor.js';
import adminRoutes from './routes/admin.js';

initSchema();
ensureSeeded();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*' }));
app.use(express.json({ limit: '5mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'offby-api', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api', publicRoutes);
app.use('/api/saved', savedRoutes);
app.use('/api/vendor', vendorRoutes);
app.use('/api/admin', adminRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`offby API server running on http://localhost:${PORT}`);
  });
}

export default app;
