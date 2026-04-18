import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PageLoader } from '../components/Loading';
import { statsApi } from '../services/api';

const Dashboard = () => {
  const { user } = useAuth();
  const { error: showError } = useToast();
  const [stats, setStats] = useState(null);
  const [pred, setPred] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [statsData, predData] = await Promise.all([
        statsApi.get(),
        statsApi.getPrediction(),
      ]);
      setStats(statsData);
      setPred(predData);
    } catch (err) {
      showError('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return <PageLoader text="Chargement du dashboard..." />;
  }

  return (
    <div>
      <div className="grid grid-cols-4 gap-4 mb-5">
        <div className="bg-card border rounded p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-green" />
          <div className="text-text2 text-xs">Étudiants</div>
          <div className="font-syne font-bold text-2xl mt-2">{stats?.totalEtudiants || 0}</div>
        </div>
        <div className="bg-card border rounded p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-orange" />
          <div className="text-text2 text-xs">Commandes jour</div>
          <div className="font-syne font-bold text-2xl mt-2">{stats?.commandesAujourdhui || 0}</div>
        </div>
        <div className="bg-card border rounded p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-blue" />
          <div className="text-text2 text-xs">Revenu jour</div>
          <div className="font-syne font-bold text-2xl mt-2">{(stats?.revenuAujourdhui || 0).toLocaleString()} <span className="text-sm font-normal">F</span></div>
        </div>
        <div className="bg-card border rounded p-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gold" />
          <div className="text-text2 text-xs">Stocks critiques</div>
          <div className="font-syne font-bold text-2xl mt-2">{stats?.stocksCritiques || 0}</div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card border rounded p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="font-syne font-semibold">🤖 Prédiction IA</div>
            <span className="bg-green-dim text-green px-2.5 py-0.5 rounded-full text-xs">{Math.round((pred?.tauxConfiance || 0.8) * 100)}% fiable</span>
          </div>
          <div className="text-center my-4">
            <div className="font-syne font-bold text-4xl text-green">{pred?.nbCouvertsPrevu || 0}</div>
            <div className="text-text2 text-sm">couverts prévus</div>
          </div>
          {pred?.previsionParCreneau && Object.entries(pred.previsionParCreneau).map(([h, v]) => (
            <div key={h} className="flex items-center gap-3 mb-2">
              <span className="text-text2 text-xs w-20">{h.split('-')[0]}</span>
              <div className="flex-1 h-2 bg-bg3 rounded overflow-hidden">
                <div className="h-full bg-green rounded transition-all duration-500" style={{ width: `${(v / pred.nbCouvertsPrevu) * 100}%` }} />
              </div>
              <span className="text-xs font-semibold w-10 text-right">{v}</span>
            </div>
          ))}
          {pred?.surplusDetecte && <div className="bg-orange-dim text-orange px-3 py-2 rounded-sm mt-4 text-sm">♻️ Surplus détecté</div>}
        </div>
        
        <div className="bg-card border rounded p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="font-syne font-semibold">📦 Stocks critiques</div>
          </div>
          {pred?.stocksCritiques?.length === 0 ? (
            <div className="text-center py-5 text-text3">✅ Tous OK</div>
          ) : pred?.stocksCritiques?.map(s => (
            <div key={s} className="bg-red-dim text-red px-3 py-2 rounded-sm mb-2 text-sm">⚠️ {s}</div>
          ))}
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs mb-1">
              <span>Note globale</span>
              <span className="text-gold">★ {(stats?.noteMoyenneGlobale || 0).toFixed(1)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span>Plats dispo</span>
              <span className="bg-green-dim text-green px-2 py-0.5 rounded">{stats?.platsDisponibles || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;