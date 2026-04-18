import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { loadDatabase, getDb, saveDatabase } from './server/src/utils/database.js';
import { config, ROLES, STATUTS_COMMANDE } from './server/src/config/index.js';
import { validateBody, schemas } from './server/src/middleware/validate.js';
import { predictionEngine } from './server/src/utils/prediction.js';

dotenv.config();

const app = express();
app.use(cors({ origin: config.cors.origin }));
app.use(express.json());

loadDatabase();

const db = getDb();

async function initializeDefaultUsers() {
  const adminExists = db.utilisateurs.find(u => u.role === ROLES.SUPER_ADMIN);
  if (!adminExists) {
    const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10);
    db.utilisateurs.push({
      id: uuidv4(),
      nom: 'Admin',
      prenom: 'Super',
      email: process.env.ADMIN_EMAIL || 'admin@esmt.sn',
      motDePasse: hash,
      role: ROLES.SUPER_ADMIN,
      actif: true,
      dateCreation: new Date().toISOString(),
      niveauAcces: 'SUPER',
      estSuperAdmin: true
    });
  }

  const chefExists = db.utilisateurs.find(u => u.role === ROLES.CUISINIER);
  if (!chefExists) {
    const hash = await bcrypt.hash(process.env.CHEF_PASSWORD || 'cuisine123', 10);
    db.utilisateurs.push({
      id: uuidv4(),
      nom: 'Diallo',
      prenom: 'Mamadou',
      email: process.env.CHEF_EMAIL || 'cuisinier@esmt.sn',
      motDePasse: hash,
      role: ROLES.CUISINIER,
      actif: true,
      dateCreation: new Date().toISOString(),
      poste: 'Chef Principal'
    });
  }

  saveDatabase();
}

initializeDefaultUsers();

const auth = (roles = []) => (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token manquant' });

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = decoded;

    if (roles.length && !roles.includes(decoded.role)) {
      return res.status(403).json({ error: 'Accès refusé' });
    }
    next();
  } catch {
    res.status(401).json({ error: 'Token invalide' });
  }
};

const safeUser = (user) => {
  const { motDePasse, ...safe } = user;
  return safe;
};

app.post('/api/auth/inscription', validateBody(schemas.inscription), async (req, res) => {
  const { nom, prenom, email, motDePasse, numeroEtudiant, classe, filiere, allergenes, autresRestrictions } = req.body;

  if (db.utilisateurs.find(u => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(400).json({ error: 'Email déjà utilisé' });
  }

  const hash = await bcrypt.hash(motDePasse, 10);
  const etudiant = {
    id: uuidv4(),
    nom: nom.trim(),
    prenom: prenom.trim(),
    email: email.toLowerCase(),
    motDePasse: hash,
    role: ROLES.ETUDIANT,
    actif: true,
    emailVerifie: true,
    dateCreation: new Date().toISOString(),
    numeroEtudiant,
    classe,
    filiere,
    allergenes: allergenes || [],
    autresRestrictions: autresRestrictions || '',
    pointsESMT: 100,
    niveauFidelite: 'BRONZE'
  };

  db.utilisateurs.push(etudiant);
  saveDatabase();

  res.status(201).json({ message: 'Compte créé avec succès', utilisateur: safeUser(etudiant) });
});

app.post('/api/auth/connexion', validateBody(schemas.connexion), async (req, res) => {
  const { email, motDePasse } = req.body;
  const user = db.utilisateurs.find(u => u.email.toLowerCase() === email.toLowerCase());

  if (!user || !await bcrypt.compare(motDePasse, user.motDePasse)) {
    return res.status(401).json({ error: 'Identifiants incorrects' });
  }

  if (!user.actif) {
    return res.status(403).json({ error: 'Compte désactivé' });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, nom: user.nom, prenom: user.prenom },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );

  res.json({ token, utilisateur: safeUser(user) });
});

app.get('/api/auth/me', auth(), (req, res) => {
  const user = db.utilisateurs.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });
  res.json(safeUser(user));
});

app.get('/api/plats', (req, res) => {
  const { categorie, disponible } = req.query;
  let plats = [...db.plats];

  if (categorie) {
    plats = plats.filter(p => p.categorie === categorie);
  }
  if (disponible === 'true') {
    plats = plats.filter(p => p.estDisponible);
  }

  res.json(plats);
});

app.post('/api/plats', auth([ROLES.SUPER_ADMIN, ROLES.ADMINISTRATEUR]), validateBody(schemas.plat), (req, res) => {
  const { nom, description, prixFCFA, categorie, allergenes, estRepasEco, emoji } = req.body;

  const plat = {
    id: uuidv4(),
    nom: nom.trim(),
    description: description.trim(),
    prixFCFA,
    categorie,
    allergenes: allergenes || [],
    estDisponible: true,
    estRepasEco: estRepasEco || false,
    noteMoyenne: 0,
    emoji: emoji || '',
    createdAt: new Date().toISOString()
  };

  db.plats.push(plat);
  saveDatabase();

  res.status(201).json(plat);
});

