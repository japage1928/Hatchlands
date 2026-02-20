/**
 * Authentication middleware
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { query } from '../db/connection';

const JWT_SECRET = process.env.JWT_SECRET || 'development-secret';

export interface AuthRequest extends Request {
  playerId?: string;
}

/**
 * Authenticate JWT token and attach player ID to request
 */
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const token = authHeader.substring(7);
    
    // Verify JWT
    const decoded = jwt.verify(token, JWT_SECRET) as { playerId: string };
    
    // Check if session exists and is valid
    const session = await query(
      'SELECT * FROM sessions WHERE token = $1 AND expires_at > $2',
      [token, Date.now()]
    );

    if (session.rows.length === 0) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }

    // Update last used timestamp
    await query(
      'UPDATE sessions SET last_used_at = $1 WHERE token = $2',
      [Date.now(), token]
    );

    // Attach player ID to request
    (req as AuthRequest).playerId = decoded.playerId;
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
}
