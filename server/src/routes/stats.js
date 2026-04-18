import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

const adminRoles = ['SUPER_ADMIN', 'ADMINISTRATEUR', 'CUISINIER'];

router.get('/', authMiddleware(adminRoles), (req, res) => {
  try {
    const today = new Date().toDateString();
    const commandesAujourdhui = db.commandes.filter(c => new Date(c.dateHeure).toDateString() === today);
    
    const stats = {
      totalEtudiants: db.utilisateurs.filter(u => u.role === 'ETUDIANT').length,
      commandesAujourdhui: commandesAujourdhui.length,
      revenuAujourdhui: commandesAujourdhui.reduce((sum, c) => sum + c.montantFCFA, 0),
      platsDisponibles: db.plats.filter(p => p.estDisponible).length,
      stocksCritiques: db.stocks.filter(s => s.quantite <= s.seuilAlerte).length,
      noteMoyenneGlobale: db.plats.reduce((sum, p) => sum + p.noteMoyenne, 0) / db.plats.length || 0,
      totalCommandes: db.commandes.length,
      recettesTotales: db.commandes.reduce((sum, c) => sum + c.montantFCFA, 0),
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Erreur serveur', code: 'SERVER_ERROR' });
  }
});

router.get('/prediction', authMiddleware(adminRoles), (req, res) => {
  try {
    const prediction = {
      id: uuidv4(),
      datePrevision: new Date(),
      nbCouvertsPrevu: Math.round(120 + Math.random() * 40),
      previsionParCreneau: {
        '07:30-09:00': Math.round(20 + Math.random() * 15),
        '09:00-10:30': Math.round(10 + Math.random() * 10),
        '12:00-13:30': Math.round(70 + Math.random() * 20),
        '13:30-15:00': Math.round(30 + Math.random() * 15),
      },
      tauxConfiance: 0.82 + Math.random() * 0.1,
      surplusDetecte: db.stocks.some(s => s.quantite > s.seuilAlerte * 4),
      stocksCritiques: db.stocks.filter(s => s.quantite <= s.seuilAlerte).map(s => s.ingredient),
    };
    
    res.json(prediction);
  } catch (error) {
    console.error('Get prediction error:', error);
    res.status(500).json({ error: 'Erreur serveur', code: 'SERVER_ERROR' });
  }
});

export default router;