import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PageLoader } from '../components/Loading';
import Modal from '../components/Modal';
import { fournisseursApi } from '../services/api';

const Fournisseurs = () => {
  const { success, error: showError } = useToast();
  const [fourns, setFourns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ nom: '', contact: '', delai: 1, ingredients: '' });

  const fetchFourns = useCallback(async () => {
    try {
      const data = await fournisseursApi.getAll();
      setFourns(data);
    } catch (err) {
      showError('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchFourns();
  }, [fetchFourns]);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const newFourn = await fournisseursApi.create({
        nom: form.nom,
        contact: form.contact,
        delaiLivraison: parseInt(form.delai),
        ingredientsFournis: form.ingredients.split(',').map(i => i.trim()),
      });
      setFourns(prev => [...prev, newFourn]);
      success('Fournisseur ajouté');
      setModal(null);
      setForm({ nom: '', contact: '', delai: 1, ingredients: '' });
    } catch (err) {
      showError(err.message);
    }
  };

  if (loading) {
    return <PageLoader text="Chargement des fournisseurs..." />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="text-text2 text-sm">{fourns.length} fournisseurs</span>
        <button onClick={() => setModal('add')} className="px-3 py-1.5 bg-green text-black rounded-sm text-xs font-medium hover:bg-[#36e085]">
          + Ajouter
        </button>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {fourns.map(f => (
          <div key={f.id} className="bg-card border border-border rounded p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="font-syne font-bold text-base">🚚 {f.nom}</div>
              <span className="bg-blue-dim text-blue px-2 py-0.5 rounded text-xs">{f.delaiLivraison}j délai</span>
            </div>
            <div className="text-text2 text-xs mb-3">📞 {f.contact}</div>
            <div className="h-px bg-border my-2" />
            <div className="text-xs"><strong>Produits:</strong> {f.ingredientsFournis?.join(', ')}</div>
          </div>
        ))}
      </div>

      <Modal isOpen={modal === 'add'} onClose={() => { setModal(null); setForm({ nom: '', contact: '', delai: 1, ingredients: '' }); }} title="Nouveau fournisseur">
        <form onSubmit={handleAdd}>
          <div className="mb-3.5">
            <label className="text-text2 text-xs block mb-1.5">Nom</label>
            <input 
              id="nom" 
              required 
              value={form.nom}
              onChange={(e) => setForm(prev => ({ ...prev, nom: e.target.value }))}
              className="w-full bg-bg3 border border-border rounded-sm p-2.5 text-sm" />
          </div>
          <div className="mb-3.5">
            <label className="text-text2 text-xs block mb-1.5">Contact</label>
            <input 
              id="contact" 
              required 
              value={form.contact}
              onChange={(e) => setForm(prev => ({ ...prev, contact: e.target.value }))}
              className="w-full bg-bg3 border border-border rounded-sm p-2.5 text-sm" />
          </div>
          <div className="mb-3.5">
            <label className="text-text2 text-xs block mb-1.5">Délai (jours)</label>
            <input 
              id="delai" 
              type="number" 
              value={form.delai}
              onChange={(e) => setForm(prev => ({ ...prev, delai: e.target.value }))}
              required 
              className="w-full bg-bg3 border border-border rounded-sm p-2.5 text-sm" />
          </div>
          <div className="mb-5">
            <label className="text-text2 text-xs block mb-1.5">Ingrédients (séparés par virgule)</label>
            <input 
              id="ingredients" 
              placeholder="Riz, Poulet, Légumes" 
              required 
              value={form.ingredients}
              onChange={(e) => setForm(prev => ({ ...prev, ingredients: e.target.value }))}
              className="w-full bg-bg3 border border-border rounded-sm p-2.5 text-sm" />
          </div>
          <button type="submit" className="w-full bg-green text-black py-2.5 rounded-sm font-medium">Ajouter</button>
        </form>
      </Modal>
    </div>
  );
};

export default Fournisseurs;