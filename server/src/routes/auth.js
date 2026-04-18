import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/database.js';
import { config } from '../config/index.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

export const registerSchema = {
  nom: { required: true, type: 'string', minLength: 2 },
  prenom: { required: true, type: 'string', minLength: 2 },
  email: { required: true, type: 'string', pattern: /@esmt\.(sn|etu\.esmt\.sn)$/, message: 'Email ESMT requis' },
  motDePasse: { required: true, type: 'string', minLength: 6 },
};

export const loginSchema = {
  email: { required: true, type: 'string' },
  motDePasse: { required: true, type: 'string' },
};

router.post('/register', async (req, res) => {
  try {
    const { nom, prenom, email, motDePasse, numeroEtudiant, classe, filiere, allergenes, autresRestrictions } = req.body;
    
    if (!email.match(/@esmt\.(sn|etu\.esmt\.sn)$/)) {
      return res.status(400).json({ error: 'Email institutionnel ESMT requis', code: 'INVALID_EMAIL' });
    }
    
    if (db.utilisateurs.find(u => u.email === email)) {
      return res.status(400).json({ error: 'Email déjà utilisé', code: 'EMAIL_EXISTS' });
    }
    
    const hash = await bcrypt.hash(motDePasse, 10);
    const etudiant = {
      id: uuidv4(),
      nom,
      prenom,
      email,
      motDePasse: hash,
      role: 'ETUDIANT',
      actif: true,
      emailVerifie: true,
      dateCreation: new Date(),
      numeroEtudiant,
      classe,
      filiere,
      allergenes: allergenes || [],
      autresRestrictions: autresRestrictions || '',
      pointsESMT: 100,
      niveauFidelite: 'BRONZE',
    };
    
    db.utilisateurs.push(etudiant);
    const { motDePasse: _, ...safe } = etudiant;
    
    res.status(201).json({ message: 'Compte créé avec succès', utilisateur: safe });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Erreur serveur', code: 'SERVER_ERROR' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, motDePasse } = req.body;
    
    const user = db.utilisateurs.find(u => u.email === email);
    if (!user || !await bcrypt.compare(motDePasse, user.motDePasse)) {
      return res.status(401).json({ error: 'Identifiants incorrects', code: 'INVALID_CREDENTIALS' });
    }
    
    if (!user.actif) {
      return res.status(403).json({ error: 'Compte désactivé', code: 'ACCOUNT_DISABLED' });
    }
    
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, nom: user.nom, prenom: user.prenom },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
    
    const { motDePasse: _, ...safe } = user;
    res.json({ token, utilisateur: safe });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Erreur serveur', code: 'SERVER_ERROR' });
  }
});

router.get('/me', authMiddleware(), (req, res) => {
  const user = db.utilisateurs.find(u => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'Utilisateur introuvable', code: 'USER_NOT_FOUND' });
  }
  const { motDePasse: _, ...safe } = user;
  res.json(safe);
});

export default router;