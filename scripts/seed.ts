import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from '../config/db.ts';
import { seedDatabase } from '../services/seedService.ts';

async function runSeed() {
  console.log('====================================================');
  console.log('🌱 Starting VertexLearn AI Database Seeding Pipeline');
  console.log('====================================================');

  await connectDB();
  const result = await seedDatabase();

  console.log('====================================================');
  console.log(`✨ Seeding Complete! Mode: [${result.mode.toUpperCase()}]`);
  console.log(`📚 Courses Seeded: ${result.coursesSeeded}`);
  console.log(`❓ Quizzes Seeded: ${result.quizzesSeeded}`);
  console.log(`👤 Users Seeded: ${result.usersSeeded}`);
  console.log(`📈 Progress Records: ${result.progressSeeded}`);
  console.log(`💬 Message: ${result.message}`);
  console.log('====================================================');

  process.exit(0);
}

runSeed().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
