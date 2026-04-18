import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

const adminRoles = ['SUPER_ADMIN', 'ADMINISTRATEUR'];

router.get('/', authMiddleware(adminRoles), (req, res) => {
  try {
    res.json(db.fournisseurs);
  } catch (error) {
    console.error('Get fournisseurs error:', error);
    res.status(500).json({ error: 'Erreur serveur', code: 'SERVER_ERROR' });
  }
});

router.post('/', authMiddleware(adminRoles), (req, res) => {
  try {
    const { nom, contact, delaiLivraison, ingredientsFournis } = req.body;
    
    if (!nom || !contact) {
      return res.status(400).json({ error: 'Nom et contact requis', code: 'MISSING_FIELDS' });
    }
    
    const fournisseur = {
      id: uuidv4(),
      nom,
      contact,
      delaiLivraison: delaiLivraison || 1,
      ingredientsFournis: ingredientsFournis || [],
    };
    
    db.fournisseurs.push(fournisseur);
    res.status(201).json(fournisseur);
  } catch (error) {
    console.error('Create fournisseur error:', error);
    res.status(500).json({ error: 'Erreur serveur', code: 'SERVER_ERROR' });
  }
});

router.put('/:id', authMiddleware(adminRoles), (req, res) => {
  try {
    const { id } = req.params;
    const idx = db.fournisseurs.findIndex(f => f.id === id);
    
    if (idx === -1) {
      return res.status(404).json({ error: 'Fournisseur introuvable', code: 'NOT_FOUND' });
    }
    
    db.fournisseurs[idx] = { ...db.fournisseurs[idx], ...req.body };
    res.json(db.fournisseurs[idx]);
  } catch (error) {
    console.error('Update fournisseur error:', error);
    res.status(500).json({ error: 'Erreur serveur', code: 'SERVER_ERROR' });
  }
});

router.delete('/:id', authMiddleware(adminRoles), (req, res) => {
  try {
    const { id } = req.params;
    const idx = db.fournisseurs.findIndex(f => f.id === id);
    
    if (idx === -1) {
      return res.status(404).json({ error: 'Fournisseur introuvable', code: 'NOT_FOUND' });
    }
    
    db.fournisseurs.splice(idx, 1);
    res.json({ message: 'Fournisseur supprimé' });
  } catch (error) {
    console.error('Delete fournisseur error:', error);
    res.status(500).json({ error: 'Erreur serveur', code: 'SERVER_ERROR' });
  }
});

export default router;