import express from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

const adminRoles = ['SUPER_ADMIN', 'ADMINISTRATEUR'];

router.get('/', authMiddleware(adminRoles), async (req, res) => {
  try {
    const utilisateurs = await query("SELECT id, nom, prenom, email, role, actif, dateCreation, numeroEtudiant, classe, filiere, pointsESMT, niveauFidelite FROM utilisateurs ORDER BY dateCreation DESC");
    res.json(utilisateurs);
  } catch (error) {
    console.error('Get utilisateurs error:', error);
    res.status(500).json({ error: 'Erreur serveur', code: 'SERVER_ERROR' });
  }
});

router.post('/staff', authMiddleware(adminRoles), async (req, res) => {
  try {
    const { nom, prenom, email, role, poste } = req.body;
    
    if (!nom || !prenom || !email || !role) {
      return res.status(400).json({ error: 'Champs requis manquants', code: 'MISSING_FIELDS' });
    }
    
    const [existing] = await query("SELECT * FROM utilisateurs WHERE email = ?", [email]);
    if (existing) {
      return res.status(400).json({ error: 'Email déjà utilisé', code: 'EMAIL_EXISTS' });
    }
    
    const motDePasse = Math.random().toString(36).slice(-8);
    const hash = await bcrypt.hash(motDePasse, 10);
    
    const id = uuidv4();
    await query(
      `INSERT INTO utilisateurs (id, nom, prenom, email, motDePasse, role, actif, poste, dateCreation) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, nom, prenom, email, hash, role, true, poste || '', new Date()]
    );
    
    const [users] = await query('SELECT * FROM utilisateurs WHERE id = ?', [id]);
    delete users[0].motDePasse;
    
    res.status(201).json({ ...users[0], motDePasseTemp: motDePasse });
  } catch (error) {
    console.error('Create staff error:', error);
    res.status(500).json({ error: 'Erreur serveur', code: 'SERVER_ERROR' });
  }
});

router.put('/:id/toggle', authMiddleware(['SUPER_ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    
    const [users] = await query('SELECT * FROM utilisateurs WHERE id = ?', [id]);
    if (!users[0]) {
      return res.status(404).json({ error: 'Utilisateur introuvable', code: 'USER_NOT_FOUND' });
    }
    
    const newActif = !users[0].actif;
    await query('UPDATE utilisateurs SET actif = ? WHERE id = ?', [newActif, id]);
    
    res.json({ actif: newActif });
  } catch (error) {
    console.error('Toggle user error:', error);
    res.status(500).json({ error: 'Erreur serveur', code: 'SERVER_ERROR' });
  }
});

export default router;