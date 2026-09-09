import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProgress extends Document {
  userId: string;
  courseId: string;
  completedLessons: string[];
  percentage: number;
  lastUpdated: Date;
}

const ProgressSchema = new Schema<IProgress>({
  userId: {
    type: String,
    required: true,
    index: true
  },
  courseId: {
    type: String,
    required: true,
    index: true
  },
  completedLessons: [{
    type: String
  }],
  percentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

// Composite unique index so one student has one progress record per course
ProgressSchema.index({ userId: 1, courseId: 1 }, { unique: true });

export const Progress: Model<IProgress> = mongoose.models.Progress || mongoose.model<IProgress>('Progress', ProgressSchema);
export default Progress;
