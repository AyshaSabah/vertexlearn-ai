import { Router, Request, Response } from 'express';
import { Course } from '../models/Course.ts';
import { isDbConnected } from '../config/db.ts';
import { seedCourses } from '../data/seedData.ts';
import { protect, optionalAuth, AuthenticatedRequest } from '../middleware/auth.middleware.ts';

const router = Router();

// Mutable in-memory courses array for seamless runtime additions
export let activeCourses = seedCourses.map((c: any) => ({
  ...c,
  status: c.status || 'approved',
  instructorId: c.instructorId || 'demo-instructor-1',
  instructorName: c.instructorName || 'Rohit Mehta',
  announcements: c.announcements || [
    {
      id: 'ann-1',
      title: 'Welcome to the Course!',
      content: 'Welcome everyone. Make sure to complete each lesson, ask questions in the discussion forum, and test your understanding with the AI Tutor.',
      date: new Date(Date.now() - 86400000 * 3).toISOString()
    }
  ]
}));

// In-memory discussions store
export interface DiscussionThread {
  id: string;
  courseId: string;
  lessonId?: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  title: string;
  content: string;
  createdAt: string;
  replies: {
    id: string;
    authorId: string;
    authorName: string;
    authorRole: string;
    content: string;
    createdAt: string;
  }[];
}

export const discussionsDb: DiscussionThread[] = [
  {
    id: 'disc-1',
    courseId: 'html-css-basics',
    lessonId: 'html-structure',
    authorId: 'demo-student-1',
    authorName: 'Ananya Sharma',
    authorRole: 'student',
    title: 'Difference between <section> and <article>?',
    content: 'When is it better to use <article> instead of <section> in semantic HTML?',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    replies: [
      {
        id: 'rep-1',
        authorId: 'demo-instructor-1',
        authorName: 'Rohit Mehta',
        authorRole: 'instructor',
        content: 'Great question Ananya! Use `<article>` when the content is self-contained and would make sense independently (like a blog post, news story, or forum post). Use `<section>` for a thematic grouping of content, typically with a heading.',
        createdAt: new Date(Date.now() - 86400000 * 1).toISOString()
      }
    ]
  },
  {
    id: 'disc-2',
    courseId: 'javascript-fundamentals',
    lessonId: 'js-closures',
    authorId: 'demo-student-1',
    authorName: 'Ananya Sharma',
    authorRole: 'student',
    title: 'Why do closures retain outer variables in memory?',
    content: 'Does a closure prevent the outer function scope from being garbage collected?',
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    replies: [
      {
        id: 'rep-2',
        authorId: 'demo-instructor-1',
        authorName: 'Rohit Mehta',
        authorRole: 'instructor',
        content: 'Yes! Because the inner function still holds a reference to the outer scope lexical environment, the JavaScript V8 engine will keep those variables alive until the inner function itself has no more references.',
        createdAt: new Date().toISOString()
      }
    ]
  }
];

// Re-export for compatibility with other modules
export const initialCourses = activeCourses;

/**
 * @route   GET /api/courses
 * @desc    Retrieve all courses with optional category, level, or search filters
 * @access  Public
 */
router.get('/courses', async (req: Request, res: Response) => {
  try {
    const { category, level, search } = req.query as {
      category?: string;
      level?: string;
      search?: string;
    };

    if (isDbConnected()) {
      const filter: any = {};
      if (category && category !== 'all') {
        filter.category = new RegExp(`^${category}$`, 'i');
      }
      if (level && level !== 'all') {
        filter.level = new RegExp(`^${level}$`, 'i');
      }
      if (search && search.trim()) {
        const searchRegex = new RegExp(search.trim(), 'i');
        filter.$or = [
          { title: searchRegex },
          { description: searchRegex },
          { category: searchRegex }
        ];
      }

      const courses = await Course.find(filter).lean();
      if (courses && courses.length > 0) {
        return res.status(200).json(courses);
      }
    }

    // In-memory fallback
    let filtered = [...activeCourses];

    if (category && category !== 'all') {
      const catLower = category.toLowerCase();
      filtered = filtered.filter(c => 
        c.category.toLowerCase() === catLower ||
        c.categoryLabel.toLowerCase() === catLower
      );
    }

    if (level && level !== 'all') {
      const lvlLower = level.toLowerCase();
      filtered = filtered.filter(c => c.level.toLowerCase() === lvlLower);
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(c => 
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q)
      );
    }

    return res.status(200).json(filtered);
  } catch (err: any) {
    console.error('Error fetching courses:', err);
    return res.status(500).json({ success: false, message: 'Error retrieving courses: ' + err.message });
  }
});

