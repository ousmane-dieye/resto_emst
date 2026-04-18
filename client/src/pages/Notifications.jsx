import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PageLoader } from '../components/Loading';
import { notificationsApi } from '../services/api';

const Notifications = () => {
  const { success } = useToast();
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await notificationsApi.getAll();
      setNotifs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markRead = async (id) => {
    try {
      await notificationsApi.markRead(id);
      setNotifs(prev => prev.map(n => n.id === id ? { ...n, lue: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllRead = async () => {
    try {
      await notificationsApi.markAllRead();
      setNotifs(prev => prev.map(n => ({ ...n, lue: true })));
      success('Toutes les notifications marquées comme lues');
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <PageLoader text="Chargement des notifications..." />;
  }

  const unreadCount = notifs.filter(n => !n.lue).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="text-text2 text-sm">{unreadCount} non lues</span>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="px-3 py-1.5 bg-bg3 border border-border rounded-sm text-xs hover:border-green hover:text-green">
            Tout marquer lu
          </button>
        )}
      </div>
      
      {notifs.length === 0 ? (
        <div className="text-center py-10 text-text3">
          <div className="text-4xl mb-2">🔔</div>
          <p>Aucune notification</p>
        </div>
      ) : (
        notifs.map(n => (
          <div 
            key={n.id} 
            onClick={() => markRead(n.id)} 
            className={`flex items-start gap-3 p-3 bg-bg3 rounded-sm mb-2 cursor-pointer transition-all hover:bg-border ${n.lue ? 'opacity-50' : 'border-l-3 border-green'}`}
          >
            <div className="text-xl">{n.type === 'COMMANDE_CONFIRMEE' ? '✅' : '📢'}</div>
            <div className="flex-1">
              <div className="text-sm">{n.message}</div>
              <div className="text-xs text-text3 mt-2">{new Date(n.dateEnvoi).toLocaleString('fr-FR')}</div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default Notifications;