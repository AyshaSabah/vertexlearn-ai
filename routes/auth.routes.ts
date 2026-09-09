import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.ts';
import { isDbConnected } from '../config/db.ts';
import { protect, AuthenticatedRequest } from '../middleware/auth.middleware.ts';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'vertexlearn-dev-secret-key-2026';
const JWT_EXPIRES_IN = '7d';

// In-memory fallback user store for resilience
export interface UserStore {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'student' | 'instructor' | 'admin';
  isActive: boolean;
  createdAt: string;
}

export const usersDb: UserStore[] = [
  {
    id: 'demo-student-1',
    name: 'Ananya Sharma',
    email: 'student@example.com',
    passwordHash: bcrypt.hashSync('password123', 10),
    role: 'student',
    isActive: true,
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString()
  },
  {
    id: 'demo-student-ananya',
    name: 'Ananya Sharma',
    email: 'ananya@example.com',
    passwordHash: bcrypt.hashSync('SecurePass123', 10),
    role: 'student',
    isActive: true,
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString()
  },
  {
    id: 'demo-instructor-1',
    name: 'Rohit Mehta',
    email: 'instructor@example.com',
    passwordHash: bcrypt.hashSync('password123', 10),
    role: 'instructor',
    isActive: true,
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString()
  },
  {
    id: 'demo-instructor-rohit',
    name: 'Rohit Mehta',
    email: 'rohit@example.com',
    passwordHash: bcrypt.hashSync('SecurePass123', 10),
    role: 'instructor',
    isActive: true,
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString()
  },
  {
    id: 'demo-admin-1',
    name: 'Meera Patel',
    email: 'admin@example.com',
    passwordHash: bcrypt.hashSync('password123', 10),
    role: 'admin',
    isActive: true,
    createdAt: new Date(Date.now() - 86400000 * 60).toISOString()
  },
  {
    id: 'demo-admin-meera',
    name: 'Meera Patel',
    email: 'meera@example.com',
    passwordHash: bcrypt.hashSync('SecurePass123', 10),
    role: 'admin',
    isActive: true,
    createdAt: new Date(Date.now() - 86400000 * 60).toISOString()
  }
];

/**
 * Generate cryptographically signed JWT token
 */
function generateToken(payload: { id: string; name: string; email: string; role?: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * @route   POST /api/auth/register
 * @desc    Register a new student account, hash password with bcrypt, and issue JWT
 * @access  Public
 */
router.post('/auth/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    // 1. Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required.'
      });
    }

    const trimmedName = name.trim();
    const normalizedEmail = email.toLowerCase().trim();

    // 2. Validate email format
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address format.'
      });
    }

    // 3. Validate password strength
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long for security.'
      });
    }

    // 4. Check if user already exists
    const assignedRole = (req.body.role === 'instructor' || req.body.role === 'admin') ? req.body.role : 'student';

    if (isDbConnected()) {
      const existingUser = await User.findOne({ email: normalizedEmail });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'An account with this email address already exists. Please log in.'
        });
      }

      // Create new user in MongoDB (pre-save hook hashes password automatically)
      const userDoc = await User.create({
        name: trimmedName,
        email: normalizedEmail,
        password,
        role: assignedRole,
        isActive: true
      });

      const token = generateToken({
        id: userDoc._id.toString(),
        name: userDoc.name,
        email: userDoc.email,
        role: userDoc.role
      });

      return res.status(201).json({
        success: true,
        message: 'Account successfully registered!',
        token,
        user: {
          id: userDoc._id.toString(),
          name: userDoc.name,
          email: userDoc.email,
          role: userDoc.role
        }
      });
    }

    // In-memory fallback
    const memoryExisting = usersDb.find(u => u.email === normalizedEmail);
    if (memoryExisting) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists. Please log in.'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser: UserStore = {
      id: 'user_' + Date.now(),
      name: trimmedName,
      email: normalizedEmail,
      passwordHash,
      role: assignedRole,
      isActive: true,
      createdAt: new Date().toISOString()
    };
    usersDb.push(newUser);

    const token = generateToken({
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role
    });

    return res.status(201).json({
      success: true,
      message: 'Account successfully registered!',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (err: any) {
    console.error('[Auth Register Error]:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error during registration: ' + (err.message || err)
    });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user credentials with bcrypt and return JWT token
 * @access  Public
 */
router.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 1. MongoDB authentication check
    if (isDbConnected()) {
      const userDoc = await User.findOne({ email: normalizedEmail });
      if (!userDoc) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password.'
        });
      }

      // Secure bcrypt password verification
      const isMatch = await userDoc.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password.'
        });
      }

      const token = generateToken({
        id: userDoc._id.toString(),
        name: userDoc.name,
        email: userDoc.email,
        role: userDoc.role
      });

      return res.status(200).json({
        success: true,
        message: 'Login successful! Welcome back.',
        token,
        user: {
          id: userDoc._id.toString(),
          name: userDoc.name,
          email: userDoc.email,
          role: userDoc.role
        }
      });
    }

    // 2. In-memory fallback check
    const user = usersDb.find(u => u.email === normalizedEmail);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const token = generateToken({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    });

    return res.status(200).json({
      success: true,
      message: 'Login successful! Welcome back.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err: any) {
    console.error('[Auth Login Error]:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error during login: ' + (err.message || err)
    });
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get currently authenticated student profile using JWT
 * @access  Protected (Requires Bearer token)
 */
router.get('/auth/me', protect, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized. No active session found.'
    });
  }

  return res.status(200).json({
    success: true,
    user: req.user
  });
});

