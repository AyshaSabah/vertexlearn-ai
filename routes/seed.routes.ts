import { Router, Request, Response } from 'express';
import { seedDatabase } from '../services/seedService.ts';
import { isDbConnected } from '../config/db.ts';

const router = Router();

/**
 * @route   GET /api/seed
 * @desc    Inspect database status and seeding readiness
 * @access  Public
 */
router.get('/seed', (req: Request, res: Response) => {
  res.status(200).json({
    message: 'Database Seeding Service',
    databaseConnected: isDbConnected(),
    driver: 'Mongoose / MongoDB',
    instruction: 'Send a POST request to /api/seed to populate the curriculum courses, quizzes, and demo student.'
  });
});

/**
 * @route   POST /api/seed
 * @desc    Execute database seeding (idempotent upsert of courses, quizzes, demo user)
 * @access  Public
 */
router.post('/seed', async (req: Request, res: Response) => {
  try {
    const result = await seedDatabase();
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Seed API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to seed database: ' + (error.message || error)
    });
  }
});

export default router;