app.put('/api/plats/:id', auth([ROLES.SUPER_ADMIN, ROLES.ADMINISTRATEUR, ROLES.CUISINIER]), (req, res) => {
  const idx = db.plats.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Plat introuvable' });

  db.plats[idx] = { ...db.plats[idx], ...req.body, updatedAt: new Date().toISOString() };
  saveDatabase();

  res.json(db.plats[idx]);
});

app.delete('/api/plats/:id', auth([ROLES.SUPER_ADMIN, ROLES.ADMINISTRATEUR]), (req, res) => {
  const idx = db.plats.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Plat introuvable' });

  db.plats.splice(idx, 1);
  saveDatabase();

  res.json({ message: 'Plat supprimé' });
});

app.get('/api/commandes', auth(), (req, res) => {
  let commandes = [...db.commandes];

  if (req.user.role === ROLES.ETUDIANT) {
    commandes = commandes.filter(c => c.etudiantId === req.user.id);
  }

  const result = commandes.map(c => ({
    ...c,
    plat: db.plats.find(p => p.id === c.platId),
    creneau: db.creneaux.find(cr => cr.id === c.creneauId),
    client: req.user.role !== ROLES.ETUDIANT 
      ? db.utilisateurs.find(u => u.id === c.etudiantId) 
      : undefined
  }));

  res.json(result);
});

app.post('/api/commandes', auth([ROLES.ETUDIANT]), validateBody(schemas.commande), async (req, res) => {
  const { platId, creneauId, methodePaiement } = req.body;

  const plat = db.plats.find(p => p.id === platId);
  if (!plat || !plat.estDisponible) {
    return res.status(400).json({ error: 'Plat indisponible' });
  }

  const etudiant = db.utilisateurs.find(u => u.id === req.user.id);
  if (!etudiant) {
    return res.status(404).json({ error: 'Étudiant introuvable' });
  }

  const allergenesCommuns = (plat.allergenes || []).filter(a => 
    (etudiant.allergenes || []).includes(a)
  );

  if (allergenesCommuns.length > 0) {
    return res.status(400).json({
      error: `Alerte allergène: ${allergenesCommuns.join(', ')}`,
      allergenes: allergenesCommuns
    });
  }

  const creneau = db.creneaux.find(c => c.id === creneauId);
  if (!creneau) {
    return res.status(400).json({ error: 'Créneau invalide' });
  }

  const pointsGagnes = config.points.commande + (creneau.bonusPoints || 0);
  const commandeId = uuidv4();

  const qrData = JSON.stringify({
    commandeId,
    etudiantId: req.user.id,
    platId,
    timestamp: Date.now()
  });

  const qrCode = await QRCode.toDataURL(qrData);

  const commande = {
    id: commandeId,
    etudiantId: req.user.id,
    platId,
    creneauId,
    dateHeure: new Date().toISOString(),
    statut: STATUTS_COMMANDE.CONFIRME,
    montantFCFA: plat.prixFCFA,
    pointsGagnes,
    methodePaiement: methodePaiement || 'WAVE',
    qrCode,
    qrExpireA: new Date(Date.now() + config.qrCode.expirationMinutes * 60 * 1000).toISOString(),
    typeCommande: 'EN_LIGNE',
    createdAt: new Date().toISOString()
  };

  db.commandes.push(commande);

  db.paiements.push({
    id: uuidv4(),
    commandeId,
    montantFCFA: plat.prixFCFA,
    methode: methodePaiement || 'WAVE',
    statut: 'CONFIRME',
    referenceExterne: `PAY-${Date.now()}`,
    dateHeure: new Date().toISOString()
  });

  etudiant.pointsESMT = (etudiant.pointsESMT || 0) + pointsGagnes;

  if (etudiant.pointsESMT >= config.seuils.OR) {
    etudiant.niveauFidelite = 'OR';
  } else if (etudiant.pointsESMT >= config.seuils.ARGENT) {
    etudiant.niveauFidelite = 'ARGENT';
  }

  db.notifications.push({
    id: uuidv4(),
    type: 'COMMANDE_CONFIRMEE',
    message: `Commande confirmée ! +${pointsGagnes} points ESMT`,
    destinataire: req.user.id,
    lue: false,
    dateEnvoi: new Date().toISOString()
  });

  saveDatabase();

  res.status(201).json({ commande, qrCode });
});

