import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

// Load environment variables from .env file
dotenv.config();

// Import modular API route handlers
import healthRoutes from './routes/health.routes.ts';
import authRoutes from './routes/auth.routes.ts';
import coursesRoutes from './routes/courses.routes.ts';
import quizRoutes from './routes/quiz.routes.ts';
import progressRoutes from './routes/progress.routes.ts';
import aiRoutes from './routes/ai.routes.ts';
import seedRoutes from './routes/seed.routes.ts';
import { connectDB } from './config/db.ts';
import { seedDatabase } from './services/seedService.ts';

const PORT = 3000;
const HOST = '0.0.0.0';

async function startServer() {
  const app = express();
  const publicPath = path.join(process.cwd(), 'public');

  // 1. CORS Configuration (Cross-Origin Resource Sharing)
  app.use(cors({
    origin: true,
    credentials: true
  }));

  // 2. Request Body Parsers (JSON & URL-Encoded form data)
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true, limit: '5mb' }));

  // 3. Request Logging Middleware (Simple & readable for debugging & evaluation)
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`[Express] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
    });
    next();
  });

  // 4. Mount API Routes FIRST (before static or fallback)
  app.use('/api', healthRoutes);
  app.use('/api', authRoutes);
  app.use('/api', coursesRoutes);
  app.use('/api', quizRoutes);
  app.use('/api', progressRoutes);
  app.use('/api', aiRoutes);
  app.use('/api', seedRoutes);

  // API Directory / Root info
  app.get('/api', (req, res) => {
    res.status(200).json({
      name: 'VertexLearn AI LMS REST API',
      version: '1.0.0',
      description: 'Educational backend API for courses, quizzes, progress tracking, and AI tutoring.',
      endpoints: {
        health: 'GET /api/health',
        seed: 'POST /api/seed',
        courses: 'GET /api/courses',
        courseDetails: 'GET /api/courses/:id',
        authRegister: 'POST /api/auth/register',
        authLogin: 'POST /api/auth/login',
        authMe: 'GET /api/auth/me (Bearer Token)',
        authProfile: 'PUT /api/auth/profile (Bearer Token)',
        authLogout: 'POST /api/auth/logout',
        quiz: 'GET /api/quiz/:courseId',
        quizSubmit: 'POST /api/quiz/submit',
        quizResults: 'GET /api/quiz/results',
        progress: 'GET /api/progress',
        completeLesson: 'POST /api/courses/:id/complete-lesson',
        aiTutor: 'POST /api/ai/tutor',
        aiStudyTools: 'POST /api/ai/study-tools'
      }
    });
  });

  // Dedicated 404 handler for API routes
  app.all('/api/*', (req, res) => {
    res.status(404).json({
      error: 'Not Found',
      message: `API endpoint "${req.method} ${req.path}" does not exist.`,
      availableEndpoints: '/api'
    });
  });

  // 5. Serve static files from the 'public' directory with .html extension resolution
  app.use(express.static(publicPath, { extensions: ['html'] }));

  // 6. Vite middleware for development vs static dist for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      // Check if requested HTML file exists in public directory
      const potentialFile = path.join(publicPath, req.path.replace(/^\//, ''));
      if (req.path.endsWith('.html')) {
        return res.sendFile(potentialFile);
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // 7. Global Error Handling Middleware
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('[Express Server Error]:', err);
    res.status(err.status || 500).json({
      error: 'Internal Server Error',
      message: err.message || 'An unexpected error occurred on the server.'
    });
  });

  // 8. Start HTTP Server immediately so container port 3000 opens instantly
  app.listen(PORT, HOST, () => {
    console.log(`====================================================`);
    console.log(`🚀 VertexLearn AI Express Server running on http://${HOST}:${PORT}`);
    console.log(`📡 Health Check URL: http://${HOST}:${PORT}/api/health`);
    console.log(`📂 Static files served from: ${publicPath}`);
    console.log(`⚙️  Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`====================================================`);
  });

  // 9. Asynchronously connect DB & run database seed in background without blocking server boot
  connectDB().then(() => {
    seedDatabase().catch(seedErr => {
      console.warn('Initial seeding encountered an error:', seedErr);
    });
  }).catch(dbErr => {
    console.warn('Database initialization warning:', dbErr.message);
  });
}

startServer().catch(err => {
  console.error('Failed to start Express server:', err);
  process.exit(1);
});
