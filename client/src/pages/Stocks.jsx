import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PageLoader } from '../components/Loading';
import Modal from '../components/Modal';
import { stocksApi } from '../services/api';

const Stocks = () => {
  const { error: showError } = useToast();
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [editForm, setEditForm] = useState({ qte: 0, seuil: 0 });

  const fetchStocks = useCallback(async () => {
    try {
      const data = await stocksApi.getAll();
      setStocks(data);
    } catch (err) {
      showError('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchStocks();
  }, [fetchStocks]);

  const handleEdit = (stock) => {
    setSelected(stock);
    setEditForm({ qte: stock.quantite, seuil: stock.seuilAlerte });
    setModal('edit');
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await stocksApi.update(selected.id, {
        quantite: parseInt(editForm.qte),
        seuilAlerte: parseInt(editForm.seuil),
      });
      setStocks(prev => prev.map(s => s.id === selected.id ? { 
        ...s, 
        quantite: parseInt(editForm.qte), 
        seuilAlerte: parseInt(editForm.seuil) 
      } : s));
      setModal(null);
      setSelected(null);
    } catch (err) {
      showError(err.message);
    }
  };

  if (loading) {
    return <PageLoader text="Chargement des stocks..." />;
  }

  const critques = stocks.filter(s => s.estCritique).length;
  const ok = stocks.filter(s => !s.estCritique).length;

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <span className="bg-red-dim text-red px-3 py-1 rounded-full text-xs">{critques} critiques</span>
        <span className="bg-green-dim text-green px-3 py-1 rounded-full text-xs">{ok} OK</span>
      </div>
      
      <div className="bg-card border border-border rounded overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs text-text3 font-semibold uppercase border-b border-border">
              <th className="p-3">Ingrédient</th>
              <th className="p-3">Quantité</th>
              <th className="p-3">Seuil</th>
              <th className="p-3">Niveau</th>
              <th className="p-3">Statut</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {stocks.map(s => {
              const color = s.estCritique ? 'var(--red)' : s.percentage < 50 ? 'var(--orange)' : 'var(--green)';
              return (
                <tr key={s.id} className="border-b border-border last:border-0">
                  <td className="p-3 font-medium">{s.ingredient}</td>
                  <td className="p-3"><strong>{s.quantite}</strong> {s.unite}</td>
                  <td className="p-3">{s.seuilAlerte} {s.unite}</td>
                  <td className="p-3">
                    <div className="h-1.5 bg-bg3 rounded overflow-hidden">
                      <div className="h-full rounded transition-all" style={{ width: `${s.percentage}%`, background: color }} />
                    </div>
                  </td>
                  <td className="p-3">
                    {s.estCritique 
                      ? <span className="bg-red-dim text-red px-2 py-0.5 rounded text-xs">⚠️ Critique</span> 
                      : <span className="bg-green-dim text-green px-2 py-0.5 rounded text-xs">OK</span>
                    }
                  </td>
                  <td className="p-3">
                    <button onClick={() => handleEdit(s)} className="px-3 py-1.5 bg-bg3 border border-border rounded-sm text-xs hover:border-green">
                      Modifier
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Modal isOpen={modal === 'edit' && selected} onClose={() => { setModal(null); setSelected(null); }} title="Modifier stock">
        {selected && (
          <form onSubmit={handleUpdate}>
            <div className="mb-3.5">
              <label className="text-text2 text-xs block mb-1.5">Quantité</label>
              <input 
                id="qte" 
                type="number" 
                value={editForm.qte} 
                onChange={(e) => setEditForm(prev => ({ ...prev, qte: e.target.value }))}
                required 
                className="w-full bg-bg3 border border-border rounded-sm p-2.5 text-sm" />
            </div>
            <div className="mb-5">
              <label className="text-text2 text-xs block mb-1.5">Seuil d'alerte</label>
              <input 
                id="seuil" 
                type="number" 
                value={editForm.seuil} 
                onChange={(e) => setEditForm(prev => ({ ...prev, seuil: e.target.value }))}
                required 
                className="w-full bg-bg3 border border-border rounded-sm p-2.5 text-sm" />
            </div>
            <button type="submit" className="w-full bg-green text-black py-2.5 rounded-sm font-medium">Enregistrer</button>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default Stocks;