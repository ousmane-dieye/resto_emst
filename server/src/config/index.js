import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

export const config = {
  port: process.env.PORT ? parseInt(process.env.PORT) : 3001,
  JWT_SECRET: process.env.JWT_SECRET || 'smartresto_secret_change_in_production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
  jwt: {
    secret: process.env.JWT_SECRET || 'smartresto_secret_change_in_production',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },
  db: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME || 'smartresto'
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173'
  },
  qrCode: {
    expirationMinutes: parseInt(process.env.QR_EXPIRATION_MINUTES) || 120
  },
  pagination: {
    defaultLimit: 20,
    maxLimit: 100
  },
  points: {
    commande: 10,
    feedback: 5
  },
  seuils: {
    BRONZE: 0,
    ARGENT: 200,
    OR: 500,
    PLATINE: 1000
  }
};

export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMINISTRATEUR: 'ADMINISTRATEUR',
  CUISINIER: 'CUISINIER',
  GESTIONNAIRE: 'GESTIONNAIRE',
  ETUDIANT: 'ETUDIANT'
};

export const STATUTS_COMMANDE = {
  EN_ATTENTE: 'EN_ATTENTE',
  CONFIRME: 'CONFIRME',
  EN_PREPARATION: 'EN_PREPARATION',
  PRETE: 'PRETE',
  RETIREE: 'RETIREE',
  ANNULEE: 'ANNULEE'
};

export const CATEGORIES_PLAT = {
  ENTREE: 'entree',
  PLAT_PRINCIPAL: 'plat_principal',
  DESSERT: 'dessert',
  BOISSON: 'boisson'
};