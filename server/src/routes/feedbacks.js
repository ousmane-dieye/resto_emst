import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/database.js';
import { config } from '../config/index.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

const studentRole = ['ETUDIANT'];
const adminRoles = ['SUPER_ADMIN', 'ADMINISTRATEUR'];

router.post('/', authMiddleware(studentRole), (req, res) => {
  try {
    const { commandeId, noteGout, noteTemperature, notePortion, commentaire } = req.body;
    
    if (!commandeId || !noteGout || !noteTemperature || !notePortion) {
      return res.status(400).json({ error: 'Notes requises', code: 'MISSING_FIELDS' });
    }
    
    const commande = db.commandes.find(c => c.id === commandeId && c.etudiantId === req.user.id);
    if (!commande) {
      return res.status(404).json({ error: 'Commande introuvable', code: 'COMMANDE_NOT_FOUND' });
    }
    
    if (commande.statut !== 'VALIDEE') {
      return res.status(400).json({ error: 'Commande non validée', code: 'COMMANDE_NOT_VALIDATED' });
    }
    
    const feedback = {
      id: uuidv4(),
      commandeId,
      etudiantId: req.user.id,
      noteGout: parseInt(noteGout),
      noteTemperature: parseInt(noteTemperature),
      notePortion: parseInt(notePortion),
      commentaire: commentaire || '',
      dateSoumission: new Date(),
      pointsCredites: config.POINTS_FEEDBACK,
    };
    
    db.feedbacks.push(feedback);
    
    const etudiant = db.utilisateurs.find(u => u.id === req.user.id);
    if (etudiant) {
      etudiant.pointsESMT = (etudiant.pointsESMT || 0) + config.POINTS_FEEDBACK;
    }
    
    const plat = db.plats.find(p => p.id === commande.platId);
    if (plat) {
      const platFeedbacks = db.feedbacks.filter(f => {
        const cmd = db.commandes.find(c => c.id === f.commandeId);
        return cmd?.platId === plat.id;
      });
      
      if (platFeedbacks.length > 0) {
        plat.noteMoyenne = platFeedbacks.reduce((sum, f) => 
          sum + (f.noteGout + f.noteTemperature + f.notePortion) / 3, 0) / platFeedbacks.length;
      }
    }
    
    res.status(201).json(feedback);
  } catch (error) {
    console.error('Create feedback error:', error);
    res.status(500).json({ error: 'Erreur serveur', code: 'SERVER_ERROR' });
  }
});

router.get('/', authMiddleware(adminRoles), (req, res) => {
  try {
    const plats = req.query.platId;
    let feedbacks = [...db.feedbacks];
    
    if (plats) {
      feedbacks = feedbacks.filter(f => {
        const cmd = db.commandes.find(c => c.id === f.commandeId);
        return cmd?.platId === plats;
      });
    }
    
    res.json(feedbacks);
  } catch (error) {
    console.error('Get feedbacks error:', error);
    res.status(500).json({ error: 'Erreur serveur', code: 'SERVER_ERROR' });
  }
});

export default router;