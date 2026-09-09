import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ILesson {
  id: string;
  title: string;
  duration: string;
  content: string;
}

export interface IAnnouncement {
  id: string;
  title: string;
  content: string;
  date: string;
}

export interface ICourse extends Document {
  id: string;
  title: string;
  category: string;
  categoryLabel: string;
  level: string;
  duration: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  instructorId?: string;
  instructorName?: string;
  price?: number;
  announcements?: IAnnouncement[];
  lessons: ILesson[];
  createdAt: Date;
}

const AnnouncementSchema = new Schema<IAnnouncement>({
  id: { type: String, required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  date: { type: String, default: () => new Date().toISOString() }
}, { _id: false });

const LessonSchema = new Schema<ILesson>({
  id: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  duration: {
    type: String,
    default: '20 min'
  },
  content: {
    type: String,
    required: true
  }
}, { _id: false });

const CourseSchema = new Schema<ICourse>({
  id: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  title: {
    type: String,
    required: [true, 'Course title is required'],
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  categoryLabel: {
    type: String,
    required: true
  },
  level: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Beginner'
  },
  duration: {
    type: String,
    default: '4 hours'
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved'
  },
  instructorId: {
    type: String,
    default: 'demo-instructor-1'
  },
  instructorName: {
    type: String,
    default: 'Rohit Mehta'
  },
  announcements: [AnnouncementSchema],
  lessons: [LessonSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export const Course: Model<ICourse> = mongoose.models.Course || mongoose.model<ICourse>('Course', CourseSchema);
export default Course;
