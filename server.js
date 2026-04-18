const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = 'smartresto_esmt_secret_2024';

// ─── IN-MEMORY DATABASE ─────────────────────────────────────────
let db = {
  utilisateurs: [],
  plats: [
    { id: uuidv4(), nom: 'Thiéboudienne', description: 'Riz au poisson sénégalais', prixFCFA: 1500, allergenes: ['poisson'], estDisponible: true, estRepasEco: false, noteMoyenne: 4.7, categorie: 'plat_principal' },
    { id: uuidv4(), nom: 'Yassa Poulet', description: 'Poulet mariné aux oignons et citron', prixFCFA: 1200, allergenes: [], estDisponible: true, estRepasEco: false, noteMoyenne: 4.5, categorie: 'plat_principal' },
    { id: uuidv4(), nom: 'Mafé', description: 'Ragoût à la pâte d\'arachide', prixFCFA: 1000, allergenes: ['arachides'], estDisponible: true, estRepasEco: false, noteMoyenne: 4.3, categorie: 'plat_principal' },
    { id: uuidv4(), nom: 'Salade Composée', description: 'Salade fraîche de saison', prixFCFA: 500, allergenes: [], estDisponible: true, estRepasEco: false, noteMoyenne: 4.0, categorie: 'entree' },
    { id: uuidv4(), nom: 'Jus de Bissap', description: 'Jus d\'hibiscus maison', prixFCFA: 300, allergenes: [], estDisponible: true, estRepasEco: false, noteMoyenne: 4.8, categorie: 'boisson' },
    { id: uuidv4(), nom: 'Repas Eco', description: 'Plat du jour anti-gaspillage -30%', prixFCFA: 700, allergenes: [], estDisponible: true, estRepasEco: true, noteMoyenne: 4.1, categorie: 'plat_principal' },
  ],
  commandes: [],
  paiements: [],
  feedbacks: [],
  stocks: [
    { id: uuidv4(), ingredient: 'Riz', quantite: 50, unite: 'kg', seuilAlerte: 10, estCritique: false, derniereMaj: new Date() },
    { id: uuidv4(), ingredient: 'Poisson', quantite: 8, unite: 'kg', seuilAlerte: 5, estCritique: false, derniereMaj: new Date() },
    { id: uuidv4(), ingredient: 'Poulet', quantite: 4, unite: 'kg', seuilAlerte: 5, estCritique: true, derniereMaj: new Date() },
    { id: uuidv4(), ingredient: 'Oignons', quantite: 15, unite: 'kg', seuilAlerte: 3, estCritique: false, derniereMaj: new Date() },
    { id: uuidv4(), ingredient: 'Tomates', quantite: 2, unite: 'kg', seuilAlerte: 3, estCritique: true, derniereMaj: new Date() },
    { id: uuidv4(), ingredient: 'Pâte d\'arachide', quantite: 6, unite: 'kg', seuilAlerte: 2, estCritique: false, derniereMaj: new Date() },
  ],
  fournisseurs: [
    { id: uuidv4(), nom: 'Marché Sandaga', contact: '+221 77 123 45 67', delaiLivraison: 1, ingredientsFournis: ['Légumes', 'Poisson', 'Viande'] },
    { id: uuidv4(), nom: 'SEDIMA', contact: '+221 33 456 78 90', delaiLivraison: 2, ingredientsFournis: ['Poulet', 'Oeufs'] },
  ],
  creneaux: [
    { id: uuidv4(), heureDebut: '07:30', heureFin: '09:00', capaciteMax: 80, nbReservations: 23, estCreneauCalme: false, bonusPoints: 5 },
    { id: uuidv4(), heureDebut: '09:00', heureFin: '10:30', capaciteMax: 80, nbReservations: 12, estCreneauCalme: true, bonusPoints: 20 },
    { id: uuidv4(), heureDebut: '12:00', heureFin: '13:30', capaciteMax: 150, nbReservations: 134, estCreneauCalme: false, bonusPoints: 5 },
    { id: uuidv4(), heureDebut: '13:30', heureFin: '15:00', capaciteMax: 150, nbReservations: 45, estCreneauCalme: true, bonusPoints: 15 },
  ],
  notifications: [],
  pointsESMT: [],
};

// Créer un super admin par défaut
(async () => {
  const hash = await bcrypt.hash('admin123', 10);
  db.utilisateurs.push({
    id: uuidv4(), nom: 'Admin', prenom: 'Super', email: 'admin@esmt.sn',
    motDePasse: hash, role: 'SUPER_ADMIN', actif: true, dateCreation: new Date(),
    niveauAcces: 'SUPER', estSuperAdmin: true
  });
  const hashCuisinier = await bcrypt.hash('cuisine123', 10);
  db.utilisateurs.push({
    id: uuidv4(), nom: 'Diallo', prenom: 'Mamadou', email: 'cuisinier@esmt.sn',
    motDePasse: hashCuisinier, role: 'CUISINIER', actif: true, dateCreation: new Date(),
    poste: 'Chef Principal', estActif: true
  });
})();

