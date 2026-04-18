import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

const adminRoles = ['SUPER_ADMIN', 'ADMINISTRATEUR', 'CUISINIER'];

router.get('/', authMiddleware(adminRoles), async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const [etudiants] = await query("SELECT COUNT(*) as total FROM utilisateurs WHERE role = 'ETUDIANT'");
    const [commandesJour] = await query(
      "SELECT COUNT(*) as total, COALESCE(SUM(montantFCFA), 0) as revenu FROM commandes WHERE DATE(dateHeure) = ?",
      [today]
    );
    const [platsDispo] = await query("SELECT COUNT(*) as total FROM plats WHERE estDisponible = TRUE");
    const [stocksCrit] = await query("SELECT COUNT(*) as total FROM stocks WHERE quantite <= seuilAlerte");
    const [platsNotes] = await query("SELECT AVG(noteMoyenne) as moyenne FROM plats");
    const [totalCom] = await query("SELECT COUNT(*) as total, COALESCE(SUM(montantFCFA), 0) as recette FROM commandes");
    
    res.json({
      totalEtudiants: etudiants[0].total,
      commandesAujourdhui: commandesJour[0].total,
      revenuAujourdhui: commandesJour[0].revenu,
      platsDisponibles: platsDispo[0].total,
      stocksCritiques: stocksCrit[0].total,
      noteMoyenneGlobale: platsNotes[0].moyenne || 0,
      totalCommandes: totalCom[0].total,
      recettesTotales: totalCom[0].recette,
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Erreur serveur', code: 'SERVER_ERROR' });
  }
});

router.get('/prediction', authMiddleware(adminRoles), async (req, res) => {
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
      surplusDetecte: false,
      stocksCritiques: [],
    };
    
    const [stocks] = await query("SELECT ingredient FROM stocks WHERE quantite <= seuilAlerte");
    prediction.stocksCritiques = stocks.map(s => s.ingredient);
    prediction.surplusDetecte = stocks.length > 0;
    
    res.json(prediction);
  } catch (error) {
    console.error('Get prediction error:', error);
    res.status(500).json({ error: 'Erreur serveur', code: 'SERVER_ERROR' });
  }
});

export default router;