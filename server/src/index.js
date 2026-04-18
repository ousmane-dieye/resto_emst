import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

import { config } from './config/index.js';
import { db } from './config/database.js';

import authRoutes from './routes/auth.js';
import platsRoutes from './routes/plats.js';
import commandesRoutes from './routes/commandes.js';
import creneauxRoutes from './routes/creneaux.js';
import stocksRoutes from './routes/stocks.js';
import fournisseursRoutes from './routes/fournisseurs.js';
import feedbacksRoutes from './routes/feedbacks.js';
import utilisateursRoutes from './routes/utilisateurs.js';
import notificationsRoutes from './routes/notifications.js';
import statsRoutes from './routes/stats.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

const initSuperAdmin = async () => {
  const adminExists = db.utilisateurs.find(u => u.role === 'SUPER_ADMIN');
  if (!adminExists) {
    const hash = await bcrypt.hash('admin123', 10);
    db.utilisateurs.push({
      id: uuidv4(),
      nom: 'Admin',
      prenom: 'Super',
      email: 'admin@esmt.sn',
      motDePasse: hash,
      role: 'SUPER_ADMIN',
      actif: true,
      dateCreation: new Date(),
      niveauAcces: 'SUPER',
      estSuperAdmin: true,
    });
    
    const hashCuisinier = await bcrypt.hash('cuisine123', 10);
    db.utilisateurs.push({
      id: uuidv4(),
      nom: 'Diallo',
      prenom: 'Mamadou',
      email: 'cuisinier@esmt.sn',
      motDePasse: hashCuisinier,
      role: 'CUISINIER',
      actif: true,
      dateCreation: new Date(),
      poste: 'Chef Principal',
    });
    
    console.log('Super admin initialized: admin@esmt.sn / admin123');
    console.log('Cuisinier initialized: cuisinier@esmt.sn / cuisine123');
  }
};

app.use('/api/auth', authRoutes);
app.use('/api/plats', platsRoutes);
app.use('/api/commandes', commandesRoutes);
app.use('/api/creneaux', creneauxRoutes);
app.use('/api/stocks', stocksRoutes);
app.use('/api/fournisseurs', fournisseursRoutes);
app.use('/api/feedbacks', feedbacksRoutes);
app.use('/api/utilisateurs', utilisateursRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/stats', statsRoutes);

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Erreur interne', code: 'INTERNAL_ERROR' });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route non trouvée', code: 'NOT_FOUND' });
});

app.listen(config.PORT, () => {
  initSuperAdmin();
  console.log(`SmartResto Backend running on http://localhost:${config.PORT}`);
});