// ─── MIDDLEWARE AUTH ─────────────────────────────────────────────
const auth = (roles = []) => (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token manquant' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    if (roles.length && !roles.includes(decoded.role)) {
      return res.status(403).json({ error: 'Accès refusé' });
    }
    next();
  } catch {
    res.status(401).json({ error: 'Token invalide' });
  }
};

// ─── AUTH ROUTES ─────────────────────────────────────────────────
app.post('/api/auth/inscription', async (req, res) => {
  const { nom, prenom, email, motDePasse, numeroEtudiant, classe, filiere, allergenes, autresRestrictions } = req.body;
  if (!email.endsWith('@esmt.sn') && !email.endsWith('@etu.esmt.sn')) {
    return res.status(400).json({ error: 'Email institutionnel ESMT requis' });
  }
  if (db.utilisateurs.find(u => u.email === email)) {
    return res.status(400).json({ error: 'Email déjà utilisé' });
  }
  const hash = await bcrypt.hash(motDePasse, 10);
  const etudiant = {
    id: uuidv4(), nom, prenom, email, motDePasse: hash,
    role: 'ETUDIANT', actif: true, emailVerifie: true, dateCreation: new Date(),
    numeroEtudiant, classe, filiere,
    allergenes: allergenes || [],
    autresRestrictions: autresRestrictions || '',
    pointsESMT: 100, niveauFidelite: 'BRONZE'
  };
  db.utilisateurs.push(etudiant);
  const { motDePasse: _, ...safe } = etudiant;
  res.status(201).json({ message: 'Compte créé avec succès', utilisateur: safe });
});

app.post('/api/auth/connexion', async (req, res) => {
  const { email, motDePasse } = req.body;
  const user = db.utilisateurs.find(u => u.email === email);
  if (!user || !await bcrypt.compare(motDePasse, user.motDePasse)) {
    return res.status(401).json({ error: 'Identifiants incorrects' });
  }
  if (!user.actif) return res.status(403).json({ error: 'Compte désactivé' });
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role, nom: user.nom, prenom: user.prenom }, JWT_SECRET, { expiresIn: '24h' });
  const { motDePasse: _, ...safe } = user;
  res.json({ token, utilisateur: safe });
});

app.get('/api/auth/me', auth(), (req, res) => {
  const user = db.utilisateurs.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });
  const { motDePasse: _, ...safe } = user;
  res.json(safe);
});

// ─── PLATS ROUTES ────────────────────────────────────────────────
app.get('/api/plats', (req, res) => {
  const { categorie, disponible } = req.query;
  let plats = db.plats;
  if (categorie) plats = plats.filter(p => p.categorie === categorie);
  if (disponible === 'true') plats = plats.filter(p => p.estDisponible);
  res.json(plats);
});

app.post('/api/plats', auth(['SUPER_ADMIN', 'ADMINISTRATEUR']), (req, res) => {
  const plat = { id: uuidv4(), noteMoyenne: 0, ...req.body };
  db.plats.push(plat);
  res.status(201).json(plat);
});

app.put('/api/plats/:id', auth(['SUPER_ADMIN', 'ADMINISTRATEUR', 'CUISINIER']), (req, res) => {
  const idx = db.plats.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Plat introuvable' });
  db.plats[idx] = { ...db.plats[idx], ...req.body };
  res.json(db.plats[idx]);
});

app.delete('/api/plats/:id', auth(['SUPER_ADMIN', 'ADMINISTRATEUR']), (req, res) => {
  db.plats = db.plats.filter(p => p.id !== req.params.id);
  res.json({ message: 'Plat supprimé' });
});

// ─── COMMANDES ROUTES ────────────────────────────────────────────
app.get('/api/commandes', auth(), (req, res) => {
  let commandes = db.commandes;
  if (req.user.role === 'ETUDIANT') {
    commandes = commandes.filter(c => c.etudiantId === req.user.id);
  }
  res.json(commandes.map(c => ({
    ...c,
    plat: db.plats.find(p => p.id === c.platId),
    creneau: db.creneaux.find(cr => cr.id === c.creneauId)
  })));
});

