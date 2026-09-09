import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { Course } from '../models/Course.ts';
import { Progress } from '../models/Progress.ts';
import { isDbConnected } from '../config/db.ts';
import { seedCourses } from '../data/seedData.ts';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'vertexlearn-dev-secret-key-2026';

interface CourseProgress {
  userId: string;
  courseId: string;
  completedLessons: string[];
  percentage: number;
  lastUpdated: string;
}

export const progressDb: CourseProgress[] = [
  {
    userId: 'demo-student-1',
    courseId: 'html-css-basics',
    completedLessons: ['html-structure', 'css-box-model'],
    percentage: 67,
    lastUpdated: new Date().toISOString()
  },
  {
    userId: 'demo-student-1',
    courseId: 'javascript-fundamentals',
    completedLessons: ['js-variables-datatypes'],
    percentage: 33,
    lastUpdated: new Date().toISOString()
  }
];

function getUserId(req: Request): string {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      if (decoded && decoded.id) return decoded.id;
    } catch (e) {
      // Invalid/expired token
    }
  }
  return 'demo-student-1';
}

/**
 * Helper to calculate total lessons for a given course
 */
async function getCourseTotalLessons(courseId: string): Promise<number> {
  if (isDbConnected()) {
    try {
      const cDoc = await Course.findOne({ id: courseId }).lean();
      if (cDoc && Array.isArray(cDoc.lessons)) return cDoc.lessons.length;
    } catch (e) {
      // fallback
    }
  }

  const course = seedCourses.find(c => c.id === courseId);
  return course && Array.isArray(course.lessons) ? course.lessons.length : 3;
}

/**
 * @route   GET /api/progress
 * @desc    Retrieve overall course progress for the active student
 * @access  Public (Authenticated or Demo)
 */
router.get('/progress', async (req: Request, res: Response) => {
  const userId = getUserId(req);

  if (isDbConnected()) {
    try {
      const dbProgress = await Progress.find({ userId }).lean();
      if (dbProgress && dbProgress.length > 0) {
        return res.status(200).json(dbProgress);
      }
    } catch (err) {
      console.warn('MongoDB progress lookup error, falling back to memory:', err);
    }
  }

  const userProgress = progressDb.filter(p => p.userId === userId || (userId === 'demo-student-1' && p.userId === 'demo-student-1'));
  return res.status(200).json(userProgress);
});

/**
 * @route   GET /api/progress/:courseId
 * @desc    Retrieve progress for a specific course
 * @access  Public (Authenticated or Demo)
 */
router.get('/progress/:courseId', async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { courseId } = req.params;
  const totalLessons = await getCourseTotalLessons(courseId);

  if (isDbConnected()) {
    try {
      const progDoc = await Progress.findOne({ userId, courseId }).lean();
      if (progDoc) {
        return res.status(200).json(progDoc);
      }
    } catch (err) {
      console.warn('MongoDB single progress lookup error:', err);
    }
  }

  let prog = progressDb.find(p => p.userId === userId && p.courseId === courseId);
  if (!prog) {
    prog = {
      userId,
      courseId,
      completedLessons: [],
      percentage: 0,
      lastUpdated: new Date().toISOString()
    };
    progressDb.push(prog);
  }

  return res.status(200).json(prog);
});

/**
 * Handler for marking a lesson as completed
 */
const completeLessonHandler = async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const courseId = req.params.id || req.params.courseId;
  const { lessonId } = req.body;

  if (!lessonId) {
    return res.status(400).json({ success: false, message: 'lessonId is required in request body.' });
  }

  const totalLessons = await getCourseTotalLessons(courseId);
  let updatedRecord: any = null;

  if (isDbConnected()) {
    try {
      let doc = await Progress.findOne({ userId, courseId });
      if (!doc) {
        doc = new Progress({
          userId,
          courseId,
          completedLessons: [],
          percentage: 0
        });
      }

      if (!doc.completedLessons.includes(lessonId)) {
        doc.completedLessons.push(lessonId);
      }
      doc.percentage = Math.min(100, Math.round((doc.completedLessons.length / totalLessons) * 100));
      doc.lastUpdated = new Date();
      await doc.save();
      updatedRecord = doc.toObject();
    } catch (err) {
      console.error('Failed to update progress in MongoDB:', err);
    }
  }

  // Update in-memory record
  let prog = progressDb.find(p => p.userId === userId && p.courseId === courseId);
  if (!prog) {
    prog = {
      userId,
      courseId,
      completedLessons: [],
      percentage: 0,
      lastUpdated: new Date().toISOString()
    };
    progressDb.push(prog);
  }

  if (!prog.completedLessons.includes(lessonId)) {
    prog.completedLessons.push(lessonId);
  }
  prog.percentage = Math.min(100, Math.round((prog.completedLessons.length / totalLessons) * 100));
  prog.lastUpdated = new Date().toISOString();

  const finalProgress = updatedRecord || prog;

  return res.status(200).json({
    success: true,
    message: 'Lesson marked as completed successfully!',
    courseId,
    lessonId,
    percentage: finalProgress.percentage,
    completedCount: finalProgress.completedLessons.length,
    totalLessons,
    isCompleted: finalProgress.percentage >= 100,
    progress: finalProgress
  });
};

router.post('/courses/:id/complete-lesson', completeLessonHandler);
router.post('/progress/:courseId/complete-lesson', completeLessonHandler);

export default router;