/**
 * @route   GET /api/courses/:id
 * @desc    Retrieve a single course with all lessons by course ID/slug
 * @access  Public
 */
router.get('/courses/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (isDbConnected()) {
      const course = await Course.findOne({ id }).lean();
      if (course) {
        return res.status(200).json(course);
      }
    }

    // In-memory fallback
    const course = activeCourses.find(c => c.id === id);
    if (!course) {
      return res.status(404).json({ success: false, message: `Course "${id}" not found.` });
    }

    return res.status(200).json(course);
  } catch (err: any) {
    console.error('Error fetching course by ID:', err);
    return res.status(500).json({ success: false, message: 'Error retrieving course details.' });
  }
});

/**
 * @route   GET /api/courses/:id/lessons/:lessonId
 * @desc    Retrieve a specific lesson within a course with previous & next navigation
 * @access  Public
 */
router.get('/courses/:id/lessons/:lessonId', async (req: Request, res: Response) => {
  try {
    const { id, lessonId } = req.params;

    let course: any = null;

    if (isDbConnected()) {
      course = await Course.findOne({ id }).lean();
    }

    if (!course) {
      course = activeCourses.find(c => c.id === id);
    }

    if (!course) {
      return res.status(404).json({ success: false, message: `Course "${id}" not found.` });
    }

    const lessons = course.lessons || [];
    const lessonIndex = lessons.findIndex((l: any) => l.id === lessonId);

    if (lessonIndex === -1) {
      return res.status(404).json({
        success: false,
        message: `Lesson "${lessonId}" not found in course "${id}".`
      });
    }

    const currentLesson = lessons[lessonIndex];
    const prevLesson = lessonIndex > 0 ? {
      id: lessons[lessonIndex - 1].id,
      title: lessons[lessonIndex - 1].title
    } : null;

    const nextLesson = lessonIndex < lessons.length - 1 ? {
      id: lessons[lessonIndex + 1].id,
      title: lessons[lessonIndex + 1].title
    } : null;

    return res.status(200).json({
      success: true,
      courseId: course.id,
      courseTitle: course.title,
      category: course.category,
      totalLessons: lessons.length,
      currentLessonIndex: lessonIndex,
      lesson: currentLesson,
      prevLesson,
      nextLesson
    });
  } catch (err: any) {
    console.error('Error fetching specific lesson:', err);
    return res.status(500).json({ success: false, message: 'Error retrieving lesson content.' });
  }
});

/**
 * @route   POST /api/courses
 * @desc    Create a new course with modules and lessons (Instructor/Admin)
 * @access  Protected
 */
router.post('/courses', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      title,
      category,
      categoryLabel,
      level,
      duration,
      description,
      lessons
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({ success: false, message: 'Title and description are required.' });
    }

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + '-' + Math.floor(1000 + Math.random() * 9000);

    const instructorId = req.user?.id || 'demo-instructor-1';
    const instructorName = req.user?.name || 'Rohit Mehta';
    const isSuperAdmin = req.user?.role === 'admin';

    const newCourseData: any = {
      id: slug,
      title: title.trim(),
      category: category || 'web-dev',
      categoryLabel: categoryLabel || 'Web Development',
      level: level || 'Beginner',
      duration: duration || '3 hours',
      description: description.trim(),
      status: isSuperAdmin ? 'approved' : 'pending',
      instructorId,
      instructorName,
      announcements: [
        {
          id: 'ann-init',
          title: 'Course Created',
          content: `Welcome to ${title.trim()}! Please go through the modules and practice questions.`,
          date: new Date().toISOString()
        }
      ],
      lessons: Array.isArray(lessons) && lessons.length > 0 ? lessons : [
        {
          id: `${slug}-lesson-1`,
          title: '1. Introduction & Overview',
          duration: '15 min',
          content: `### Welcome to ${title}\n\nIn this foundational lesson, you will learn the core principles and prerequisites.`
        }
      ],
      createdAt: new Date()
    };

    if (isDbConnected()) {
      try {
        await Course.create(newCourseData);
      } catch (e) {
        console.warn('MongoDB course insert warning:', e);
      }
    }

    activeCourses.unshift(newCourseData);

    return res.status(201).json({
      success: true,
      message: isSuperAdmin ? 'Course published successfully!' : 'Course submitted for admin review!',
      course: newCourseData
    });
  } catch (err: any) {
    console.error('Error creating course:', err);
    return res.status(500).json({ success: false, message: 'Failed to create course: ' + err.message });
  }
});

