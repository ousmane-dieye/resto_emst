import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

const adminRoles = ['SUPER_ADMIN', 'ADMINISTRATEUR'];
const cuisineRoles = [...adminRoles, 'CUISINIER'];

router.get('/', (req, res) => {
  try {
    const { categorie, disponible } = req.query;
    let plats = [...db.plats];
    
    if (categorie && categorie !== 'tous') {
      plats = plats.filter(p => p.categorie === categorie);
    }
    
    if (disponible === 'true') {
      plats = plats.filter(p => p.estDisponible);
    }
    
    res.json(plats);
  } catch (error) {
    console.error('Get plats error:', error);
    res.status(500).json({ error: 'Erreur serveur', code: 'SERVER_ERROR' });
  }
});

router.post('/', authMiddleware(adminRoles), (req, res) => {
  try {
    const { nom, description, prixFCFA, allergenes, categorie, emoji } = req.body;
    
    if (!nom || !prixFCFA) {
      return res.status(400).json({ error: 'Nom et prix requis', code: 'MISSING_FIELDS' });
    }
    
    const plat = {
      id: uuidv4(),
      nom,
      description: description || '',
      prixFCFA,
      allergenes: allergenes || [],
      estDisponible: true,
      estRepasEco: false,
      noteMoyenne: 0,
      categorie: categorie || 'plat_principal',
      emoji: emoji || '🍽',
    };
    
    db.plats.push(plat);
    res.status(201).json(plat);
  } catch (error) {
    console.error('Create plat error:', error);
    res.status(500).json({ error: 'Erreur serveur', code: 'SERVER_ERROR' });
  }
});

router.put('/:id', authMiddleware(cuisineRoles), (req, res) => {
  try {
    const { id } = req.params;
    const idx = db.plats.findIndex(p => p.id === id);
    
    if (idx === -1) {
      return res.status(404).json({ error: 'Plat introuvable', code: 'PLAT_NOT_FOUND' });
    }
    
    db.plats[idx] = { ...db.plats[idx], ...req.body };
    res.json(db.plats[idx]);
  } catch (error) {
    console.error('Update plat error:', error);
    res.status(500).json({ error: 'Erreur serveur', code: 'SERVER_ERROR' });
  }
});

router.delete('/:id', authMiddleware(adminRoles), (req, res) => {
  try {
    const { id } = req.params;
    const idx = db.plats.findIndex(p => p.id === id);
    
    if (idx === -1) {
      return res.status(404).json({ error: 'Plat introuvable', code: 'PLAT_NOT_FOUND' });
    }
    
    db.plats.splice(idx, 1);
    res.json({ message: 'Plat supprimé' });
  } catch (error) {
    console.error('Delete plat error:', error);
    res.status(500).json({ error: 'Erreur serveur', code: 'SERVER_ERROR' });
  }
});

export default router;