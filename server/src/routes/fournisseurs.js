import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

const adminRoles = ['SUPER_ADMIN', 'ADMINISTRATEUR'];

router.get('/', authMiddleware(adminRoles), async (req, res) => {
  try {
    const fournisseurs = await query('SELECT * FROM fournisseurs ORDER BY nom');
    res.json(fournisseurs);
  } catch (error) {
    console.error('Get fournisseurs error:', error);
    res.status(500).json({ error: 'Erreur serveur', code: 'SERVER_ERROR' });
  }
});

router.post('/', authMiddleware(adminRoles), async (req, res) => {
  try {
    const { nom, contact, delaiLivraison, ingredientsFournis } = req.body;
    
    if (!nom) {
      return res.status(400).json({ error: 'Nom requis', code: 'MISSING_FIELDS' });
    }
    
    const id = uuidv4();
    await query(
      `INSERT INTO fournisseurs (id, nom, contact, delaiLivraison, ingredientsFournis, createdAt) VALUES (?, ?, ?, ?, ?, ?)`,
      [id, nom, contact || '', delaiLivraison || 1, JSON.stringify(ingredientsFournis || []), new Date()]
    );
    
    const [fournisseurs] = await query('SELECT * FROM fournisseurs WHERE id = ?', [id]);
    res.status(201).json(fournisseurs[0]);
  } catch (error) {
    console.error('Create fournisseur error:', error);
    res.status(500).json({ error: 'Erreur serveur', code: 'SERVER_ERROR' });
  }
});

router.put('/:id', authMiddleware(adminRoles), async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, contact, delaiLivraison, ingredientsFournis } = req.body;
    
    const updates = [];
    const params = [];
    
    if (nom !== undefined) { updates.push('nom = ?'); params.push(nom); }
    if (contact !== undefined) { updates.push('contact = ?'); params.push(contact); }
    if (delaiLivraison !== undefined) { updates.push('delaiLivraison = ?'); params.push(delaiLivraison); }
    if (ingredientsFournis !== undefined) { updates.push('ingredientsFournis = ?'); params.push(JSON.stringify(ingredientsFournis)); }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'Aucune donnée à mettre à jour', code: 'MISSING_FIELDS' });
    }
    
    params.push(id);
    
    await query(`UPDATE fournisseurs SET ${updates.join(', ')} WHERE id = ?`, params);
    
    const [fournisseurs] = await query('SELECT * FROM fournisseurs WHERE id = ?', [id]);
    if (!fournisseurs[0]) {
      return res.status(404).json({ error: 'Fournisseur introuvable', code: 'FOURNISSEUR_NOT_FOUND' });
    }
    
    res.json(fournisseurs[0]);
  } catch (error) {
    console.error('Update fournisseur error:', error);
    res.status(500).json({ error: 'Erreur serveur', code: 'SERVER_ERROR' });
  }
});

router.delete('/:id', authMiddleware(adminRoles), async (req, res) => {
  try {
    const { id } = req.params;
    
    const [fournisseurs] = await query('SELECT * FROM fournisseurs WHERE id = ?', [id]);
    if (!fournisseurs[0]) {
      return res.status(404).json({ error: 'Fournisseur introuvable', code: 'FOURNISSEUR_NOT_FOUND' });
    }
    
    await query('DELETE FROM fournisseurs WHERE id = ?', [id]);
    res.json({ message: 'Fournisseur supprimé' });
  } catch (error) {
    console.error('Delete fournisseur error:', error);
    res.status(500).json({ error: 'Erreur serveur', code: 'SERVER_ERROR' });
  }
});

export default router;