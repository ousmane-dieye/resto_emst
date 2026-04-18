import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const Auth = ({ register: isRegister = false }) => {
  const { login, register: registerUser } = useAuth();
  const { success, error: showError } = useToast();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(!isRegister);
  const [loading, setLoading] = useState(false);
  const [selectedAllergenes, setSelectedAllergenes] = useState([]);

  const allergenes = ['Arachides', 'Lactose', 'Gluten', 'Fruits de mer', 'Œufs', 'Soja'];

  const toggleAllerg = (a) => {
    setSelectedAllergenes(prev => 
      prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]
    );
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(document.getElementById('email').value, document.getElementById('password').value);
      success('Connexion réussie !');
    } catch (err) {
      showError(err.message || 'Erreur de connexion');
    }
    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await registerUser({
        nom: document.getElementById('nom').value,
        prenom: document.getElementById('prenom').value,
        email: document.getElementById('email').value,
        motDePasse: document.getElementById('password').value,
        numeroEtudiant: document.getElementById('num').value,
        classe: document.getElementById('classe').value,
        filiere: document.getElementById('filiere').value,
        allergenes: selectedAllergenes,
        autresRestrictions: document.getElementById('autres').value,
      });
      success('Compte créé ! Connectez-vous.');
      setIsLogin(true);
    } catch (err) {
      showError(err.message || 'Erreur d\'inscription');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-5 relative overflow-hidden">
      <div className="absolute w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(46,204,122,0.06),transparent_70%)] -top-25 -right-25 pointer-events-none" />
      <div className="bg-card border border-border rounded-lg p-10 w-full max-w-md relative">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-green rounded-2xl flex items-center justify-center text-2xl mx-auto mb-3">🍽</div>
          <div className="font-syne font-bold text-xl">SmartResto ESMT</div>
          <div className="text-text2 text-sm mt-1">Votre cantine intelligente</div>
        </div>
        <div className="flex bg-bg3 rounded-sm p-1 mb-6">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 text-center py-2 rounded text-sm font-medium transition-all ${isLogin ? 'bg-card text-text shadow' : 'text-text2'}`}
          >
            Connexion
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 text-center py-2 rounded text-sm font-medium transition-all ${!isLogin ? 'bg-card text-text shadow' : 'text-text2'}`}
          >
            Inscription
          </button>
        </div>
        {isLogin ? (
          <form onSubmit={handleLogin}>
            <div className="mb-3.5">
              <label className="text-text2 text-xs block mb-1.5">Email institutionnel</label>
              <input id="email" type="email" placeholder="prenom.nom@esmt.sn" required
                className="w-full bg-bg3 border border-border rounded-sm p-2.5 text-sm text-text outline-none focus:border-green" />
            </div>
            <div className="mb-5">
              <label className="text-text2 text-xs block mb-1.5">Mot de passe</label>
              <input id="password" type="password" placeholder="••••••••" required
                className="w-full bg-bg3 border border-border rounded-sm p-2.5 text-sm text-text outline-none focus:border-green" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-green text-black py-2.5 rounded-sm font-medium hover:bg-[#36e085] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {loading && <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />}
              Se connecter
            </button>
            <p className="text-xs text-text2 mt-3 text-center">
              Comptes démo: admin@esmt.sn / admin123 • cuisinier@esmt.sn / cuisine123
            </p>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <div className="grid grid-cols-2 gap-3 mb-3.5">
              <div>
                <label className="text-text2 text-xs block mb-1.5">Nom</label>
                <input id="nom" placeholder="Diallo" required
                  className="w-full bg-bg3 border border-border rounded-sm p-2.5 text-sm text-text outline-none focus:border-green" />
              </div>
              <div>
                <label className="text-text2 text-xs block mb-1.5">Prénom</label>
                <input id="prenom" placeholder="Fatou" required
                  className="w-full bg-bg3 border border-border rounded-sm p-2.5 text-sm text-text outline-none focus:border-green" />
              </div>
            </div>
            <div className="mb-3.5">
              <label className="text-text2 text-xs block mb-1.5">Email ESMT</label>
              <input id="email" type="email" placeholder="fatou.diallo@esmt.sn" required
                className="w-full bg-bg3 border border-border rounded-sm p-2.5 text-sm text-text outline-none focus:border-green" />
            </div>
            <div className="mb-3.5">
              <label className="text-text2 text-xs block mb-1.5">Mot de passe</label>
              <input id="password" type="password" placeholder="••••••••" required
                className="w-full bg-bg3 border border-border rounded-sm p-2.5 text-sm text-text outline-none focus:border-green" />
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3.5">
              <div>
                <label className="text-text2 text-xs block mb-1.5">Numéro étudiant</label>
                <input id="num" placeholder="ESMT-2024-XXX"
                  className="w-full bg-bg3 border border-border rounded-sm p-2.5 text-sm text-text outline-none focus:border-green" />
              </div>
              <div>
                <label className="text-text2 text-xs block mb-1.5">Classe</label>
                <input id="classe" placeholder="MBA1"
                  className="w-full bg-bg3 border border-border rounded-sm p-2.5 text-sm text-text outline-none focus:border-green" />
              </div>
            </div>
            <div className="mb-3.5">
              <label className="text-text2 text-xs block mb-1.5">Filière</label>
              <input id="filiere" placeholder="Marketing Digital"
                className="w-full bg-bg3 border border-border rounded-sm p-2.5 text-sm text-text outline-none focus:border-green" />
            </div>
            <div className="mb-3.5">
              <label className="text-text2 text-xs block mb-1.5">⚠️ Mes allergènes</label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {allergenes.map(a => (
                  <div key={a} onClick={() => toggleAllerg(a)}
                    className={`p-2 text-xs bg-bg3 border border-border rounded-sm cursor-pointer transition-all ${
                      selectedAllergenes.includes(a) ? 'bg-red-dim border-red text-red' : ''
                    }`}>
                    {a}
                  </div>
                ))}
              </div>
            </div>
            <div className="mb-5">
              <label className="text-text2 text-xs block mb-1.5">Autres restrictions</label>
              <textarea id="autres" placeholder="Végétarien, halal..."
                className="w-full bg-bg3 border border-border rounded-sm p-2.5 text-sm text-text outline-none focus:border-green resize-none h-20" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-green text-black py-2.5 rounded-sm font-medium hover:bg-[#36e085] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {loading && <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />}
              Créer mon compte
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Auth;