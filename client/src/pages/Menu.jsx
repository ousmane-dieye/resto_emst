import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PageLoader } from '../components/Loading';
import Modal from '../components/Modal';
import { platsApi, commandesApi, creneauxApi } from '../services/api';

const Menu = () => {
  const { user } = useAuth();
  const { success, error: showError } = useToast();
  const [plats, setPlats] = useState([]);
  const [creneaux, setCreneaux] = useState([]);
  const [filter, setFilter] = useState('tous');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [selectedPlat, setSelectedPlat] = useState(null);
  const [commandeForm, setCommandeForm] = useState({ creneau: '', paiement: 'WAVE' });

  const isAdmin = ['SUPER_ADMIN', 'ADMINISTRATEUR', 'CUISINIER'].includes(user?.role);

  const fetchData = useCallback(async () => {
    try {
      const [platsData, creneauxData] = await Promise.all([
        platsApi.getAll({ disponible: true }),
        creneauxApi.getAll(),
      ]);
      setPlats(platsData);
      setCreneaux(creneauxData);
    } catch (err) {
      showError('Erreur lors du chargement du menu');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredPlats = filter === 'tous' ? plats : plats.filter(p => p.categorie === filter);

  const cats = [
    { id: 'tous', label: 'Tous' },
    { id: 'plat_principal', label: 'Plats principaux' },
    { id: 'entree', label: 'Entrées' },
    { id: 'boisson', label: 'Boissons' }
  ];

  const handleCommander = async (e) => {
    e.preventDefault();
    try {
      const data = await commandesApi.create({
        platId: selectedPlat.id,
        creneauId: commandeForm.creneau,
        methodePaiement: commandeForm.paiement,
      });
      success(`Commande confirmée ! +${data.commande.pointsGagnes} points`);
      setModal(null);
      setCommandeForm({ creneau: '', paiement: 'WAVE' });
    } catch (err) {
      showError(err.message);
    }
  };

  const emojiMap = {
    'Thiéboudienne': '🐟', 'Yassa Poulet': '🍗', 'Mafé': '🥜',
    'Salade Composée': '🥗', 'Jus de Bissap': '🍹', 'Repas Eco': '♻️'
  };

  if (loading) {
    return <PageLoader text="Chargement du menu..." />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex gap-2 flex-wrap">
          {cats.map(cat => (
            <button key={cat.id} onClick={() => setFilter(cat.id)}
              className={`px-3 py-1.5 rounded-sm text-xs font-medium transition-all ${
                filter === cat.id 
                  ? 'bg-green text-black' 
                  : 'bg-bg3 text-text2 border border-border hover:border-green hover:text-green'
              }`}>
              {cat.label}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
        {filteredPlats.map(plat => {
          const conflict = plat.allergenes?.some(a => user?.allergenes?.includes(a));
          return (
            <div 
              key={plat.id} 
              onClick={() => user?.role === 'ETUDIANT' ? (setModal('commander'), setSelectedPlat(plat)) : null}
              className={`bg-card border rounded overflow-hidden cursor-pointer transition-all hover:border-green hover:-translate-y-0.5 relative ${
                plat.estRepasEco ? 'border-orange' : 'border-border'
              }`}>
              {plat.estRepasEco && (
                <div className="absolute top-2.5 right-2.5 bg-orange-dim text-orange px-2.5 py-0.5 rounded-full text-xs font-semibold z-10">♻️ Éco</div>
              )}
              {conflict && user?.role === 'ETUDIANT' && (
                <div className="absolute top-2.5 left-2.5 bg-red-dim text-red px-2.5 py-0.5 rounded-full text-xs font-semibold z-10">⚠️ Allergène</div>
              )}
              <div className="h-28 flex items-center justify-center text-5xl bg-bg3">{plat.emoji || emojiMap[plat.nom] || '🍽'}</div>
              <div className="p-3.5">
                <div className="font-syne font-semibold text-sm mb-1">{plat.nom}</div>
                <div className="text-text2 text-xs mb-2.5 line-height-1.5">{plat.description}</div>
                <div className="mb-2">
                  {plat.allergenes?.length ? plat.allergenes.map(a => (
                    <span key={a} className="inline-block bg-red-dim text-red rounded px-1.5 text-xs mr-0.5">{a}</span>
                  )) : <span className="text-xs text-text3">Aucun allergène</span>}
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-syne font-bold text-base text-green">{plat.prixFCFA.toLocaleString()} F</span>
                  <span className="text-gold text-xs">{'★'.repeat(Math.round(plat.noteMoyenne))} {plat.noteMoyenne.toFixed(1)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Modal isOpen={modal === 'commander' && selectedPlat} onClose={() => { setModal(null); setSelectedPlat(null); setCommandeForm({ creneau: '', paiement: 'WAVE' }); }} title={`${selectedPlat?.emoji || '🍽'} Commander`}>
        {selectedPlat && (
          <form onSubmit={handleCommander}>
            <div className="text-center mb-5 p-5 bg-bg3 rounded-sm">
              <div className="text-4xl mb-2">{selectedPlat.emoji}</div>
              <div className="font-syne font-bold text-lg">{selectedPlat.nom}</div>
              <div className="text-text2 text-xs mt-2">{selectedPlat.description}</div>
              <div className="font-syne font-bold text-xl text-green mt-3">{selectedPlat.prixFCFA.toLocaleString()} F</div>
            </div>
            <div className="mb-3.5">
              <label className="text-text2 text-xs block mb-1.5">Créneau de retrait</label>
              <select 
                id="creneau" 
                required 
                value={commandeForm.creneau}
                onChange={(e) => setCommandeForm(prev => ({ ...prev, creneau: e.target.value }))}
                className="w-full bg-bg3 border border-border rounded-sm p-2.5 text-sm text-text outline-none focus:border-green">
                <option value="">-- Choisir un créneau --</option>
                {creneaux.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.heureDebut} - {c.heureFin} {c.estCreneauCalme && `(+${c.bonusPoints} pts)`} — {c.nbReservations}/{c.capaciteMax}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-5">
              <label className="text-text2 text-xs block mb-1.5">Méthode de paiement</label>
              <select 
                id="paiement"
                value={commandeForm.paiement}
                onChange={(e) => setCommandeForm(prev => ({ ...prev, paiement: e.target.value }))}
                className="w-full bg-bg3 border border-border rounded-sm p-2.5 text-sm text-text outline-none focus:border-green">
                <option value="WAVE">💙 Wave</option>
                <option value="ORANGE_MONEY">🟠 Orange Money</option>
                <option value="CARTE">💳 Carte</option>
                <option value="ESPECES">💵 Espèces</option>
              </select>
            </div>
            <button type="submit" className="w-full bg-green text-black py-2.5 rounded-sm font-medium hover:bg-[#36e085] transition-all">
              Confirmer la commande
            </button>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default Menu;