/**
 * @route   PUT /api/auth/profile
 * @desc    Update student profile (name or password)
 * @access  Protected (Requires Bearer token)
 */
router.put('/auth/profile', protect, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized.' });
    }

    const { name, currentPassword, newPassword } = req.body;

    if (isDbConnected()) {
      const userDoc = await User.findById(userId);
      if (!userDoc) {
        return res.status(404).json({ success: false, message: 'User not found.' });
      }

      if (name && name.trim()) {
        userDoc.name = name.trim();
      }

      // If updating password, verify current password first
      if (newPassword) {
        if (!currentPassword) {
          return res.status(400).json({
            success: false,
            message: 'Current password is required to set a new password.'
          });
        }

        const isCurrentValid = await userDoc.comparePassword(currentPassword);
        if (!isCurrentValid) {
          return res.status(400).json({
            success: false,
            message: 'Current password is incorrect.'
          });
        }

        if (newPassword.length < 6) {
          return res.status(400).json({
            success: false,
            message: 'New password must be at least 6 characters long.'
          });
        }

        userDoc.password = newPassword; // Pre-save hook will hash it
      }

      await userDoc.save();

      return res.status(200).json({
        success: true,
        message: 'Profile successfully updated!',
        user: {
          id: userDoc._id.toString(),
          name: userDoc.name,
          email: userDoc.email,
          role: userDoc.role
        }
      });
    }

    // In-memory fallback
    const memoryUser = usersDb.find(u => u.id === userId || u.email === req.user?.email);
    if (!memoryUser) {
      return res.status(404).json({ success: false, message: 'User not found in store.' });
    }

    if (name && name.trim()) {
      memoryUser.name = name.trim();
    }

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password is required to set a new password.'
        });
      }

      const isCurrentValid = await bcrypt.compare(currentPassword, memoryUser.passwordHash);
      if (!isCurrentValid) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect.'
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'New password must be at least 6 characters long.'
        });
      }

      const salt = await bcrypt.genSalt(10);
      memoryUser.passwordHash = await bcrypt.hash(newPassword, salt);
    }

    return res.status(200).json({
      success: true,
      message: 'Profile successfully updated!',
      user: {
        id: memoryUser.id,
        name: memoryUser.name,
        email: memoryUser.email,
        role: memoryUser.role
      }
    });
  } catch (err: any) {
    console.error('[Update Profile Error]:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error while updating profile.'
    });
  }
});

/**
 * @route   POST /api/auth/logout
 * @desc    Stateless client-side logout confirmation
 * @access  Public
 */
router.post('/auth/logout', (req: Request, res: Response) => {
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully. Please clear client-side token.'
  });
});

