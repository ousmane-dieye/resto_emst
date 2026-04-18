import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { db } from '../config/database.js';

export const authMiddleware = (roles = []) => (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Token manquant', code: 'NO_TOKEN' });
  }
  
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    req.user = decoded;
    
    if (roles.length && !roles.includes(decoded.role)) {
      return res.status(403).json({ error: 'Accès refusé', code: 'FORBIDDEN' });
    }
    
    next();
  } catch {
    res.status(401).json({ error: 'Token invalide', code: 'INVALID_TOKEN' });
  }
};

export const requireAuth = authMiddleware();

export const requireRole = (...roles) => authMiddleware(roles);