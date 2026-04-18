import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { nom, prenom, email, motDePasse, numeroEtudiant, classe, filiere, allergenes, autresRestrictions } = req.body;
    
    if (!email.match(/@esmt\.(sn|etu\.esmt\.sn)$/)) {
      return res.status(400).json({ error: 'Email institutionnel ESMT requis', code: 'INVALID_EMAIL' });
    }
    
    const [existing] = await query("SELECT * FROM utilisateurs WHERE email = ?", [email]);
    if (existing) {
      return res.status(400).json({ error: 'Email déjà utilisé', code: 'EMAIL_EXISTS' });
    }
    
    const id = uuidv4();
    const hash = await bcrypt.hash(motDePasse, 10);
    
    await query(
      `INSERT INTO utilisateurs (id, nom, prenom, email, motDePasse, role, actif, emailVerifie, dateCreation, numeroEtudiant, classe, filiere, allergenes, autresRestrictions, pointsESMT, niveauFidelite) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, nom, prenom, email, hash, 'ETUDIANT', true, true, new Date(), numeroEtudiant, classe, filiere, JSON.stringify(allergenes || []), autresRestrictions || '', 100, 'BRONZE']
    );
    
    const [user] = await query("SELECT * FROM utilisateurs WHERE id = ?", [id]);
    delete user.motDePasse;
    
    res.status(201).json({ message: 'Compte créé avec succès', utilisateur: user });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Erreur serveur', code: 'SERVER_ERROR' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, motDePasse } = req.body;
    
    const [users] = await query("SELECT * FROM utilisateurs WHERE email = ?", [email]);
    const user = users[0];
    
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
    
    delete user.motDePasse;
    res.json({ token, utilisateur: user });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Erreur serveur', code: 'SERVER_ERROR' });
  }
});

router.get('/me', authMiddleware(), async (req, res) => {
  try {
    const [users] = await query("SELECT * FROM utilisateurs WHERE id = ?", [req.user.id]);
    const user = users[0];
    
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur introuvable', code: 'USER_NOT_FOUND' });
    }
    
    delete user.motDePasse;
    res.json(user);
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ error: 'Erreur serveur', code: 'SERVER_ERROR' });
  }
});

router.post('/logout', authMiddleware(), (req, res) => {
  res.json({ message: 'Déconnexion réussie' });
});

export default router;