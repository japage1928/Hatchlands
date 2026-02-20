import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import * as dotenv from 'dotenv';
import worldRoutes from './routes/world';
import encounterRoutes from './routes/encounter';
import breedingRoutes from './routes/breeding';
import marketRoutes from './routes/market';
import { checkConnection } from './db/connection';
import { worldSimulation } from './engines/world';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests from this IP',
});
app.use('/api/', limiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// API Routes
app.use('/api', worldRoutes);
app.use('/api', encounterRoutes);
app.use('/api', breedingRoutes);
app.use('/api', marketRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
async function start() {
  try {
    // Check database connection
    const dbConnected = await checkConnection();
    if (!dbConnected) {
      throw new Error('Database connection failed');
    }
    console.log('✓ Database connected');

    // Start world simulation
    const simulationInterval = parseInt(process.env.SPAWN_GENERATION_INTERVAL_MS || '60000');
    worldSimulation.start(simulationInterval);
    console.log('✓ World simulation started');

    // Start HTTP server
    app.listen(PORT, () => {
      console.log(`✓ Server running on port ${PORT}`);
      console.log(`  http://localhost:${PORT}`);
      console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  worldSimulation.stop();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  worldSimulation.stop();
  process.exit(0);
});

start();
