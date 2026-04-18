import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authMiddleware(), async (req, res) => {
  try {
    const notifications = await query(
      'SELECT * FROM notifications WHERE destinataire = ? ORDER BY dateEnvoi DESC',
      [req.user.id]
    );
    res.json(notifications);
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Erreur serveur', code: 'SERVER_ERROR' });
  }
});

router.put('/:id/lire', authMiddleware(), async (req, res) => {
  try {
    const { id } = req.params;
    
    const [notifs] = await query(
      'SELECT * FROM notifications WHERE id = ? AND destinataire = ?',
      [id, req.user.id]
    );
    
    if (!notifs[0]) {
      return res.status(404).json({ error: 'Notification introuvable', code: 'NOT_FOUND' });
    }
    
    await query('UPDATE notifications SET lue = TRUE WHERE id = ?', [id]);
    res.json({ ok: true });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ error: 'Erreur serveur', code: 'SERVER_ERROR' });
  }
});

router.put('/tout-lire', authMiddleware(), async (req, res) => {
  try {
    const result = await query(
      'UPDATE notifications SET lue = TRUE WHERE destinataire = ? AND lue = FALSE',
      [req.user.id]
    );
    res.json({ updated: result.affectedRows });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({ error: 'Erreur serveur', code: 'SERVER_ERROR' });
  }
});

export default router;