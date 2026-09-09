import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User.ts';
import { usersDb } from '../routes/auth.routes.ts';
import { isDbConnected } from '../config/db.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'vertexlearn-dev-secret-key-2026';

export interface AuthUserPayload {
  id: string;
  name: string;
  email: string;
  role?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUserPayload;
}

/**
 * Mandatory Authentication Middleware
 * Validates the JWT Bearer token in the Authorization header.
 * Attaches the authenticated user payload to req.user.
 */
export async function protect(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  let token: string | undefined;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authorization token provided. Please log in.'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUserPayload;

    if (isDbConnected()) {
      try {
        const userDoc = await User.findById(decoded.id).select('-password');
        if (userDoc) {
          req.user = {
            id: userDoc._id.toString(),
            name: userDoc.name,
            email: userDoc.email,
            role: userDoc.role
          };
          return next();
        }
      } catch (dbErr) {
        console.warn('[Auth Middleware] DB lookup error, continuing with token payload:', dbErr);
      }
    }

    // In-memory fallback lookup
    const memoryUser = usersDb.find(u => u.id === decoded.id || u.email === decoded.email);
    if (memoryUser) {
      req.user = {
        id: memoryUser.id,
        name: memoryUser.name,
        email: memoryUser.email,
        role: 'student'
      };
    } else {
      req.user = {
        id: decoded.id,
        name: decoded.name,
        email: decoded.email,
        role: decoded.role || 'student'
      };
    }

    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Your session has expired. Please log in again.',
        expiredAt: error.expiredAt
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid or malformed authorization token.'
    });
  }
}

/**
 * Optional Authentication Middleware
 * If a valid token is present, attaches req.user; otherwise leaves it undefined and continues.
 */
export async function optionalAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as AuthUserPayload;
      req.user = decoded;
    } catch {
      // Ignore token verification failure for optional auth
    }
  }
  next();
}

/**
 * Role-Based Access Control (RBAC) Middleware
 * Ensures the authenticated user possesses at least one of the required roles.
 */
export function requireRole(...roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to access this resource.'
      });
    }

    const userRole = req.user.role || 'student';
    // Admin has superuser access to all role-restricted routes
    if (userRole === 'admin' || roles.includes(userRole)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `Access denied. Requires one of [${roles.join(', ')}] role privileges. Current role: ${userRole}.`
    });
  };
}
