import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

const authRoles = ['SUPER_ADMIN', 'ADMINISTRATEUR', 'CUISINIER'];

router.get('/', authMiddleware(authRoles), async (req, res) => {
  try {
    const stocks = await query(`
      SELECT *, 
             CASE WHEN quantite <= seuilAlerte THEN TRUE ELSE FALSE END as estCritique,
             ROUND((quantite / (seuilAlerte * 4)) * 100) as percentage
      FROM stocks
      ORDER BY ingredient
    `);
    res.json(stocks);
  } catch (error) {
    console.error('Get stocks error:', error);
    res.status(500).json({ error: 'Erreur serveur', code: 'SERVER_ERROR' });
  }
});

router.put('/:id', authMiddleware(['SUPER_ADMIN', 'ADMINISTRATEUR']), async (req, res) => {
  try {
    const { id } = req.params;
    const { ingredient, quantite, unite, seuilAlerte } = req.body;
    
    const updates = [];
    const params = [];
    
    if (ingredient !== undefined) { updates.push('ingredient = ?'); params.push(ingredient); }
    if (quantite !== undefined) { updates.push('quantite = ?'); params.push(quantite); }
    if (unite !== undefined) { updates.push('unite = ?'); params.push(unite); }
    if (seuilAlerte !== undefined) { updates.push('seuilAlerte = ?'); params.push(seuilAlerte); }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'Aucune donnée à mettre à jour', code: 'MISSING_FIELDS' });
    }
    
    updates.push('dernierMaj = ?');
    params.push(new Date());
    params.push(id);
    
    await query(`UPDATE stocks SET ${updates.join(', ')} WHERE id = ?`, params);
    
    const [stocks] = await query('SELECT * FROM stocks WHERE id = ?', [id]);
    if (!stocks[0]) {
      return res.status(404).json({ error: 'Stock introuvable', code: 'STOCK_NOT_FOUND' });
    }
    
    res.json(stocks[0]);
  } catch (error) {
    console.error('Update stock error:', error);
    res.status(500).json({ error: 'Erreur serveur', code: 'SERVER_ERROR' });
  }
});

router.post('/', authMiddleware(['SUPER_ADMIN', 'ADMINISTRATEUR']), async (req, res) => {
  try {
    const { ingredient, quantite, unite, seuilAlerte } = req.body;
    
    if (!ingredient || quantite === undefined) {
      return res.status(400).json({ error: 'Ingredient et quantite requis', code: 'MISSING_FIELDS' });
    }
    
    const id = uuidv4();
    await query(
      `INSERT INTO stocks (id, ingredient, quantite, unite, seuilAlerte, dernierMaj) VALUES (?, ?, ?, ?, ?, ?)`,
      [id, ingredient, quantite, unite || 'kg', seuilAlerte || 5, new Date()]
    );
    
    const [stocks] = await query('SELECT * FROM stocks WHERE id = ?', [id]);
    res.status(201).json(stocks[0]);
  } catch (error) {
    console.error('Create stock error:', error);
    res.status(500).json({ error: 'Erreur serveur', code: 'SERVER_ERROR' });
  }
});

router.delete('/:id', authMiddleware(['SUPER_ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    
    const [stocks] = await query('SELECT * FROM stocks WHERE id = ?', [id]);
    if (!stocks[0]) {
      return res.status(404).json({ error: 'Stock introuvable', code: 'STOCK_NOT_FOUND' });
    }
    
    await query('DELETE FROM stocks WHERE id = ?', [id]);
    res.json({ message: 'Stock supprimé' });
  } catch (error) {
    console.error('Delete stock error:', error);
    res.status(500).json({ error: 'Erreur serveur', code: 'SERVER_ERROR' });
  }
});

export default router;