/**
 * @route   POST /api/courses/:id/approve
 * @desc    Approve or reject a course in the approval queue (Admin)
 * @access  Admin only
 */
router.post('/courses/:id/approve', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body; // 'approved' | 'rejected'

  const targetCourse = activeCourses.find(c => c.id === id);
  if (!targetCourse) {
    return res.status(404).json({ success: false, message: 'Course not found.' });
  }

  targetCourse.status = status === 'rejected' ? 'rejected' : 'approved';

  if (isDbConnected()) {
    try {
      await Course.updateOne({ id }, { status: targetCourse.status });
    } catch (e) {
      // ignore
    }
  }

  return res.status(200).json({
    success: true,
    message: `Course status updated to ${targetCourse.status}.`,
    course: targetCourse
  });
});

/**
 * @route   GET /api/courses/:id/announcements
 * @desc    Get announcements for a course
 * @access  Public
 */
router.get('/courses/:id/announcements', (req: Request, res: Response) => {
  const { id } = req.params;
  const course = activeCourses.find(c => c.id === id);
  if (!course) {
    return res.status(404).json({ success: false, message: 'Course not found' });
  }
  return res.status(200).json({
    success: true,
    announcements: course.announcements || []
  });
});

/**
 * @route   POST /api/courses/:id/announcements
 * @desc    Post an announcement (Instructor / Admin)
 * @access  Protected
 */
router.post('/courses/:id/announcements', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { title, content } = req.body;

  if (!title || !content) {
    return res.status(400).json({ success: false, message: 'Title and content required.' });
  }

  const course = activeCourses.find(c => c.id === id);
  if (!course) {
    return res.status(404).json({ success: false, message: 'Course not found' });
  }

  const newAnn = {
    id: 'ann_' + Date.now(),
    title: title.trim(),
    content: content.trim(),
    date: new Date().toISOString()
  };

  if (!course.announcements) course.announcements = [];
  course.announcements.unshift(newAnn);

  return res.status(201).json({
    success: true,
    message: 'Announcement posted!',
    announcement: newAnn
  });
});

/**
 * @route   GET /api/courses/:id/discussions
 * @desc    Get all discussion threads for a course
 * @access  Public
 */
router.get('/courses/:id/discussions', (req: Request, res: Response) => {
  const { id } = req.params;
  const threads = discussionsDb.filter(d => d.courseId === id);
  return res.status(200).json({
    success: true,
    threads
  });
});

/**
 * @route   POST /api/courses/:id/discussions
 * @desc    Create a new discussion question / thread
 * @access  Protected / Public
 */
router.post('/courses/:id/discussions', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { title, content, lessonId } = req.body;

  if (!title || !content) {
    return res.status(400).json({ success: false, message: 'Title and content are required.' });
  }

  const newThread: DiscussionThread = {
    id: 'disc_' + Date.now(),
    courseId: id,
    lessonId,
    authorId: req.user?.id || 'guest-student',
    authorName: req.user?.name || 'Student',
    authorRole: req.user?.role || 'student',
    title: title.trim(),
    content: content.trim(),
    createdAt: new Date().toISOString(),
    replies: []
  };

  discussionsDb.unshift(newThread);

  return res.status(201).json({
    success: true,
    message: 'Discussion question posted!',
    thread: newThread
  });
});

/**
 * @route   POST /api/courses/:id/discussions/:discId/reply
 * @desc    Reply to a discussion thread
 * @access  Protected / Public
 */
router.post('/courses/:id/discussions/:discId/reply', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  const { discId } = req.params;
  const { content } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ success: false, message: 'Reply content is required.' });
  }

  const thread = discussionsDb.find(d => d.id === discId);
  if (!thread) {
    return res.status(404).json({ success: false, message: 'Discussion thread not found.' });
  }

  const newReply = {
    id: 'rep_' + Date.now(),
    authorId: req.user?.id || 'author',
    authorName: req.user?.name || 'Peer / Instructor',
    authorRole: req.user?.role || 'student',
    content: content.trim(),
    createdAt: new Date().toISOString()
  };

  thread.replies.push(newReply);

  return res.status(201).json({
    success: true,
    message: 'Reply posted!',
    reply: newReply
  });
});

export default router;
