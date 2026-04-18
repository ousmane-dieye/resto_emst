import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PageLoader } from '../components/Loading';
import Modal from '../components/Modal';
import { commandesApi, feedbackApi } from '../services/api';

const Commandes = () => {
  const { user, refreshUser } = useAuth();
  const { success, error: showError } = useToast();
  const [commandes, setCommandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qrModal, setQrModal] = useState(null);
  const [feedbackModal, setFeedbackModal] = useState(null);

  const fetchCommandes = useCallback(async () => {
    try {
      const data = await commandesApi.getAll();
      setCommandes(data);
    } catch (err) {
      showError('Erreur lors du chargement des commandes');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchCommandes();
  }, [fetchCommandes]);

  const handleFeedback = async (e) => {
    e.preventDefault();
    try {
      await feedbackApi.create({
        commandeId: feedbackModal,
        noteGout: parseInt(document.getElementById('noteGout').value),
        noteTemperature: parseInt(document.getElementById('noteTemp').value),
        notePortion: parseInt(document.getElementById('notePortion').value),
        commentaire: document.getElementById('commentaire').value,
      });
      success('Merci pour votre avis ! +5 points');
      await refreshUser();
      setFeedbackModal(null);
    } catch (err) {
      showError(err.message);
    }
  };

  const statusBadge = { CONFIRME: 'bg-green-dim text-green', EN_ATTENTE: 'bg-orange-dim text-orange', VALIDEE: 'bg-blue-dim text-blue', ANNULEE: 'bg-red-dim text-red' };
  const statusLabel = { CONFIRME: 'Confirmé', EN_ATTENTE: 'En attente', VALIDEE: 'Validé', ANNULEE: 'Annulé' };

  if (loading) {
    return <PageLoader text="Chargement des commandes..." />;
  }

  return (
    <div>
      <p className="text-text2 text-sm mb-5">Suivez vos commandes et accédez à vos QR codes.</p>
      
      {commandes.length === 0 ? (
        <div className="text-center py-10 text-text3">
          <div className="text-4xl mb-2">📭</div>
          <p>Aucune commande</p>
        </div>
      ) : (
        commandes.map(c => (
          <div key={c.id} className="flex items-center justify-between p-3.5 bg-bg3 border border-border rounded-sm mb-2 gap-3">
            <div className="w-15 h-15 rounded-sm overflow-hidden flex-shrink-0 cursor-pointer" onClick={() => setQrModal(c.id)}>
              <img src={c.qrCode} alt="QR" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm">{c.plat?.nom || 'Plat'}</div>
              <div className="text-text2 text-xs">{new Date(c.dateHeure).toLocaleDateString('fr-FR')} — {c.montantFCFA.toLocaleString()} F</div>
              <div className="flex gap-2 mt-2">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge[c.statut]}`}>{statusLabel[c.statut] || c.statut}</span>
                <span className="bg-gold-dim text-gold px-2.5 py-0.5 rounded-full text-xs">+{c.pointsGagnes} pts</span>
              </div>
            </div>
            {c.statut === 'VALIDEE' && (
              <button onClick={() => setFeedbackModal(c.id)} className="px-3 py-1.5 bg-bg3 border border-border rounded-sm text-xs hover:border-green hover:text-green">📝 Évaluer</button>
            )}
          </div>
        ))
      )}

      <Modal isOpen={!!qrModal} onClose={() => setQrModal(null)} title="QR Code">
        {qrModal && (
          <div className="text-center">
            <img src={commandes.find(c => c.id === qrModal)?.qrCode} alt="QR" className="w-48 h-48 rounded-lg mx-auto mb-4" />
            <button onClick={() => setQrModal(null)} className="px-4 py-2 bg-green text-black rounded-sm">Fermer</button>
          </div>
        )}
      </Modal>

      <Modal isOpen={!!feedbackModal} onClose={() => setFeedbackModal(null)} title="📝 Évaluer">
        <form onSubmit={handleFeedback}>
          <div className="mb-3.5">
            <label className="text-text2 text-xs block mb-1.5">Goût (1-5)</label>
            <input id="noteGout" type="number" min="1" max="5" defaultValue="4" required 
              className="w-full bg-bg3 border border-border rounded-sm p-2.5 text-sm" />
          </div>
          <div className="mb-3.5">
            <label className="text-text2 text-xs block mb-1.5">Température (1-5)</label>
            <input id="noteTemp" type="number" min="1" max="5" defaultValue="4" required 
              className="w-full bg-bg3 border border-border rounded-sm p-2.5 text-sm" />
          </div>
          <div className="mb-3.5">
            <label className="text-text2 text-xs block mb-1.5">Portion (1-5)</label>
            <input id="notePortion" type="number" min="1" max="5" defaultValue="4" required 
              className="w-full bg-bg3 border border-border rounded-sm p-2.5 text-sm" />
          </div>
          <div className="mb-5">
            <label className="text-text2 text-xs block mb-1.5">Commentaire</label>
            <textarea id="commentaire" className="w-full bg-bg3 border border-border rounded-sm p-2.5 text-sm h-20" />
          </div>
          <button type="submit" className="w-full bg-green text-black py-2.5 rounded-sm font-medium">Envoyer</button>
        </form>
      </Modal>
    </div>
  );
};

export default Commandes;