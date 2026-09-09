import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { Quiz } from '../models/Quiz.ts';
import { QuizResult } from '../models/QuizResult.ts';
import { isDbConnected } from '../config/db.ts';
import { seedQuizzes } from '../data/seedData.ts';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'vertexlearn-dev-secret-key-2026';

// Synchronize in-memory course quizzes dictionary from seedQuizzes
export const courseQuizzes: Record<string, any> = {};
seedQuizzes.forEach(q => {
  courseQuizzes[q.courseId] = q;
});

// In-memory quiz submissions store for instant session sync
export interface QuizResultRecord {
  id: string;
  userId: string;
  courseId: string;
  courseTitle: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  passed: boolean;
  timeSpentSeconds?: number;
  completedAt: string;
}

export const quizResultsDb: QuizResultRecord[] = [
  {
    id: 'quiz-init-1',
    userId: 'demo-student-1',
    courseId: 'html-css-basics',
    courseTitle: 'HTML & CSS Responsive Web Design',
    score: 4,
    totalQuestions: 4,
    percentage: 100,
    passed: true,
    timeSpentSeconds: 65,
    completedAt: new Date(Date.now() - 86400000).toISOString()
  }
];

/**
 * GET /api/quiz/courses
 * List all available quizzes with question counts
 */
router.get('/quiz/courses', (req: Request, res: Response) => {
  const list = Object.values(courseQuizzes).map(q => ({
    courseId: q.courseId,
    courseTitle: q.courseTitle,
    questionCount: (q.questions || []).length
  }));
  res.json(list);
});

/**
 * GET /api/quiz/results
 * Retrieve student quiz history
 */
router.get('/quiz/results', async (req: Request, res: Response) => {
  let userId = 'demo-student-1';
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET) as any;
      if (decoded && decoded.id) userId = decoded.id;
    } catch (e) {
      // Use fallback
    }
  }

  if (isDbConnected()) {
    try {
      const dbResults = await QuizResult.find({
        $or: [{ userId }, { userId: 'demo-student-1' }]
      }).sort({ completedAt: -1 }).lean();

      if (dbResults && dbResults.length > 0) {
        return res.status(200).json(dbResults);
      }
    } catch (err) {
      console.error('Failed to fetch QuizResults from MongoDB:', err);
    }
  }

  const userResults = quizResultsDb.filter(q => q.userId === userId || q.userId === 'demo-student-1');
  return res.status(200).json(userResults);
});

/**
 * GET /api/quiz/:courseId
 * Retrieve quiz questions for a course. Correct answers are intentionally stripped
 * to prevent client-side inspection or cheating.
 */
router.get('/quiz/:courseId', async (req: Request, res: Response) => {
  const courseId = req.params.courseId;
  let quiz: any = null;

  if (isDbConnected()) {
    try {
      quiz = await Quiz.findOne({ courseId }).lean();
    } catch (e) {
      console.warn('MongoDB quiz lookup failed, falling back to memory:', e);
    }
  }

  if (!quiz) {
    quiz = courseQuizzes[courseId];
  }

  if (!quiz) {
    return res.status(404).json({
      error: 'Quiz not found',
      message: `No assessment found for course ID: "${courseId}".`
    });
  }

  // Hide correct answer index from student during active assessment
  const safeQuiz = {
    courseId: quiz.courseId,
    courseTitle: quiz.courseTitle,
    questions: quiz.questions.map((q: any, idx: number) => ({
      id: q.id || `q_${idx}`,
      question: q.question,
      options: q.options
    }))
  };

  return res.status(200).json(safeQuiz);
});

/**
 * POST /api/quiz/submit
 * Evaluate student submissions server-side against the answer key.
 * Computes score, percentage, passed status, and persists to QuizResult.
 */
router.post('/quiz/submit', async (req: Request, res: Response) => {
  const { courseId, answers, timeSpentSeconds } = req.body;

  if (!courseId) {
    return res.status(400).json({ error: 'courseId is required.' });
  }

  let quiz: any = null;

  if (isDbConnected()) {
    try {
      quiz = await Quiz.findOne({ courseId }).lean();
    } catch (e) {
      console.warn('MongoDB quiz lookup failed during submit:', e);
    }
  }

  if (!quiz) {
    quiz = courseQuizzes[courseId];
  }

  if (!quiz || !quiz.questions || quiz.questions.length === 0) {
    return res.status(404).json({ error: 'Assessment quiz questions not found for grading.' });
  }

  // Extract user ID from Authorization header if available
  let userId = 'demo-student-1';
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET) as any;
      if (decoded && decoded.id) userId = decoded.id;
    } catch (e) {
      // Ignored for guest/anonymous attempts
    }
  }

  const questions = quiz.questions;
  let score = 0;

  // Grade each question server-side
  const review = questions.map((q: any, idx: number) => {
    // Support answers indexed by question id OR integer index
    let selected: any = undefined;
    if (answers) {
      if (answers[q.id] !== undefined) {
        selected = answers[q.id];
      } else if (answers[idx] !== undefined) {
        selected = answers[idx];
      } else if (answers[String(idx)] !== undefined) {
        selected = answers[String(idx)];
      }
    }

    const correctIndex = q.correctIndex !== undefined ? q.correctIndex : q.correctAnswerIndex;
    const isCorrect = selected === correctIndex;
    if (isCorrect) score++;

    return {
      questionId: q.id || `q_${idx}`,
      question: q.question,
      options: q.options,
      selectedOption: selected !== undefined ? selected : null,
      selectedText: selected !== undefined && q.options[selected] ? q.options[selected] : 'Not answered',
      correctIndex: correctIndex,
      correctText: q.options[correctIndex] || '',
      isCorrect,
      explanation: q.explanation || 'Review the curriculum lessons for detailed breakdown.'
    };
  });

  const totalQuestions = questions.length;
  const percentage = Math.round((score / totalQuestions) * 100);
  const passed = percentage >= 70;
  const parsedTime = typeof timeSpentSeconds === 'number' ? Math.max(0, timeSpentSeconds) : 0;

  // Persist to MongoDB QuizResult collection
  if (isDbConnected()) {
    try {
      await QuizResult.create({
        userId,
        courseId,
        courseTitle: quiz.courseTitle || courseId,
        score,
        totalQuestions,
        percentage,
        passed,
        timeSpentSeconds: parsedTime,
        completedAt: new Date()
      });
    } catch (err) {
      console.error('Failed to save QuizResult to MongoDB:', err);
    }
  }

  // Also record in in-memory store
  const submissionRecord: QuizResultRecord = {
    id: 'quiz_' + Date.now(),
    userId,
    courseId,
    courseTitle: quiz.courseTitle || courseId,
    score,
    totalQuestions,
    percentage,
    passed,
    timeSpentSeconds: parsedTime,
    completedAt: new Date().toISOString()
  };

  quizResultsDb.unshift(submissionRecord);

  return res.status(200).json({
    success: true,
    courseId,
    courseTitle: quiz.courseTitle,
    score,
    totalQuestions,
    percentage,
    passed,
    timeSpentSeconds: parsedTime,
    review
  });
});

export default router;
