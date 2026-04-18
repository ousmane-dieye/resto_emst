import express from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

const adminRoles = ['SUPER_ADMIN', 'ADMINISTRATEUR'];

router.get('/', authMiddleware(adminRoles), (req, res) => {
  try {
    const users = db.utilisateurs.map(({ motDePasse, ...u }) => u);
    res.json(users);
  } catch (error) {
    console.error('Get utilisateurs error:', error);
    res.status(500).json({ error: 'Erreur serveur', code: 'SERVER_ERROR' });
  }
});

router.post('/staff', authMiddleware(adminRoles), async (req, res) => {
  try {
    const { nom, prenom, email, role, poste } = req.body;
    
    if (!nom || !prenom || !email || !role) {
      return res.status(400).json({ error: 'Champs requis', code: 'MISSING_FIELDS' });
    }
    
    const validRoles = ['CUISINIER', 'ADMINISTRATEUR', 'GESTIONNAIRE'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Rôle invalide', code: 'INVALID_ROLE' });
    }
    
    const motDePasse = Math.random().toString(36).slice(-8);
    const hash = await bcrypt.hash(motDePasse, 10);
    
    const staff = {
      id: uuidv4(),
      nom,
      prenom,
      email,
      motDePasse: hash,
      role,
      poste: poste || '',
      actif: true,
      dateCreation: new Date(),
    };
    
    db.utilisateurs.push(staff);
    res.status(201).json({ ...staff, motDePasseTemp: motDePasse, motDePasse: undefined });
  } catch (error) {
    console.error('Create staff error:', error);
    res.status(500).json({ error: 'Erreur serveur', code: 'SERVER_ERROR' });
  }
});

router.put('/:id/toggle', authMiddleware(['SUPER_ADMIN']), (req, res) => {
  try {
    const { id } = req.params;
    const user = db.utilisateurs.find(u => u.id === id);
    
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur introuvable', code: 'USER_NOT_FOUND' });
    }
    
    if (user.id === req.user.id) {
      return res.status(400).json({ error: 'Impossible de se désactiver', code: 'SELF_DISABLE' });
    }
    
    user.actif = !user.actif;
    res.json({ actif: user.actif });
  } catch (error) {
    console.error('Toggle user error:', error);
    res.status(500).json({ error: 'Erreur serveur', code: 'SERVER_ERROR' });
  }
});

export default router;