import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

const authRoles = ['SUPER_ADMIN', 'ADMINISTRATEUR', 'CUISINIER'];

router.get('/', authMiddleware(authRoles), (req, res) => {
  try {
    const stocks = db.stocks.map(s => ({
      ...s,
      estCritique: s.quantite <= s.seuilAlerte,
      percentage: Math.min(100, (s.quantite / (s.seuilAlerte * 4)) * 100),
    }));
    
    res.json(stocks);
  } catch (error) {
    console.error('Get stocks error:', error);
    res.status(500).json({ error: 'Erreur serveur', code: 'SERVER_ERROR' });
  }
});

router.put('/:id', authMiddleware(['SUPER_ADMIN', 'ADMINISTRATEUR']), (req, res) => {
  try {
    const { id } = req.params;
    const idx = db.stocks.findIndex(s => s.id === id);
    
    if (idx === -1) {
      return res.status(404).json({ error: 'Stock introuvable', code: 'STOCK_NOT_FOUND' });
    }
    
    db.stocks[idx] = { ...db.stocks[idx], ...req.body, derniereMaj: new Date() };
    res.json(db.stocks[idx]);
  } catch (error) {
    console.error('Update stock error:', error);
    res.status(500).json({ error: 'Erreur serveur', code: 'SERVER_ERROR' });
  }
});

router.post('/', authMiddleware(['SUPER_ADMIN', 'ADMINISTRATEUR']), (req, res) => {
  try {
    const { ingredient, quantite, unite, seuilAlerte } = req.body;
    
    if (!ingredient || quantite === undefined) {
      return res.status(400).json({ error: 'Ingredient et quantite requis', code: 'MISSING_FIELDS' });
    }
    
    const stock = {
      id: uuidv4(),
      ingredient,
      quantite,
      unite: unite || 'kg',
      seuilAlerte: seuilAlerte || 5,
      derniereMaj: new Date(),
    };
    
    db.stocks.push(stock);
    res.status(201).json(stock);
  } catch (error) {
    console.error('Create stock error:', error);
    res.status(500).json({ error: 'Erreur serveur', code: 'SERVER_ERROR' });
  }
});

export default router;