app.put('/api/commandes/:id/valider', auth([ROLES.CUISINIER, ROLES.ADMINISTRATEUR, ROLES.SUPER_ADMIN]), (req, res) => {
  const commande = db.commandes.find(c => c.id === req.params.id);
  if (!commande) return res.status(404).json({ error: 'Commande introuvable' });

  commande.statut = STATUTS_COMMANDE.PRETE;
  commande.updatedAt = new Date().toISOString();
  saveDatabase();

  db.notifications.push({
    id: uuidv4(),
    type: 'COMMANDE_PRETE',
    message: 'Votre commande est prête !',
    destinataire: commande.etudiantId,
    lue: false,
    dateEnvoi: new Date().toISOString()
  });
  saveDatabase();

  res.json(commande);
});

app.put('/api/commandes/:id/retirer', auth([ROLES.ETUDIANT]), (req, res) => {
  const commande = db.commandes.find(c => c.id === req.params.id);
  if (!commande) return res.status(404).json({ error: 'Commande introuvable' });
  if (commande.etudiantId !== req.user.id) {
    return res.status(403).json({ error: 'Non autorisé' });
  }

  commande.statut = STATUTS_COMMANDE.RETIREE;
  commande.retireeA = new Date().toISOString();
  saveDatabase();

  res.json(commande);
});

app.get('/api/commandes/bons-preparation', auth([ROLES.CUISINIER, ROLES.SUPER_ADMIN]), (req, res) => {
  const bons = db.commandes
    .filter(c => c.statut === STATUTS_COMMANDE.CONFIRME || c.statut === STATUTS_COMMANDE.EN_PREPARATION)
    .map(c => ({
      ...c,
      plat: db.plats.find(p => p.id === c.platId),
      client: db.utilisateurs.find(u => u.id === c.etudiantId)
    }));

  res.json(bons);
});

app.get('/api/creneaux', (req, res) => {
  res.json(db.creneaux);
});

app.get('/api/stocks', auth([ROLES.SUPER_ADMIN, ROLES.ADMINISTRATEUR, ROLES.CUISINIER]), (req, res) => {
  const stocks = db.stocks.map(s => ({
    ...s,
    estCritique: s.quantite <= s.seuilAlerte,
    dernierMaj: s.dernierMaj || new Date().toISOString()
  }));

  res.json(stocks);
});

app.put('/api/stocks/:id', auth([ROLES.SUPER_ADMIN, ROLES.ADMINISTRATEUR]), (req, res) => {
  const idx = db.stocks.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Stock introuvable' });

  db.stocks[idx] = {
    ...db.stocks[idx],
    ...req.body,
    dernierMaj: new Date().toISOString()
  };
  saveDatabase();

  res.json(db.stocks[idx]);
});

app.get('/api/fournisseurs', auth([ROLES.SUPER_ADMIN, ROLES.ADMINISTRATEUR]), (req, res) => {
  res.json(db.fournisseurs);
});

app.post('/api/fournisseurs', auth([ROLES.SUPER_ADMIN, ROLES.ADMINISTRATEUR]), validateBody(schemas.fournisseur), (req, res) => {
  const { nom, contact, delaiLivraison, ingredientsFournis } = req.body;

  const fournisseur = {
    id: uuidv4(),
    nom: nom.trim(),
    contact,
    delaiLivraison,
    ingredientsFournis: ingredientsFournis || [],
    createdAt: new Date().toISOString()
  };

  db.fournisseurs.push(fournisseur);
  saveDatabase();

  res.status(201).json(fournisseur);
});

app.post('/api/feedbacks', auth([ROLES.ETUDIANT]), validateBody(schemas.feedback), (req, res) => {
  const { commandeId, noteGout, noteTemperature, notePortion, commentaire } = req.body;

  const commande = db.commandes.find(c => c.id === commandeId && c.etudiantId === req.user.id);
  if (!commande) {
    return res.status(404).json({ error: 'Commande introuvable' });
  }

  const existingFeedback = db.feedbacks.find(f => f.commandeId === commandeId);
  if (existingFeedback) {
    return res.status(400).json({ error: 'Feedback déjà soumis pour cette commande' });
  }

  const fb = {
    id: uuidv4(),
    commandeId,
    etudiantId: req.user.id,
    noteGout,
    noteTemperature,
    notePortion,
    commentaire: commentaire?.trim() || '',
    dateSoumission: new Date().toISOString(),
    pointsCredites: config.points.feedback
  };

  db.feedbacks.push(fb);

  const etudiant = db.utilisateurs.find(u => u.id === req.user.id);
  if (etudiant) {
    etudiant.pointsESMT = (etudiant.pointsESMT || 0) + config.points.feedback;
  }

  const plat = db.plats.find(p => p.id === commande.platId);
  if (plat) {
    const platFeedbacks = db.feedbacks.filter(f => {
      const cmd = db.commandes.find(c => c.id === f.commandeId);
      return cmd && cmd.platId === plat.id;
    });

    if (platFeedbacks.length > 0) {
      const totalNotes = platFeedbacks.reduce((sum, f) => 
        sum + (f.noteGout + f.noteTemperature + f.notePortion) / 3, 0
      );
      plat.noteMoyenne = Math.round((totalNotes / platFeedbacks.length) * 10) / 10;
    }
  }

  saveDatabase();

  res.status(201).json(fb);
});

