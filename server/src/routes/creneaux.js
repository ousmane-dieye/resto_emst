import express from 'express';
import { db } from '../config/database.js';

const router = express.Router();

router.get('/', (req, res) => {
  try {
    res.json(db.creneaux);
  } catch (error) {
    console.error('Get creneaux error:', error);
    res.status(500).json({ error: 'Erreur serveur', code: 'SERVER_ERROR' });
  }
});

export default router;