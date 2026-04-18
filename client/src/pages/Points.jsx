import { useAuth } from '../context/AuthContext';

const Points = () => {
  const { user } = useAuth();
  const pts = user?.pointsESMT || 0;
  const niveau = user?.niveauFidelite || 'BRONZE';

  const niveaux = {
    BRONZE: { icon: '🥉', seuil: 200, color: '#CD7F32' },
    ARGENT: { icon: '🥈', seuil: 500, color: '#C0C0C0' },
    OR: { icon: '🥇', seuil: 1000, color: '#F5C842' }
  };

  const n = niveaux[niveau] || niveaux.BRONZE;
  const avantages = {
    BRONZE: ['10% de réduction le vendredi', 'Accès priorité file'],
    ARGENT: ['15% de réduction', 'Dessert offert', 'Accès priorité'],
    OR: ['20% de réduction', 'Menu spécial', 'Invité gratuit/mois', 'Badge exclusif']
  };

  const progressPercent = Math.min(100, (pts / n.seuil) * 100);

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 mb-5">
        <div className="bg-card border border-border rounded-lg p-8 text-center">
          <div className="w-24 h-24 border-4 border-green rounded-full flex flex-col items-center justify-center mx-auto mb-4">
            <div className="font-syne font-bold text-2xl text-green">{pts}</div>
            <div className="text-xs text-text3">points</div>
          </div>
          <div className="font-syne font-bold text-xl mb-1">{n.icon} Niveau {niveau}</div>
          <div className="text-text2 text-xs">Prochain: {n.seuil > pts ? n.seuil - pts + ' pts requis' : 'Max atteint !'}</div>
          <div className="h-2 bg-bg3 rounded mt-3 overflow-hidden">
            <div className="h-full bg-green rounded transition-all duration-500" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
        <div className="bg-card border border-border rounded-lg p-5">
          <div className="font-syne font-semibold mb-4">🎁 Avantages {niveau}</div>
          {avantages[niveau].map((a, i) => (
            <div key={i} className="py-2.5 border-b border-border text-text2 text-sm">✓ {a}</div>
          ))}
        </div>
      </div>
      <div className="bg-card border border-border rounded-lg p-5">
        <div className="font-syne font-semibold mb-4">Comment gagner des points</div>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-4 bg-bg3 rounded-sm">
            <div className="text-2xl mb-2">🛒</div>
            <div className="font-semibold text-sm">Commande</div>
            <div className="text-text2 text-xs">+10 pts</div>
          </div>
          <div className="text-center p-4 bg-bg3 rounded-sm">
            <div className="text-2xl mb-2">⏰</div>
            <div className="font-semibold text-sm">Créneau calme</div>
            <div className="text-text2 text-xs">+15 à +20 pts</div>
          </div>
          <div className="text-center p-4 bg-bg3 rounded-sm">
            <div className="text-2xl mb-2">📝</div>
            <div className="font-semibold text-sm">Feedback</div>
            <div className="text-text2 text-xs">+5 pts</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Points;