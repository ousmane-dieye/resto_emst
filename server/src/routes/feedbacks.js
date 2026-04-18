import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/database.js';
import { config } from '../config/index.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.post('/', authMiddleware(['ETUDIANT']), async (req, res) => {
  try {
    const { commandeId, noteGout, noteTemperature, notePortion, commentaire } = req.body;
    
    if (!commandeId || !noteGout || !noteTemperature || !notePortion) {
      return res.status(400).json({ error: 'Champs requis manquants', code: 'MISSING_FIELDS' });
    }
    
    const [commandes] = await query('SELECT * FROM commandes WHERE id = ? AND etudiantId = ?', [commandeId, req.user.id]);
    if (!commandes[0]) {
      return res.status(404).json({ error: 'Commande introuvable', code: 'COMMANDE_NOT_FOUND' });
    }
    
    const [existing] = await query('SELECT * FROM feedbacks WHERE commandeId = ?', [commandeId]);
    if (existing) {
      return res.status(400).json({ error: 'Feedback déjà soumis pour cette commande', code: 'FEEDBACK_EXISTS' });
    }
    
    const id = uuidv4();
    await query(
      `INSERT INTO feedbacks (id, commandeId, etudiantId, noteGout, noteTemperature, notePortion, commentaire, dateSoumission, pointsCredites)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, commandeId, req.user.id, noteGout, noteTemperature, notePortion, commentaire || '', new Date(), config.points.feedback]
    );
    
    const [users] = await query('SELECT * FROM utilisateurs WHERE id = ?', [req.user.id]);
    if (users[0]) {
      const newPoints = (users[0].pointsESMT || 0) + config.points.feedback;
      await query('UPDATE utilisateurs SET pointsESMT = ? WHERE id = ?', [newPoints, req.user.id]);
    }
    
    const [commandesPlat] = await query('SELECT platId FROM commandes WHERE id = ?', [commandeId]);
    if (commandesPlat[0]) {
      const [fbList] = await query('SELECT * FROM feedbacks f JOIN commandes c ON f.commandeId = c.id WHERE c.platId = ?', [commandesPlat[0].platId]);
      
      if (fbList.length > 0) {
        const totalNotes = fbList.reduce((sum, fb) => 
          sum + (fb.noteGout + fb.noteTemperature + fb.notePortion) / 3, 0
        );
        const noteMoyenne = Math.round((totalNotes / fbList.length) * 10) / 10;
        await query('UPDATE plats SET noteMoyenne = ? WHERE id = ?', [noteMoyenne, commandesPlat[0].platId]);
      }
    }
    
    const [fb] = await query('SELECT * FROM feedbacks WHERE id = ?', [id]);
    res.status(201).json(fb[0]);
  } catch (error) {
    console.error('Create feedback error:', error);
    res.status(500).json({ error: 'Erreur serveur', code: 'SERVER_ERROR' });
  }
});

router.get('/', authMiddleware(['SUPER_ADMIN', 'ADMINISTRATEUR']), async (req, res) => {
  try {
    const feedbacks = await query(`
      SELECT f.*, p.nom as platNom, u.nom as etudiantNom, u.prenom as etudiantPrenom
      FROM feedbacks f
      LEFT JOIN commandes c ON f.commandeId = c.id
      LEFT JOIN plats p ON c.platId = p.id
      LEFT JOIN utilisateurs u ON f.etudiantId = u.id
      ORDER BY f.dateSoumission DESC
    `);
    res.json(feedbacks);
  } catch (error) {
    console.error('Get feedbacks error:', error);
    res.status(500).json({ error: 'Erreur serveur', code: 'SERVER_ERROR' });
  }
});

export default router;