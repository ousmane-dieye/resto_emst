import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';
import { db } from '../config/database.js';
import { config } from '../config/index.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authMiddleware(), (req, res) => {
  try {
    let commandes = [...db.commandes];
    
    if (req.user.role === 'ETUDIANT') {
      commandes = commandes.filter(c => c.etudiantId === req.user.id);
    }
    
    const enriched = commandes.map(c => ({
      ...c,
      plat: db.plats.find(p => p.id === c.platId),
      creneau: db.creneaux.find(cr => cr.id === c.creneauId),
    }));
    
    res.json(enriched);
  } catch (error) {
    console.error('Get commandes error:', error);
    res.status(500).json({ error: 'Erreur serveur', code: 'SERVER_ERROR' });
  }
});

router.post('/', authMiddleware(['ETUDIANT']), async (req, res) => {
  try {
    const { platId, creneauId, methodePaiement } = req.body;
    
    if (!platId || !creneauId) {
      return res.status(400).json({ error: 'Plat et créneau requis', code: 'MISSING_FIELDS' });
    }
    
    const plat = db.plats.find(p => p.id === platId);
    if (!plat || !plat.estDisponible) {
      return res.status(400).json({ error: 'Plat indisponible', code: 'PLAT_UNAVAILABLE' });
    }
    
    const etudiant = db.utilisateurs.find(u => u.id === req.user.id);
    if (!etudiant) {
      return res.status(404).json({ error: 'Utilisateur introuvable', code: 'USER_NOT_FOUND' });
    }
    
    const allergenesCommuns = plat.allergenes?.filter(a => etudiant.allergenes?.includes(a));
    if (allergenesCommuns?.length > 0) {
      return res.status(400).json({
        error: `Alerte allergène: ${allergenesCommuns.join(', ')}`,
        allergenes: allergenesCommuns,
        code: 'ALLERGEN_ALERT',
      });
    }
    
    const creneau = db.creneaux.find(c => c.id === creneauId);
    if (!creneau) {
      return res.status(400).json({ error: 'Créneau invalide', code: 'CRENEAU_INVALID' });
    }
    
    const pointsGagnes = config.POINTS_COMMANDE + (creneau?.bonusPoints || 0);
    const commandeId = uuidv4();
    const qrData = JSON.stringify({ commandeId, etudiantId: req.user.id, platId, timestamp: Date.now() });
    const qrCode = await QRCode.toDataURL(qrData);
    
    const commande = {
      id: commandeId,
      etudiantId: req.user.id,
      platId,
      creneauId,
      dateHeure: new Date(),
      statut: 'EN_ATTENTE',
      montantFCFA: plat.prixFCFA,
      pointsGagnes,
      qrCode,
      qrExpireA: new Date(Date.now() + config.QR_CODE_EXPIRY),
      typeCommande: 'EN_LIGNE',
    };
    
    db.commandes.push(commande);
    
    const paiement = {
      id: uuidv4(),
      commandeId,
      montantFCFA: plat.prixFCFA,
      methode: methodePaiement || 'WAVE',
      statut: 'CONFIRME',
      referenceExterne: `PAY-${Date.now()}`,
      dateHeure: new Date(),
    };
    
    db.paiements.push(paiement);
    commande.statut = 'CONFIRME';
    
    etudiant.pointsESMT = (etudiant.pointsESMT || 0) + pointsGagnes;
    updateNiveauFidelite(etudiant);
    
    db.notifications.push({
      id: uuidv4(),
      type: 'COMMANDE_CONFIRMEE',
      message: `Commande confirmée ! +${pointsGagnes} points ESMT`,
      destinataire: req.user.id,
      lue: false,
      dateEnvoi: new Date(),
    });
    
    res.status(201).json({ commande, paiement, qrCode });
  } catch (error) {
    console.error('Create commande error:', error);
    res.status(500).json({ error: 'Erreur serveur', code: 'SERVER_ERROR' });
  }
});

router.put('/:id/valider', authMiddleware(['CUISINIER', 'ADMINISTRATEUR', 'SUPER_ADMIN']), (req, res) => {
  try {
    const { id } = req.params;
    const commande = db.commandes.find(c => c.id === id);
    
    if (!commande) {
      return res.status(404).json({ error: 'Commande introuvable', code: 'COMMANDE_NOT_FOUND' });
    }
    
    commande.statut = 'VALIDEE';
    res.json(commande);
  } catch (error) {
    console.error('Valider commande error:', error);
    res.status(500).json({ error: 'Erreur serveur', code: 'SERVER_ERROR' });
  }
});

router.get('/bons-preparation', authMiddleware(['CUISINIER', 'SUPER_ADMIN']), (req, res) => {
  try {
    const bons = db.commandes
      .filter(c => c.statut === 'CONFIRME' || c.statut === 'EN_PREPARATION')
      .map(c => ({ ...c, plat: db.plats.find(p => p.id === c.platId) }));
    
    res.json(bons);
  } catch (error) {
    console.error('Get bons error:', error);
    res.status(500).json({ error: 'Erreur serveur', code: 'SERVER_ERROR' });
  }
});

function updateNiveauFidelite(etudiant) {
  if (etudiant.pointsESMT >= config.SEUIL_NIVEAUX.OR) {
    etudiant.niveauFidelite = 'OR';
  } else if (etudiant.pointsESMT >= config.SEUIL_NIVEAUX.ARGENT) {
    etudiant.niveauFidelite = 'ARGENT';
  } else {
    etudiant.niveauFidelite = 'BRONZE';
  }
}

export default router;