import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

const adminRoles = ['SUPER_ADMIN', 'ADMINISTRATEUR'];
const cuisineRoles = [...adminRoles, 'CUISINIER'];

router.get('/', async (req, res) => {
  try {
    const { categorie, disponible } = req.query;
    let sql = 'SELECT * FROM plats';
    const params = [];
    const conditions = [];
    
    if (categorie && categorie !== 'tous') {
      conditions.push('categorie = ?');
      params.push(categorie);
    }
    
    if (disponible === 'true') {
      conditions.push('estDisponible = TRUE');
    }
    
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    
    const plats = await query(sql, params);
    res.json(plats);
  } catch (error) {
    console.error('Get plats error:', error);
    res.status(500).json({ error: 'Erreur serveur', code: 'SERVER_ERROR' });
  }
});

router.post('/', authMiddleware(adminRoles), async (req, res) => {
  try {
    const { nom, description, prixFCFA, allergenes, categorie, emoji } = req.body;
    
    if (!nom || !prixFCFA) {
      return res.status(400).json({ error: 'Nom et prix requis', code: 'MISSING_FIELDS' });
    }
    
    const id = uuidv4();
    await query(
      `INSERT INTO plats (id, nom, description, prixFCFA, allergenes, estDisponible, estRepasEco, noteMoyenne, categorie, emoji, createdAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, nom, description || '', prixFCFA, JSON.stringify(allergenes || []), true, false, 0, categorie || 'plat_principal', emoji || '🍽', new Date()]
    );
    
    const [plats] = await query('SELECT * FROM plats WHERE id = ?', [id]);
    res.status(201).json(plats[0]);
  } catch (error) {
    console.error('Create plat error:', error);
    res.status(500).json({ error: 'Erreur serveur', code: 'SERVER_ERROR' });
  }
});

router.put('/:id', authMiddleware(cuisineRoles), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const keys = Object.keys(updates);
    const values = Object.values(updates);
    
    if (keys.length === 0) {
      return res.status(400).json({ error: 'Aucune donnée à mettre à jour', code: 'MISSING_FIELDS' });
    }
    
    const set = keys.map(k => `${k} = ?`).join(', ');
    values.push(id);
    
    await query(`UPDATE plats SET ${set} WHERE id = ?`, values);
    
    const [plats] = await query('SELECT * FROM plats WHERE id = ?', [id]);
    if (!plats[0]) {
      return res.status(404).json({ error: 'Plat introuvable', code: 'PLAT_NOT_FOUND' });
    }
    
    res.json(plats[0]);
  } catch (error) {
    console.error('Update plat error:', error);
    res.status(500).json({ error: 'Erreur serveur', code: 'SERVER_ERROR' });
  }
});

router.delete('/:id', authMiddleware(adminRoles), async (req, res) => {
  try {
    const { id } = req.params;
    
    const [plats] = await query('SELECT * FROM plats WHERE id = ?', [id]);
    if (!plats[0]) {
      return res.status(404).json({ error: 'Plat introuvable', code: 'PLAT_NOT_FOUND' });
    }
    
    await query('DELETE FROM plats WHERE id = ?', [id]);
    res.json({ message: 'Plat supprimé' });
  } catch (error) {
    console.error('Delete plat error:', error);
    res.status(500).json({ error: 'Erreur serveur', code: 'SERVER_ERROR' });
  }
});

export default router;