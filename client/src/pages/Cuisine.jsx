import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PageLoader } from '../components/Loading';
import { commandesApi } from '../services/api';

const Cuisine = () => {
  const { success, error: showError } = useToast();
  const [bons, setBons] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBons = useCallback(async () => {
    try {
      const data = await commandesApi.getBonsPreparation();
      setBons(data);
    } catch (err) {
      showError('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchBons();
    const interval = setInterval(fetchBons, 30000);
    return () => clearInterval(interval);
  }, [fetchBons]);

  const valider = async (id) => {
    try {
      await commandesApi.valider(id);
      setBons(prev => prev.filter(b => b.id !== id));
      success('Commande validée !');
    } catch (err) {
      showError(err.message);
    }
  };

  const urgents = bons.filter(b => {
    const age = (Date.now() - new Date(b.dateHeure).getTime()) / 60000;
    return age > 15;
  });

  if (loading) {
    return <PageLoader text="Chargement des bons..." />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          <span className="bg-orange-dim text-orange px-3 py-1 rounded-full text-xs">{bons.length} en attente</span>
          {urgents.length > 0 && <span className="bg-red-dim text-red px-3 py-1 rounded-full text-xs">⚠️ {urgents.length} urgents</span>}
        </div>
        <button onClick={fetchBons} className="px-3 py-1.5 bg-bg3 border border-border rounded-sm text-xs hover:border-green">
          ↻ Rafraîchir
        </button>
      </div>
      
      {bons.length === 0 ? (
        <div className="text-center py-10 text-text3">
          <div className="text-4xl mb-2">✅</div>
          <p>Aucun bon en attente</p>
        </div>
      ) : (
        bons.map(b => {
          const age = Math.round((Date.now() - new Date(b.dateHeure).getTime()) / 60000);
          const isUrgent = age > 15;
          return (
            <div key={b.id} className={`bg-card border rounded p-4 mb-2.5 border-l-4 ${isUrgent ? 'border-l-red' : 'border-l-orange'}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex gap-2">
                  <span className="font-syne font-bold text-sm">{b.plat?.nom || 'Plat'}</span>
                  {isUrgent && <span className="bg-red-dim text-red px-2 py-0.5 rounded text-xs">Urgent</span>}
                </div>
                <span className="text-text2 text-xs">{age} min</span>
              </div>
              <div className="text-text2 text-xs mb-3">Commande #{b.id.slice(-8).toUpperCase()}</div>
              <div className="flex gap-2">
                <button onClick={() => valider(b.id)} className="px-3 py-1.5 bg-green text-black rounded-sm text-xs font-medium hover:bg-[#36e085]">
                  ✓ Prêt
                </button>
                <span className={`px-2.5 py-1 rounded-full text-xs ${isUrgent ? 'bg-red-dim text-red' : 'bg-orange-dim text-orange'}`}>
                  {b.statut}
                </span>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default Cuisine;