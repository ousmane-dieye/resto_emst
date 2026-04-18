import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const { error: showError } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const role = user?.role;

  const navItems = {
    ETUDIANT: [
      { id: 'menu', icon: '🍽', label: 'Menu du jour' },
      { id: 'commandes', icon: '📋', label: 'Mes commandes' },
      { id: 'points', icon: '⭐', label: 'Mes points ESMT' },
      { id: 'notifications', icon: '🔔', label: 'Notifications' },
    ],
    CUISINIER: [
      { id: 'cuisine', icon: '👨‍🍳', label: 'Bons de préparation' },
      { id: 'menu', icon: '🍽', label: 'Gestion menu' },
      { id: 'prediction', icon: '🤖', label: 'Prédiction IA' },
    ],
    ADMINISTRATEUR: [
      { id: 'dashboard', icon: '📊', label: 'Dashboard' },
      { id: 'menu', icon: '🍽', label: 'Gestion menu' },
      { id: 'stocks', icon: '📦', label: 'Stocks' },
      { id: 'fournisseurs', icon: '🚚', label: 'Fournisseurs' },
      { id: 'utilisateurs', icon: '👥', label: 'Utilisateurs' },
      { id: 'prediction', icon: '🤖', label: 'Prédiction IA' },
    ],
    GESTIONNAIRE: [
      { id: 'stocks', icon: '📦', label: 'Stocks' },
      { id: 'fournisseurs', icon: '🚚', label: 'Fournisseurs' },
    ],
    SUPER_ADMIN: [
      { id: 'dashboard', icon: '📊', label: 'Dashboard' },
      { id: 'menu', icon: '🍽', label: 'Gestion menu' },
      { id: 'cuisine', icon: '👨‍🍳', label: 'Cuisine' },
      { id: 'stocks', icon: '📦', label: 'Stocks' },
      { id: 'fournisseurs', icon: '🚚', label: 'Fournisseurs' },
      { id: 'utilisateurs', icon: '👥', label: 'Utilisateurs' },
      { id: 'prediction', icon: '🤖', label: 'Prédiction IA' },
    ],
  };

  const items = navItems[role] || navItems.ETUDIANT;
  const currentPage = location.pathname.slice(1);

  const titles = {
    menu: 'Menu du jour', commandes: 'Mes commandes', points: 'Points ESMT',
    dashboard: 'Dashboard', cuisine: 'Bons de préparation', stocks: 'Gestion des stocks',
    fournisseurs: 'Fournisseurs', utilisateurs: 'Utilisateurs', prediction: 'Prédiction IA', notifications: 'Notifications'
  };

  const roleLabels = { ETUDIANT: 'Étudiant', CUISINIER: 'Cuisinier', ADMINISTRATEUR: 'Admin', SUPER_ADMIN: 'Super Admin', GESTIONNAIRE: 'Gestionnaire' };
  const roleColors = { ETUDIANT: 'green', CUISINIER: 'orange', ADMINISTRATEUR: 'blue', SUPER_ADMIN: 'gold', GESTIONNAIRE: 'blue' };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen">
      <aside className={`${sidebarOpen ? 'w-60' : 'w-0'} bg-bg2 border-r border-border fixed h-full z-100 transition-all duration-300 overflow-hidden`}>
        <div className="w-60 h-full flex flex-col">
          <div className="p-5 border-b border-border flex items-center gap-3">
            <div className="w-9 h-9 bg-green rounded-xl flex items-center justify-center text-xl">🍽</div>
            <div>
              <div className="font-syne font-bold text-sm">SmartResto</div>
              <div className="text-xs text-text3">ESMT — Dakar</div>
            </div>
          </div>
          <nav className="flex-1 p-3 flex flex-col gap-1">
            {items.map(item => (
              <button
                key={item.id}
                onClick={() => navigate('/' + item.id)}
                className={`flex items-center gap-2.5 p-2.5 rounded-sm text-left transition-all border-none bg-transparent w-full ${
                  currentPage === item.id ? 'bg-green-dim text-green font-medium' : 'text-text2 hover:bg-bg3 hover:text-text'
                }`}
              >
                <span className="w-5 text-center">{item.icon}</span>
                <span className="text-sm">{item.label}</span>
              </button>
            ))}
          </nav>
          <div className="p-3 border-t border-border">
            <div className="flex items-center gap-2.5 p-2.5 bg-bg3 rounded-sm">
              <div className="w-8 h-8 bg-green-dim rounded-full flex items-center justify-center text-sm font-bold text-green">
                {user?.prenom?.[0]}{user?.nom?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{user?.prenom} {user?.nom}</div>
                <div className={`text-xs text-${roleColors[role]}`}>{roleLabels[role]}</div>
              </div>
              <button onClick={handleLogout} className="w-7 h-7 flex items-center justify-center border border-border rounded hover:border-green hover:text-green bg-transparent text-text2">↩</button>
            </div>
          </div>
        </div>
      </aside>
      <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-60' : 'ml-0'}`}>
        <div className="sticky top-0 bg-bg2 border-b border-border p-4 flex items-center justify-between z-50">
          <div className="flex items-center gap-2">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="w-9 h-9 flex items-center justify-center border border-border rounded hover:border-green bg-bg3 text-text2">☰</button>
            <h2 className="font-syne font-bold text-lg">{titles[currentPage] || 'SmartResto'}</h2>
          </div>
          <div className="flex items-center gap-2">
            {user?.role === 'ETUDIANT' && (
              <span className="bg-gold-dim text-gold px-3 py-1 rounded-full text-xs font-medium">⭐ {user.pointsESMT || 0} pts</span>
            )}
            <span className="bg-green-dim text-green px-3 py-1 rounded-full text-xs">
              {new Date().toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
            </span>
          </div>
        </div>
        <div className="p-7 max-w-6xl">{children}</div>
      </main>
    </div>
  );
};

export default Layout;