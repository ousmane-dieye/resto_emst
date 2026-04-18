import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PageLoader } from '../components/Loading';
import Modal from '../components/Modal';
import { utilisateursApi } from '../services/api';

const Utilisateurs = () => {
  const { user: currentUser, error: showError } = useAuth();
  const { success } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ nom: '', prenom: '', email: '', role: 'CUISINIER', poste: '' });

  const fetchUsers = useCallback(async () => {
    try {
      const data = await utilisateursApi.getAll();
      setUsers(data);
    } catch (err) {
      showError('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const toggleUser = async (id) => {
    try {
      await utilisateursApi.toggle(id);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, actif: !u.actif } : u));
      success('Statut modifié');
    } catch (err) {
      showError(err.message);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const newUser = await utilisateursApi.createStaff({
        nom: form.nom,
        prenom: form.prenom,
        email: form.email,
        role: form.role,
        poste: form.poste,
      });
      setUsers(prev => [...prev, { ...newUser, motDePasse: undefined }]);
      alert(`Compte créé ! Mot de passe temporaire: ${newUser.motDePasseTemp}`);
      setModal(null);
      setForm({ nom: '', prenom: '', email: '', role: 'CUISINIER', poste: '' });
    } catch (err) {
      showError(err.message);
    }
  };

  if (loading) {
    return <PageLoader text="Chargement des utilisateurs..." />;
  }

  const actifs = users.filter(u => u.actif).length;
  const inactifs = users.filter(u => !u.actif).length;

  const getRoleBadge = (role) => {
    const styles = {
      ETUDIANT: 'bg-green-dim text-green',
      CUISINIER: 'bg-orange-dim text-orange',
      ADMINISTRATEUR: 'bg-blue-dim text-blue',
      SUPER_ADMIN: 'bg-gold-dim text-gold',
      GESTIONNAIRE: 'bg-blue-dim text-blue'
    };
    return styles[role] || 'bg-bg3 text-text2';
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <span className="bg-green-dim text-green px-3 py-1 rounded-full text-xs">{actifs} actifs</span>
        <span className="bg-red-dim text-red px-3 py-1 rounded-full text-xs">{inactifs} inactifs</span>
      </div>
      
      <div className="bg-card border border-border rounded overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs text-text3 font-semibold uppercase border-b border-border">
              <th className="p-3">Nom</th>
              <th className="p-3">Email</th>
              <th className="p-3">Rôle</th>
              <th className="p-3">Date</th>
              <th className="p-3">Statut</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b border-border last:border-0">
                <td className="p-3 font-medium">{u.prenom} {u.nom}</td>
                <td className="p-3 text-text2">{u.email}</td>
                <td className="p-3">
                  <span className={`${getRoleBadge(u.role)} px-2 py-0.5 rounded text-xs`}>{u.role}</span>
                </td>
                <td className="p-3 text-text2 text-xs">{new Date(u.dateCreation).toLocaleDateString('fr-FR')}</td>
                <td className="p-3">
                  {u.actif 
                    ? <span className="bg-green-dim text-green px-2 py-0.5 rounded text-xs">Actif</span> 
                    : <span className="bg-red-dim text-red px-2 py-0.5 rounded text-xs">Inactif</span>
                  }
                </td>
                <td className="p-3">
                  {currentUser?.role === 'SUPER_ADMIN' && u.id !== currentUser.id && (
                    <button 
                      onClick={() => toggleUser(u.id)} 
                      className={`px-3 py-1.5 rounded-sm text-xs ${u.actif ? 'bg-red-dim text-red' : 'bg-bg3 border border-border hover:border-green'}`}
                    >
                      {u.actif ? 'Désactiver' : 'Activer'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={modal === 'add'} onClose={() => { setModal(null); setForm({ nom: '', prenom: '', email: '', role: 'CUISINIER', poste: '' }); }} title="Ajouter staff">
        <form onSubmit={handleAdd}>
          <div className="grid grid-cols-2 gap-3 mb-3.5">
            <div>
              <label className="text-text2 text-xs block mb-1.5">Nom</label>
              <input 
                id="nom" 
                required 
                value={form.nom}
                onChange={(e) => setForm(prev => ({ ...prev, nom: e.target.value }))}
                className="w-full bg-bg3 border border-border rounded-sm p-2.5 text-sm" />
            </div>
            <div>
              <label className="text-text2 text-xs block mb-1.5">Prénom</label>
              <input 
                id="prenom" 
                required 
                value={form.prenom}
                onChange={(e) => setForm(prev => ({ ...prev, prenom: e.target.value }))}
                className="w-full bg-bg3 border border-border rounded-sm p-2.5 text-sm" />
            </div>
          </div>
          <div className="mb-3.5">
            <label className="text-text2 text-xs block mb-1.5">Email</label>
            <input 
              id="email" 
              type="email" 
              required 
              value={form.email}
              onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
              className="w-full bg-bg3 border border-border rounded-sm p-2.5 text-sm" />
          </div>
          <div className="mb-3.5">
            <label className="text-text2 text-xs block mb-1.5">Rôle</label>
            <select 
              id="role" 
              required 
              value={form.role}
              onChange={(e) => setForm(prev => ({ ...prev, role: e.target.value }))}
              className="w-full bg-bg3 border border-border rounded-sm p-2.5 text-sm">
              <option value="CUISINIER">Cuisinier</option>
              <option value="ADMINISTRATEUR">Administrateur</option>
              <option value="GESTIONNAIRE">Gestionnaire</option>
            </select>
          </div>
          <div className="mb-5">
            <label className="text-text2 text-xs block mb-1.5">Poste</label>
            <input 
              id="poste" 
              required 
              value={form.poste}
              onChange={(e) => setForm(prev => ({ ...prev, poste: e.target.value }))}
              className="w-full bg-bg3 border border-border rounded-sm p-2.5 text-sm" />
          </div>
          <button type="submit" className="w-full bg-green text-black py-2.5 rounded-sm font-medium">Ajouter</button>
        </form>
      </Modal>
    </div>
  );
};

export default Utilisateurs;