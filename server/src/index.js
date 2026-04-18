import dotenv from 'dotenv';
dotenv.config();

const PORT = parseInt(process.env.PORT) || 3001;

import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

import { config } from './config/index.js';
import { initDb, query, closeDb } from './config/database.js';
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

app.use(cors({
  origin: process.env.CORS_ORIGIN === '*' ? true : process.env.CORS_ORIGIN || false,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

const initSuperAdmin = async () => {
  try {
    const [admins] = await query("SELECT * FROM utilisateurs WHERE role = 'SUPER_ADMIN' LIMIT 1");
    
    if (!admins || admins.length === 0) {
      const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10);
      await query(
        "INSERT INTO utilisateurs (id, nom, prenom, email, motDePasse, role, actif, niveauAcces, estSuperAdmin, dateCreation) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [uuidv4(), 'Admin', 'Super', process.env.ADMIN_EMAIL || 'admin@esmt.sn', hash, 'SUPER_ADMIN', true, 'SUPER', true, new Date()]
      );
      
      const hashCuisinier = await bcrypt.hash(process.env.CHEF_PASSWORD || 'cuisine123', 10);
      await query(
        "INSERT INTO utilisateurs (id, nom, prenom, email, motDePasse, role, actif, poste, dateCreation) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [uuidv4(), 'Diallo', 'Mamadou', process.env.CHEF_EMAIL || 'cuisinier@esmt.sn', hashCuisinier, 'CUISINIER', true, 'Chef Principal', new Date()]
      );
      
      console.log('Super admin initialized: admin@esmt.sn');
      console.log('Cuisinier initialized: cuisinier@esmt.sn');
    }
  } catch (error) {
    console.error('Error initializing super admin:', error);
  }
};

const startServer = async () => {
  try {
    await initDb(config);
    console.log('Database connected');
    
    await initSuperAdmin();
    
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
    
    app.listen(PORT, () => {
      console.log(`SmartResto Backend running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

process.on('SIGINT', async () => {
  await closeDb();
  process.exit(0);
});

startServer();