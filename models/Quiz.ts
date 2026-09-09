import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IQuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface IQuiz extends Document {
  courseId: string;
  courseTitle: string;
  questions: IQuizQuestion[];
  createdAt: Date;
}

const QuizQuestionSchema = new Schema<IQuizQuestion>({
  id: { type: String, required: true },
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctIndex: { type: Number, required: true },
  explanation: { type: String, required: true }
}, { _id: false });

const QuizSchema = new Schema<IQuiz>({
  courseId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  courseTitle: {
    type: String,
    required: true
  },
  questions: [QuizQuestionSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export const Quiz: Model<IQuiz> = mongoose.models.Quiz || mongoose.model<IQuiz>('Quiz', QuizSchema);
export default Quiz;