app.post('/api/commandes', auth(['ETUDIANT']), async (req, res) => {
  const { platId, creneauId, methodePaiement } = req.body;
  const plat = db.plats.find(p => p.id === platId);
  if (!plat || !plat.estDisponible) return res.status(400).json({ error: 'Plat indisponible' });

  const etudiant = db.utilisateurs.find(u => u.id === req.user.id);
  const allergenesCommuns = plat.allergenes?.filter(a => etudiant.allergenes?.includes(a));
  if (allergenesCommuns?.length > 0) {
    return res.status(400).json({ error: `Alerte allergène: ${allergenesCommuns.join(', ')}`, allergenes: allergenesCommuns });
  }

  const creneau = db.creneaux.find(c => c.id === creneauId);
  const pointsGagnes = 10 + (creneau?.bonusPoints || 0);
  const commandeId = uuidv4();
  const qrData = JSON.stringify({ commandeId, etudiantId: req.user.id, platId, timestamp: Date.now() });
  const qrCode = await QRCode.toDataURL(qrData);

  const commande = {
    id: commandeId, etudiantId: req.user.id, platId, creneauId,
    dateHeure: new Date(), statut: 'EN_ATTENTE',
    montantFCFA: plat.prixFCFA, pointsGagnes,
    qrCode, qrExpireA: new Date(Date.now() + 2 * 60 * 60 * 1000),
    typeCommande: 'EN_LIGNE'
  };
  db.commandes.push(commande);

  // Paiement
  const paiement = {
    id: uuidv4(), commandeId, montantFCFA: plat.prixFCFA,
    methode: methodePaiement || 'WAVE', statut: 'CONFIRME',
    referenceExterne: `PAY-${Date.now()}`, dateHeure: new Date()
  };
  db.paiements.push(paiement);
  commande.statut = 'CONFIRME';

  // Points
  etudiant.pointsESMT = (etudiant.pointsESMT || 0) + pointsGagnes;
  if (etudiant.pointsESMT >= 500) etudiant.niveauFidelite = 'OR';
  else if (etudiant.pointsESMT >= 200) etudiant.niveauFidelite = 'ARGENT';

  // Notif
  db.notifications.push({
    id: uuidv4(), type: 'COMMANDE_CONFIRMEE',
    message: `Commande confirmée ! +${pointsGagnes} points ESMT`,
    destinataire: req.user.id, lue: false, dateEnvoi: new Date()
  });

  res.status(201).json({ commande, paiement, qrCode });
});

app.put('/api/commandes/:id/valider', auth(['CUISINIER', 'ADMINISTRATEUR', 'SUPER_ADMIN']), (req, res) => {
  const commande = db.commandes.find(c => c.id === req.params.id);
  if (!commande) return res.status(404).json({ error: 'Commande introuvable' });
  commande.statut = 'VALIDEE';
  res.json(commande);
});

app.get('/api/commandes/bons-preparation', auth(['CUISINIER', 'SUPER_ADMIN']), (req, res) => {
  const bons = db.commandes
    .filter(c => c.statut === 'CONFIRME' || c.statut === 'EN_PREPARATION')
    .map(c => ({ ...c, plat: db.plats.find(p => p.id === c.platId) }));
  res.json(bons);
});

// ─── CRÉNEAUX ROUTES ─────────────────────────────────────────────
app.get('/api/creneaux', (req, res) => res.json(db.creneaux));

// ─── STOCKS ROUTES ───────────────────────────────────────────────
app.get('/api/stocks', auth(['SUPER_ADMIN', 'ADMINISTRATEUR', 'CUISINIER']), (req, res) => {
  const stocks = db.stocks.map(s => ({
    ...s, estCritique: s.quantite <= s.seuilAlerte
  }));
  res.json(stocks);
});

app.put('/api/stocks/:id', auth(['SUPER_ADMIN', 'ADMINISTRATEUR']), (req, res) => {
  const idx = db.stocks.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Stock introuvable' });
  db.stocks[idx] = { ...db.stocks[idx], ...req.body, derniereMaj: new Date() };
  res.json(db.stocks[idx]);
});

// ─── FOURNISSEURS ROUTES ─────────────────────────────────────────
app.get('/api/fournisseurs', auth(['SUPER_ADMIN', 'ADMINISTRATEUR']), (req, res) => res.json(db.fournisseurs));

app.post('/api/fournisseurs', auth(['SUPER_ADMIN', 'ADMINISTRATEUR']), (req, res) => {
  const f = { id: uuidv4(), ...req.body };
  db.fournisseurs.push(f);
  res.status(201).json(f);
});

