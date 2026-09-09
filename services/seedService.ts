import { isDbConnected } from '../config/db.ts';
import { Course, Quiz, User, Progress, QuizResult } from '../models/index.ts';
import { seedCourses, seedQuizzes, seedUsers, seedProgress, seedQuizResults } from '../data/seedData.ts';
import { usersDb } from '../routes/auth.routes.ts';
import { initialCourses } from '../routes/courses.routes.ts';
import { courseQuizzes, quizResultsDb } from '../routes/quiz.routes.ts';
import { progressDb } from '../routes/progress.routes.ts';
import bcrypt from 'bcryptjs';

export interface SeedResult {
  success: boolean;
  mode: 'mongodb' | 'in-memory';
  coursesSeeded: number;
  quizzesSeeded: number;
  usersSeeded: number;
  progressSeeded: number;
  quizResultsSeeded: number;
  message: string;
  timestamp: string;
}

export async function seedDatabase(): Promise<SeedResult> {
  const isMongo = isDbConnected();

  if (isMongo) {
    try {
      console.log('🌱 [Seeder] Seeding MongoDB collections...');

      // 1. Seed Courses (upsert)
      let coursesCount = 0;
      for (const courseData of seedCourses) {
        await Course.findOneAndUpdate(
          { id: courseData.id },
          { $set: courseData },
          { upsert: true, new: true }
        );
        coursesCount++;
      }

      // 2. Seed Quizzes (upsert)
      let quizzesCount = 0;
      for (const quizData of seedQuizzes) {
        await Quiz.findOneAndUpdate(
          { courseId: quizData.courseId },
          { $set: quizData },
          { upsert: true, new: true }
        );
        quizzesCount++;
      }

      // 3. Seed Demo Users
      let usersCount = 0;
      for (const userData of seedUsers) {
        const existing = await User.findOne({ email: userData.email });
        if (!existing) {
          await User.create(userData);
          usersCount++;
        }
      }

      // 4. Seed Initial Progress & Quiz Results for Demo User
      const demoUser = await User.findOne({ email: 'student@example.com' });
      const demoUserId = demoUser ? demoUser._id.toString() : 'demo-student-1';

      let progressCount = 0;
      for (const p of seedProgress) {
        await Progress.findOneAndUpdate(
          { userId: demoUserId, courseId: p.courseId },
          {
            $set: {
              userId: demoUserId,
              courseId: p.courseId,
              completedLessons: p.completedLessons,
              percentage: p.percentage,
              lastUpdated: new Date()
            }
          },
          { upsert: true, new: true }
        );
        progressCount++;
      }

      let quizResultsCount = 0;
      for (const q of seedQuizResults) {
        const existingResult = await QuizResult.findOne({ userId: demoUserId, courseId: q.courseId });
        if (!existingResult) {
          await QuizResult.create({
            userId: demoUserId,
            courseId: q.courseId,
            courseTitle: q.courseTitle,
            score: q.score,
            totalQuestions: q.totalQuestions,
            percentage: q.percentage,
            completedAt: new Date()
          });
          quizResultsCount++;
        }
      }

      console.log(`✅ [Seeder] MongoDB seeded successfully: ${coursesCount} courses, ${quizzesCount} quizzes, ${usersCount} users.`);

      return {
        success: true,
        mode: 'mongodb',
        coursesSeeded: coursesCount,
        quizzesSeeded: quizzesCount,
        usersSeeded: usersCount,
        progressSeeded: progressCount,
        quizResultsSeeded: quizResultsCount,
        message: 'MongoDB collections successfully initialized and seeded with curriculum.',
        timestamp: new Date().toISOString()
      };
    } catch (err: any) {
      console.error('❌ [Seeder] MongoDB seed error:', err);
      throw err;
    }
  } else {
    // In-memory mode seeding / synchronization
    console.log('🌱 [Seeder] Synchronizing in-memory curriculum & demo records...');

    // Courses sync
    seedCourses.forEach(c => {
      const idx = initialCourses.findIndex(x => x.id === c.id);
      if (idx >= 0) {
        initialCourses[idx] = c;
      } else {
        initialCourses.push(c);
      }
    });

    // Quizzes sync
    seedQuizzes.forEach(q => {
      courseQuizzes[q.courseId] = q;
    });

    // User sync
    seedUsers.forEach(u => {
      const existing = usersDb.find(x => x.email === u.email);
      if (!existing) {
        usersDb.push({
          id: 'demo-student-1',
          name: u.name,
          email: u.email,
          passwordHash: bcrypt.hashSync(u.password, 10),
          role: (u.role as 'student' | 'instructor' | 'admin') || 'student',
          isActive: true,
          createdAt: new Date().toISOString()
        });
      }
    });

    // Progress sync
    seedProgress.forEach(p => {
      const existing = progressDb.find(x => x.userId === p.userId && x.courseId === p.courseId);
      if (existing) {
        existing.completedLessons = p.completedLessons;
        existing.percentage = p.percentage;
      } else {
        progressDb.push({
          ...p,
          lastUpdated: new Date().toISOString()
        });
      }
    });

    return {
      success: true,
      mode: 'in-memory',
      coursesSeeded: seedCourses.length,
      quizzesSeeded: seedQuizzes.length,
      usersSeeded: seedUsers.length,
      progressSeeded: seedProgress.length,
      quizResultsSeeded: quizResultsDb.length,
      message: 'In-memory stores successfully populated and verified with curriculum & assessments.',
      timestamp: new Date().toISOString()
    };
  }
}
