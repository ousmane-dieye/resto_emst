import { CATEGORIES_PLAT, ROLES } from '../config/index.js';

const EMAIL_ESMT_REGEX = /^[\w.-]+@(esmt\.sn|etu\.esmt\.sn)$/i;

export const validateBody = (schema) => (req, res, next) => {
  const errors = [];
  
  for (const [field, rules] of Object.entries(schema)) {
    const value = req.body[field];
    
    if (rules.required && !value && value !== 0) {
      errors.push({ field, message: `${field} est requis` });
      continue;
    }
    
    if (rules.type && value && typeof value !== rules.type) {
      errors.push({ field, message: `${field} doit être de type ${rules.type}` });
    }
    
    if (rules.minLength && value && value.length < rules.minLength) {
      errors.push({ field, message: `${field} doit contenir au moins ${rules.minLength} caractères` });
    }
    
    if (rules.pattern && value && !rules.pattern.test(value)) {
      errors.push({ field, message: rules.message || `${field} invalide` });
    }
    
    if (rules.enum && value && !rules.enum.includes(value)) {
      errors.push({ field, message: `${field} doit être une des valeurs: ${rules.enum.join(', ')}` });
    }

    if (rules.min !== undefined && typeof value === 'number' && value < rules.min) {
      errors.push({ field, message: `${field} doit être >= ${rules.min}` });
    }
    
    if (rules.max !== undefined && typeof value === 'number' && value > rules.max) {
      errors.push({ field, message: `${field} doit être <= ${rules.max}` });
    }
  }
  
  if (errors.length > 0) {
    return res.status(400).json({ error: 'Validation échouée', details: errors, code: 'VALIDATION_ERROR' });
  }
  
  next();
};

export const validateQuery = (schema) => (req, res, next) => {
  const errors = [];
  
  for (const [field, rules] of Object.entries(schema)) {
    const value = req.query[field];
    
    if (rules.required && !value) {
      errors.push({ field, message: `${field} est requis` });
    }
  }
  
  if (errors.length > 0) {
    return res.status(400).json({ error: 'Validation échouée', details: errors, code: 'VALIDATION_ERROR' });
  }
  
  next();
};

export const schemas = {
  inscription: {
    nom: { required: true, type: 'string', minLength: 2 },
    prenom: { required: true, type: 'string', minLength: 2 },
    email: { required: true, type: 'string', pattern: EMAIL_ESMT_REGEX, message: 'Email ESMT invalide' },
    motDePasse: { required: true, type: 'string', minLength: 6 },
    numeroEtudiant: { required: true, type: 'string' },
    classe: { required: true, type: 'string' },
    filiere: { required: true, type: 'string' },
  },
  connexion: {
    email: { required: true, type: 'string' },
    motDePasse: { required: true, type: 'string' },
  },
  plat: {
    nom: { required: true, type: 'string', minLength: 2 },
    description: { required: true, type: 'string' },
    prixFCFA: { required: true, type: 'number', min: 1 },
    categorie: { required: true, enum: Object.values(CATEGORIES_PLAT) },
  },
  commande: {
    platId: { required: true, type: 'string' },
    creneauId: { required: true, type: 'string' },
    methodePaiement: { enum: ['WAVE', 'ESPECE', 'CARTE'] },
  },
  feedback: {
    commandeId: { required: true, type: 'string' },
    noteGout: { required: true, type: 'number', min: 1, max: 5 },
    noteTemperature: { required: true, type: 'number', min: 1, max: 5 },
    notePortion: { required: true, type: 'number', min: 1, max: 5 },
  },
  stock: {
    ingredient: { required: true, type: 'string', minLength: 2 },
    quantite: { required: true, type: 'number', min: 0 },
    unite: { required: true, type: 'string' },
    seuilAlerte: { required: true, type: 'number', min: 0 },
  },
  fournisseur: {
    nom: { required: true, type: 'string', minLength: 2 },
    contact: { required: true, type: 'string' },
    delaiLivraison: { required: true, type: 'number', min: 1 },
  },
  staff: {
    nom: { required: true, type: 'string', minLength: 2 },
    prenom: { required: true, type: 'string', minLength: 2 },
    email: { required: true, type: 'string' },
    role: { required: true, enum: [ROLES.CUISINIER, ROLES.ADMINISTRATEUR, ROLES.GESTIONNAIRE] },
  }
};