// ─── FEEDBACKS ROUTES ────────────────────────────────────────────
app.post('/api/feedbacks', auth(['ETUDIANT']), (req, res) => {
  const { commandeId, noteGout, noteTemperature, notePortion, commentaire } = req.body;
  const commande = db.commandes.find(c => c.id === commandeId && c.etudiantId === req.user.id);
  if (!commande) return res.status(404).json({ error: 'Commande introuvable' });
  const fb = {
    id: uuidv4(), commandeId, etudiantId: req.user.id,
    noteGout, noteTemperature, notePortion, commentaire,
    dateSoumission: new Date(), pointsCredites: 5
  };
  db.feedbacks.push(fb);
  const etudiant = db.utilisateurs.find(u => u.id === req.user.id);
  if (etudiant) etudiant.pointsESMT += 5;
  const plat = db.plats.find(p => p.id === commande.platId);
  if (plat) {
    const platFeedbacks = db.feedbacks.filter(f => db.commandes.find(c => c.id === f.commandeId)?.platId === plat.id);
    plat.noteMoyenne = platFeedbacks.reduce((s, f) => s + (f.noteGout + f.noteTemperature + f.notePortion) / 3, 0) / platFeedbacks.length;
  }
  res.status(201).json(fb);
});

app.get('/api/feedbacks', auth(['SUPER_ADMIN', 'ADMINISTRATEUR']), (req, res) => res.json(db.feedbacks));

// ─── UTILISATEURS ADMIN ROUTES ───────────────────────────────────
app.get('/api/utilisateurs', auth(['SUPER_ADMIN', 'ADMINISTRATEUR']), (req, res) => {
  res.json(db.utilisateurs.map(({ motDePasse: _, ...u }) => u));
});

app.post('/api/utilisateurs/staff', auth(['SUPER_ADMIN', 'ADMINISTRATEUR']), async (req, res) => {
  const { nom, prenom, email, role, poste } = req.body;
  if (!['CUISINIER', 'ADMINISTRATEUR', 'GESTIONNAIRE'].includes(role)) {
    return res.status(400).json({ error: 'Rôle invalide' });
  }
  const motDePasse = Math.random().toString(36).slice(-8);
  const hash = await bcrypt.hash(motDePasse, 10);
  const staff = { id: uuidv4(), nom, prenom, email, motDePasse: hash, role, poste, actif: true, dateCreation: new Date() };
  db.utilisateurs.push(staff);
  res.status(201).json({ ...staff, motDePasseTemp: motDePasse, motDePasse: undefined });
});

app.put('/api/utilisateurs/:id/toggle', auth(['SUPER_ADMIN']), (req, res) => {
  const user = db.utilisateurs.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });
  user.actif = !user.actif;
  res.json({ actif: user.actif });
});

// ─── NOTIFICATIONS ───────────────────────────────────────────────
app.get('/api/notifications', auth(), (req, res) => {
  res.json(db.notifications.filter(n => n.destinataire === req.user.id));
});

app.put('/api/notifications/:id/lire', auth(), (req, res) => {
  const n = db.notifications.find(n => n.id === req.params.id);
  if (n) n.lue = true;
  res.json({ ok: true });
});

// ─── PRÉDICTION IA ───────────────────────────────────────────────
app.get('/api/prediction', auth(['SUPER_ADMIN', 'ADMINISTRATEUR', 'CUISINIER']), (req, res) => {
  const totalCommandes = db.commandes.length;
  const prediction = {
    id: uuidv4(), datePrevision: new Date(),
    nbCouvertsPrevu: Math.round(120 + Math.random() * 40),
    previsionParCreneau: {
      '07:30-09:00': Math.round(20 + Math.random() * 15),
      '09:00-10:30': Math.round(10 + Math.random() * 10),
      '12:00-13:30': Math.round(70 + Math.random() * 20),
      '13:30-15:00': Math.round(30 + Math.random() * 15),
    },
    tauxConfiance: 0.82 + Math.random() * 0.1,
    surplusDetecte: db.stocks.some(s => s.quantite > s.seuilAlerte * 4),
    stocksCritiques: db.stocks.filter(s => s.quantite <= s.seuilAlerte).map(s => s.ingredient),
  };
  res.json(prediction);
});

// ─── DASHBOARD STATS ─────────────────────────────────────────────
app.get('/api/stats', auth(['SUPER_ADMIN', 'ADMINISTRATEUR']), (req, res) => {
  const today = new Date().toDateString();
  const commandesAujourdhui = db.commandes.filter(c => new Date(c.dateHeure).toDateString() === today);
  res.json({
    totalEtudiants: db.utilisateurs.filter(u => u.role === 'ETUDIANT').length,
    commandesAujourdhui: commandesAujourdhui.length,
    revenuAujourdhui: commandesAujourdhui.reduce((s, c) => s + c.montantFCFA, 0),
    platsDisponibles: db.plats.filter(p => p.estDisponible).length,
    stocksCritiques: db.stocks.filter(s => s.quantite <= s.seuilAlerte).length,
    noteMoyenneGlobale: db.plats.reduce((s, p) => s + p.noteMoyenne, 0) / db.plats.length || 0,
    totalCommandes: db.commandes.length,
  });
});

const PORT = 3001;
app.listen(PORT, () => console.log(`SmartResto Backend running on http://localhost:${PORT}`));
