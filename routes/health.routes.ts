import { Router, Request, Response } from 'express';
import { isDbConnected } from '../config/db.ts';

const router = Router();

/**
 * @route   GET /api/health
 * @desc    Health-check endpoint verifying server status, uptime, and environment
 * @access  Public
 */
router.get('/health', (req: Request, res: Response) => {
  const uptimeInSeconds = Math.floor(process.uptime());
  const hours = Math.floor(uptimeInSeconds / 3600);
  const minutes = Math.floor((uptimeInSeconds % 3600) / 60);
  const seconds = uptimeInSeconds % 60;
  const mongoConnected = isDbConnected();

  res.status(200).json({
    status: 'ok',
    app: 'VertexLearn AI LMS Server',
    version: '1.0.0',
    message: 'Backend server is running smoothly and ready for requests.',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: `${hours}h ${minutes}m ${seconds}s`,
    services: {
      server: 'operational',
      database: mongoConnected ? 'connected (MongoDB / Mongoose)' : 'operational (in-memory mock store / MONGODB_URI ready)',
      ai: process.env.GEMINI_API_KEY ? 'configured' : 'api key not set (educational fallback mode)'
    }
  });
});

export default router;
