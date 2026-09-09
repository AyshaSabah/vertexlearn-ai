/**
 * VertexLearn AI - Express Backend Server (Vanilla Node.js / Express)
 * Suitable for direct execution via: node server.js
 */
import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

// 1. CORS Middleware
app.use(cors({
  origin: true,
  credentials: true
}));

// 2. Request Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. Request Logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    console.log(`[Express] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - start}ms)`);
  });
  next();
});

// 4. Static Files Middleware
const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));

// 5. Health Check Route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    app: 'VertexLearn AI LMS Server',
    version: '1.0.0',
    message: 'Backend server is running smoothly and ready for requests.',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: `${Math.floor(process.uptime())} seconds`
  });
});

// API Info Route
app.get('/api', (req, res) => {
  res.status(200).json({
    name: 'VertexLearn AI LMS REST API',
    version: '1.0.0',
    endpoints: {
      health: 'GET /api/health',
      courses: 'GET /api/courses',
      quiz: 'GET /api/quiz/:courseId',
      progress: 'GET /api/progress'
    }
  });
});

// Start listening
app.listen(PORT, HOST, () => {
  console.log(`🚀 VertexLearn AI Server is running on http://${HOST}:${PORT}`);
  console.log(`📡 Health Check URL: http://localhost:${PORT}/api/health`);
});
