import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PageLoader } from '../components/Loading';
import { statsApi, stocksApi } from '../services/api';

const Prediction = () => {
  const { error: showError } = useToast();
  const [pred, setPred] = useState(null);
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [predData, stocksData] = await Promise.all([
        statsApi.getPrediction(),
        stocksApi.getAll(),
      ]);
      setPred(predData);
      setStocks(stocksData);
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
    return <PageLoader text="Chargement de la prédiction..." />;
  }

  const total = pred?.previsionParCreneau ? Object.values(pred.previsionParCreneau).reduce((a, b) => a + b, 0) : 0;

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 mb-5">
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <div className="text-text3 text-sm mb-2">🤖 PRÉDICTION IA — {new Date().toLocaleDateString('fr-FR')}</div>
          <div className="font-syne font-bold text-[52px] text-green">{pred?.nbCouvertsPrevu || 0}</div>
          <div className="text-text2">couverts prévus</div>
          <div className="bg-green-dim text-green px-4 py-2 rounded-full inline-block mt-4 text-sm">
            {Math.round((pred?.tauxConfiance || 0.8) * 100)}% fiabilité
          </div>
          {pred?.surplusDetecte && (
            <div className="bg-orange-dim text-orange px-3 py-2 rounded-sm mt-2 text-sm">♻️ Surplus détecté</div>
          )}
        </div>
        
        <div className="bg-card border border-border rounded p-5">
          <div className="font-syne font-semibold mb-4">Répartition par créneau</div>
          {pred?.previsionParCreneau && Object.entries(pred.previsionParCreneau).map(([h, v]) => {
            const pct = (v / total) * 100;
            return (
              <div key={h} className="mb-4">
                <div className="flex items-center justify-between mb-2 text-sm">
                  <span className="text-text2">{h}</span>
                  <span className="font-semibold">{v} couverts</span>
                </div>
                <div className="h-2.5 bg-bg3 rounded overflow-hidden">
                  <div className="h-full bg-green rounded transition-all duration-500" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="bg-card border border-border rounded p-5">
        <div className="font-syne font-semibold mb-4">📦 État des stocks</div>
        <div className="grid grid-cols-3 gap-3">
          {stocks.map(s => {
            const color = s.estCritique ? 'var(--red)' : s.percentage < 50 ? 'var(--orange)' : 'var(--green)';
            return (
              <div key={s.id} className="p-3.5 bg-bg3 rounded-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-sm">{s.ingredient}</span>
                  {s.estCritique 
                    ? <span className="bg-red-dim text-red px-2 py-0.5 rounded text-xs">Critique</span> 
                    : <span className="bg-green-dim text-green px-2 py-0.5 rounded text-xs">OK</span>
                  }
                </div>
                <div className="text-text2 text-xs mb-2">{s.quantite} / {s.seuilAlerte * 4} {s.unite}</div>
                <div className="h-1.5 bg-bg rounded overflow-hidden">
                  <div className="h-full rounded transition-all" style={{ width: `${s.percentage}%`, background: color }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Prediction;