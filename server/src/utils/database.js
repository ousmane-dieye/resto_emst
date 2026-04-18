import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '../../data/database.json');

let db = null;

function ensureDataDir() {
  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

function getDefaultData() {
  return {
    utilisateurs: [],
    plats: [],
    commandes: [],
    paiements: [],
    feedbacks: [],
    stocks: [],
    fournisseurs: [],
    creneaux: [],
    notifications: [],
    pointsESMT: []
  };
}

export function loadDatabase() {
  ensureDataDir();
  if (fs.existsSync(DB_PATH)) {
    try {
      const data = fs.readFileSync(DB_PATH, 'utf-8');
      db = JSON.parse(data);
      console.log('✓ Base de données chargée');
    } catch (err) {
      console.error('✗ Erreur chargement DB:', err.message);
      db = getDefaultData();
    }
  } else {
    db = getDefaultData();
    initializeDefaultData();
    saveDatabase();
    console.log('✓ Nouvelle base de données créée');
  }
  return db;
}

function initializeDefaultData() {
  db.plats = [
    { id: uuidv4(), nom: 'Thiéboudienne', description: 'Riz au poisson sénégalais', prixFCFA: 1500, allergenes: ['poisson'], estDisponible: true, estRepasEco: false, noteMoyenne: 4.7, categorie: 'plat_principal', emoji: '🐟', createdAt: new Date() },
    { id: uuidv4(), nom: 'Yassa Poulet', description: 'Poulet mariné aux oignons et citron', prixFCFA: 1200, allergenes: [], estDisponible: true, estRepasEco: false, noteMoyenne: 4.5, categorie: 'plat_principal', emoji: '🍗', createdAt: new Date() },
    { id: uuidv4(), nom: 'Mafé', description: 'Ragoût à la pâte d\'arachide', prixFCFA: 1000, allergenes: ['arachides'], estDisponible: true, estRepasEco: false, noteMoyenne: 4.3, categorie: 'plat_principal', emoji: '🥜', createdAt: new Date() },
    { id: uuidv4(), nom: 'Salade Composée', description: 'Salade fraîche de saison', prixFCFA: 500, allergenes: [], estDisponible: true, estRepasEco: false, noteMoyenne: 4.0, categorie: 'entree', emoji: '🥗', createdAt: new Date() },
    { id: uuidv4(), nom: 'Jus de Bissap', description: 'Jus d\'hibiscus maison', prixFCFA: 300, allergenes: [], estDisponible: true, estRepasEco: false, noteMoyenne: 4.8, categorie: 'boisson', emoji: '🍹', createdAt: new Date() },
    { id: uuidv4(), nom: 'Repas Eco', description: 'Plat du jour anti-gaspillage -30%', prixFCFA: 700, allergenes: [], estDisponible: true, estRepasEco: true, noteMoyenne: 4.1, categorie: 'plat_principal', emoji: '♻️', createdAt: new Date() },
  ];
  db.stocks = [
    { id: uuidv4(), ingredient: 'Riz', quantite: 50, unite: 'kg', seuilAlerte: 10, estCritique: false, dernierMaj: new Date().toISOString() },
    { id: uuidv4(), ingredient: 'Poisson', quantite: 8, unite: 'kg', seuilAlerte: 5, estCritique: false, dernierMaj: new Date().toISOString() },
    { id: uuidv4(), ingredient: 'Poulet', quantite: 4, unite: 'kg', seuilAlerte: 5, estCritique: true, dernierMaj: new Date().toISOString() },
    { id: uuidv4(), ingredient: 'Oignons', quantite: 15, unite: 'kg', seuilAlerte: 3, estCritique: false, dernierMaj: new Date().toISOString() },
    { id: uuidv4(), ingredient: 'Tomates', quantite: 2, unite: 'kg', seuilAlerte: 3, estCritique: true, dernierMaj: new Date().toISOString() },
    { id: uuidv4(), ingredient: 'Pâte d\'arachide', quantite: 6, unite: 'kg', seuilAlerte: 2, estCritique: false, dernierMaj: new Date().toISOString() },
  ];
  db.fournisseurs = [
    { id: uuidv4(), nom: 'Marché Sandaga', contact: '+221 77 123 45 67', delaiLivraison: 1, ingredientsFournis: ['Légumes', 'Poisson', 'Viande'], createdAt: new Date() },
    { id: uuidv4(), nom: 'SEDIMA', contact: '+221 33 456 78 90', delaiLivraison: 2, ingredientsFournis: ['Poulet', 'Oeufs'], createdAt: new Date() },
  ];
  db.creneaux = [
    { id: uuidv4(), heureDebut: '07:30', heureFin: '09:00', capaciteMax: 80, nbReservations: 23, estCreneauCalme: false, bonusPoints: 5 },
    { id: uuidv4(), heureDebut: '09:00', heureFin: '10:30', capaciteMax: 80, nbReservations: 12, estCreneauCalme: true, bonusPoints: 20 },
    { id: uuidv4(), heureDebut: '12:00', heureFin: '13:30', capaciteMax: 150, nbReservations: 134, estCreneauCalme: false, bonusPoints: 5 },
    { id: uuidv4(), heureDebut: '13:30', heureFin: '15:00', capaciteMax: 150, nbReservations: 45, estCreneauCalme: true, bonusPoints: 15 },
  ];
}

export function saveDatabase() {
  if (!db) return;
  ensureDataDir();
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('✗ Erreur sauvegarde DB:', err.message);
  }
}

export function getDb() {
  if (!db) loadDatabase();
  return db;
}

export function setDb(newDb) {
  db = newDb;
}