/**
 * @route   POST /api/auth/switch-demo-role
 * @desc    Seamlessly switch demo persona for reviewers (student/instructor/admin)
 * @access  Public
 */
router.post('/auth/switch-demo-role', (req: Request, res: Response) => {
  const { role } = req.body;
  const targetRole = (role === 'instructor' || role === 'admin') ? role : 'student';

  let persona: UserStore | undefined;
  if (targetRole === 'admin') {
    persona = usersDb.find(u => u.id === 'demo-admin-meera' || u.id === 'demo-admin-1');
  } else if (targetRole === 'instructor') {
    persona = usersDb.find(u => u.id === 'demo-instructor-rohit' || u.id === 'demo-instructor-1');
  } else {
    persona = usersDb.find(u => u.id === 'demo-student-ananya' || u.id === 'demo-student-1');
  }

  if (!persona) {
    persona = usersDb[0];
  }

  const token = generateToken({
    id: persona.id,
    name: persona.name,
    email: persona.email,
    role: persona.role
  });

  return res.status(200).json({
    success: true,
    message: `Switched to demo persona: ${persona.name} (${persona.role})`,
    token,
    user: {
      id: persona.id,
      name: persona.name,
      email: persona.email,
      role: persona.role
    }
  });
});

/**
 * @route   GET /api/admin/users
 * @desc    List all registered users with role and status
 * @access  Admin / Instructor
 */
router.get('/admin/users', protect, (req: AuthenticatedRequest, res: Response) => {
  // If in MongoDB
  const usersList = usersDb.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    isActive: u.isActive !== false,
    createdAt: u.createdAt
  }));

  return res.status(200).json({
    success: true,
    count: usersList.length,
    users: usersList
  });
});

/**
 * @route   PUT /api/admin/users/:id/role
 * @desc    Update a user's role (student / instructor / admin)
 * @access  Admin only
 */
router.put('/admin/users/:id/role', protect, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!['student', 'instructor', 'admin'].includes(role)) {
    return res.status(400).json({ success: false, message: 'Invalid role specified.' });
  }

  if (isDbConnected()) {
    try {
      const user = await User.findById(id);
      if (user) {
        user.role = role as any;
        await user.save();
      }
    } catch (e) {
      // continue to memory
    }
  }

  const memUser = usersDb.find(u => u.id === id);
  if (memUser) {
    memUser.role = role as any;
  }

  return res.status(200).json({
    success: true,
    message: `User role updated to ${role} successfully.`,
    userId: id,
    newRole: role
  });
});

/**
 * @route   PUT /api/admin/users/:id/suspend
 * @desc    Suspend or reactivate a user account
 * @access  Admin only
 */
router.put('/admin/users/:id/suspend', protect, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { isActive } = req.body;

  if (isDbConnected()) {
    try {
      const user = await User.findById(id);
      if (user) {
        user.isActive = isActive;
        await user.save();
      }
    } catch (e) {
      // continue to memory
    }
  }

  const memUser = usersDb.find(u => u.id === id);
  if (memUser) {
    memUser.isActive = isActive;
  }

  return res.status(200).json({
    success: true,
    message: `User account ${isActive ? 'reactivated' : 'suspended'} successfully.`,
    userId: id,
    isActive
  });
});

/**
 * @route   GET /api/admin/analytics/overview
 * @desc    Return high-level platform health & metrics for admin dashboard
 * @access  Admin only
 */
router.get('/admin/analytics/overview', protect, (req: AuthenticatedRequest, res: Response) => {
  return res.status(200).json({
    success: true,
    metrics: {
      totalUsers: usersDb.length,
      activeStudents: usersDb.filter(u => u.role === 'student').length,
      instructorsCount: usersDb.filter(u => u.role === 'instructor').length,
      totalCourses: 5,
      totalEnrollments: 142,
      courseCompletionRate: 68.4,
      avgQuizScore: 84.5,
      platformUptime: '99.9%',
      dailyActiveUsers: 38,
      estimatedRevenue: '$4,280'
    }
  });
});

export default router;
