import express from 'express';
import { query } from '../config/database.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const creneaux = await query('SELECT * FROM creneaux ORDER BY heureDebut');
    res.json(creneaux);
  } catch (error) {
    console.error('Get creneaux error:', error);
    res.status(500).json({ error: 'Erreur serveur', code: 'SERVER_ERROR' });
  }
});

export default router;