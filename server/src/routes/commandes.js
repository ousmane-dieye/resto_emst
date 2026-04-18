import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';
import { query } from '../config/database.js';
import { config } from '../config/index.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authMiddleware(), async (req, res) => {
  try {
    let sql = `
      SELECT c.*, p.nom as platNom, p.description as platDescription, p.prixFCFA as platPrix, p.emoji as platEmoji,
             cr.heureDebut, cr.heureFin, cr.capaciteMax
      FROM commandes c
      LEFT JOIN plats p ON c.platId = p.id
      LEFT JOIN creneaux cr ON c.creneauId = cr.id
    `;
    const params = [];
    
    if (req.user.role === 'ETUDIANT') {
      sql += ' WHERE c.etudiantId = ?';
      params.push(req.user.id);
    }
    
    sql += ' ORDER BY c.dateHeure DESC';
    
    const commandes = await query(sql, params);
    res.json(commandes);
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
    
    const [plats] = await query('SELECT * FROM plats WHERE id = ? AND estDisponible = TRUE', [platId]);
    const plat = plats[0];
    
    if (!plat) {
      return res.status(400).json({ error: 'Plat indisponible', code: 'PLAT_UNAVAILABLE' });
    }
    
    const [users] = await query('SELECT * FROM utilisateurs WHERE id = ?', [req.user.id]);
    const etudiant = users[0];
    
    if (!etudiant) {
      return res.status(404).json({ error: 'Utilisateur introuvable', code: 'USER_NOT_FOUND' });
    }
    
    const allergenesPlat = plat.allergenes ? JSON.parse(plat.allergenes) : [];
    const allergenesUser = etudiant.allergenes ? JSON.parse(etudiant.allergenes) : [];
    const allergenesCommuns = allergenesPlat.filter(a => allergenesUser.includes(a));
    
    if (allergenesCommuns.length > 0) {
      return res.status(400).json({
        error: `Alerte allergène: ${allergenesCommuns.join(', ')}`,
        allergenes: allergenesCommuns,
        code: 'ALLERGEN_ALERT',
      });
    }
    
    const [creneaux] = await query('SELECT * FROM creneaux WHERE id = ?', [creneauId]);
    const creneau = creneaux[0];
    
    if (!creneau) {
      return res.status(400).json({ error: 'Créneau invalide', code: 'CRENEAU_INVALID' });
    }
    
    const pointsGagnes = config.points.commande + (creneau.bonusPoints || 0);
    const commandeId = uuidv4();
    
    const qrData = JSON.stringify({ commandeId, etudiantId: req.user.id, platId, timestamp: Date.now() });
    const qrCodeData = await QRCode.toDataURL(qrData);
    
    await query(
      `INSERT INTO commandes (id, etudiantId, platId, creneauId, dateHeure, statut, montantFCFA, pointsGagnes, methodePaiement, qrCode, qrExpireA, typeCommande)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [commandeId, req.user.id, platId, creneauId, new Date(), 'CONFIRME', plat.prixFCFA, pointsGagnes, methodePaiement || 'WAVE', qrCodeData, new Date(Date.now() + config.qrCode.expirationMinutes * 60000), 'EN_LIGNE']
    );
    
    const paiementId = uuidv4();
    await query(
      `INSERT INTO paiements (id, commandeId, montantFCFA, methode, statut, referenceExterne, dateHeure)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [paiementId, commandeId, plat.prixFCFA, methodePaiement || 'WAVE', 'CONFIRME', `PAY-${Date.now()}`, new Date()]
    );
    
    const newPoints = (etudiant.pointsESMT || 0) + pointsGagnes;
    let niveau = 'BRONZE';
    if (newPoints >= config.seuils.OR) niveau = 'OR';
    else if (newPoints >= config.seuils.ARGENT) niveau = 'ARGENT';
    
    await query('UPDATE utilisateurs SET pointsESMT = ?, niveauFidelite = ? WHERE id = ?', [newPoints, niveau, req.user.id]);
    
    const notifId = uuidv4();
    await query(
      `INSERT INTO notifications (id, type, message, destinataire, lue, dateEnvoi)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [notifId, 'COMMANDE_CONFIRMEE', `Commande confirmée ! +${pointsGagnes} points ESMT`, req.user.id, false, new Date()]
    );
    
    const [commandes] = await query('SELECT * FROM commandes WHERE id = ?', [commandeId]);
    res.status(201).json({ commande: commandes[0], qrCode: qrCodeData });
  } catch (error) {
    console.error('Create commande error:', error);
    res.status(500).json({ error: 'Erreur serveur', code: 'SERVER_ERROR' });
  }
});

router.put('/:id/valider', authMiddleware(['CUISINIER', 'ADMINISTRATEUR', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    
    const [commandes] = await query('SELECT * FROM commandes WHERE id = ?', [id]);
    if (!commandes[0]) {
      return res.status(404).json({ error: 'Commande introuvable', code: 'COMMANDE_NOT_FOUND' });
    }
    
    await query("UPDATE commandes SET statut = 'PRETE', dateHeure = WHERE id = ?", [new Date(), id]);
    
    const notifId = uuidv4();
    await query(
      `INSERT INTO notifications (id, type, message, destinataire, lue, dateEnvoi)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [notifId, 'COMMANDE_PRETE', 'Votre commande est prête !', commandes[0].etudiantId, false, new Date()]
    );
    
    const [updated] = await query('SELECT * FROM commandes WHERE id = ?', [id]);
    res.json(updated[0]);
  } catch (error) {
    console.error('Valider commande error:', error);
    res.status(500).json({ error: 'Erreur serveur', code: 'SERVER_ERROR' });
  }
});

router.get('/bons-preparation', authMiddleware(['CUISINIER', 'SUPER_ADMIN']), async (req, res) => {
  try {
    const sql = `
      SELECT c.*, p.nom as platNom, p.description as platDescription, p.emoji as platEmoji,
             u.nom as clientNom, u.prenom as clientPrenom
      FROM commandes c
      LEFT JOIN plats p ON c.platId = p.id
      LEFT JOIN utilisateurs u ON c.etudiantId = u.id
      WHERE c.statut IN ('CONFIRME', 'EN_PREPARATION')
      ORDER BY c.dateHeure ASC
    `;
    
    const bons = await query(sql);
    res.json(bons);
  } catch (error) {
    console.error('Get bons error:', error);
    res.status(500).json({ error: 'Erreur serveur', code: 'SERVER_ERROR' });
  }
});

export default router;