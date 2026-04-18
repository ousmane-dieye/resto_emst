import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authMiddleware(), (req, res) => {
  try {
    const notifications = db.notifications.filter(n => n.destinataire === req.user.id);
    res.json(notifications);
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Erreur serveur', code: 'SERVER_ERROR' });
  }
});

router.put('/:id/lire', authMiddleware(), (req, res) => {
  try {
    const { id } = req.params;
    const notification = db.notifications.find(n => n.id === id && n.destinataire === req.user.id);
    
    if (!notification) {
      return res.status(404).json({ error: 'Notification introuvable', code: 'NOT_FOUND' });
    }
    
    notification.lue = true;
    res.json({ ok: true });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ error: 'Erreur serveur', code: 'SERVER_ERROR' });
  }
});

router.put('/tout-lire', authMiddleware(), (req, res) => {
  try {
    const notifications = db.notifications.filter(n => n.destinataire === req.user.id && !n.lue);
    notifications.forEach(n => n.lue = true);
    res.json({ updated: notifications.length });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({ error: 'Erreur serveur', code: 'SERVER_ERROR' });
  }
});

export default router;