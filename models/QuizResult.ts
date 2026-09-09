import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IQuizResult extends Document {
  userId: string;
  courseId: string;
  courseTitle: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  passed: boolean;
  timeSpentSeconds?: number;
  completedAt: Date;
}

const QuizResultSchema = new Schema<IQuizResult>({
  userId: {
    type: String,
    required: true,
    index: true
  },
  courseId: {
    type: String,
    required: true
  },
  courseTitle: {
    type: String,
    required: true
  },
  score: {
    type: Number,
    required: true
  },
  totalQuestions: {
    type: Number,
    required: true
  },
  percentage: {
    type: Number,
    required: true
  },
  passed: {
    type: Boolean,
    default: false
  },
  timeSpentSeconds: {
    type: Number,
    default: 0
  },
  completedAt: {
    type: Date,
    default: Date.now
  }
});

export const QuizResult: Model<IQuizResult> = mongoose.models.QuizResult || mongoose.model<IQuizResult>('QuizResult', QuizResultSchema);
export default QuizResult;