app.get('/api/feedbacks', auth([ROLES.SUPER_ADMIN, ROLES.ADMINISTRATEUR]), (req, res) => {
  const feedbacks = db.feedbacks.map(f => ({
    ...f,
    plat: db.commandes.find(c => c.id === f.commandeId)?.platId 
      ? db.plats.find(p => p.id === db.commandes.find(c => c.id === f.commandeId).platId) 
      : null
  }));

  res.json(feedbacks);
});

app.get('/api/utilisateurs', auth([ROLES.SUPER_ADMIN, ROLES.ADMINISTRATEUR]), (req, res) => {
  const utilisateurs = db.utilisateurs.map(u => safeUser(u));
  res.json(utilisateurs);
});

app.post('/api/utilisateurs/staff', auth([ROLES.SUPER_ADMIN, ROLES.ADMINISTRATEUR]), validateBody(schemas.staff), async (req, res) => {
  const { nom, prenom, email, role, poste } = req.body;

  if (db.utilisateurs.find(u => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(400).json({ error: 'Email déjà utilisé' });
  }

  const motDePasse = Math.random().toString(36).slice(-8);
  const hash = await bcrypt.hash(motDePasse, 10);

  const staff = {
    id: uuidv4(),
    nom: nom.trim(),
    prenom: prenom.trim(),
    email: email.toLowerCase(),
    motDePasse: hash,
    role,
    poste: poste || '',
    actif: true,
    dateCreation: new Date().toISOString()
  };

  db.utilisateurs.push(staff);
  saveDatabase();

  res.status(201).json({
    ...safeUser(staff),
    motDePasseTemp: motDePasse
  });
});

app.put('/api/utilisateurs/:id/toggle', auth([ROLES.SUPER_ADMIN]), (req, res) => {
  const user = db.utilisateurs.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });

  user.actif = !user.actif;
  user.updatedAt = new Date().toISOString();
  saveDatabase();

  res.json({ actif: user.actif });
});

app.get('/api/notifications', auth(), (req, res) => {
  const notifications = db.notifications.filter(n => n.destinataire === req.user.id);
  res.json(notifications);
});

app.put('/api/notifications/:id/lire', auth(), (req, res) => {
  const notification = db.notifications.find(n => n.id === req.params.id);
  if (!notification) return res.status(404).json({ error: 'Notification introuvable' });

  notification.lue = true;
  saveDatabase();

  res.json({ ok: true });
});

app.get('/api/notifications/unread-count', auth(), (req, res) => {
  const count = db.notifications.filter(n => n.destinataire === req.user.id && !n.lue).length;
  res.json({ count });
});

app.get('/api/prediction', auth([ROLES.SUPER_ADMIN, ROLES.ADMINISTRATEUR, ROLES.CUISINIER]), (req, res) => {
  const prediction = predictionEngine.predict(new Date());
  const recommendations = predictionEngine.getRecommendations();

  res.json({ ...prediction, recommendations });
});

app.get('/api/stats', auth([ROLES.SUPER_ADMIN, ROLES.ADMINISTRATEUR]), (req, res) => {
  const today = new Date().toDateString();
  const commandesAujourdhui = db.commandes.filter(c => 
    new Date(c.dateHeure).toDateString() === today
  );

  res.json({
    totalEtudiants: db.utilisateurs.filter(u => u.role === ROLES.ETUDIANT).length,
    commandesAujourdhui: commandesAujourdhui.length,
    revenuAujourdhui: commandesAujourdhui.reduce((sum, c) => sum + c.montantFCFA, 0),
    platsDisponibles: db.plats.filter(p => p.estDisponible).length,
    stocksCritiques: db.stocks.filter(s => s.quantite <= s.seuilAlerte).length,
    noteMoyenneGlobale: db.plats.length > 0 
      ? Math.round((db.plats.reduce((s, p) => s + p.noteMoyenne, 0) / db.plats.length) * 10) / 10 
      : 0,
    totalCommandes: db.commandes.length,
    activeFournisseurs: db.fournisseurs.length
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route non trouvée', code: 'NOT_FOUND' });
});

app.use((err, req, res, next) => {
  console.error('Erreur:', err);
  res.status(500).json({ error: 'Erreur serveur interne' });
});

app.listen(config.port, () => {
  console.log(`✓ SmartResto Backend running on http://localhost:${config.port}`);
});