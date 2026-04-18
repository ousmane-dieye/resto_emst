import { useState, useEffect } from 'react';

const ErrorFallback = ({ message = "Connexion au serveur impossible", onRetry }) => {
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    const checkConnection = async () => {
      try {
        await fetch('/api/auth/me', { method: 'GET' });
      } catch (err) {
        console.log('API non disponible');
      } finally {
        setLoading(false);
      }
    };
    checkConnection();
  }, []);

  const handleRetry = async () => {
    setRetrying(true);
    await checkConnection();
    if (onRetry) onRetry();
    setRetrying(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0F0E] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#2A3530] border-t-[#2ECC7A] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F0E] flex items-center justify-center p-5">
      <div className="bg-[#161C19] border border-[#2A3530] rounded-lg p-8 text-center max-w-md">
        <div className="text-5xl mb-4">🔌</div>
        <h1 className="text-xl font-bold text-[#E8EDE9] mb-2">Connexion problème</h1>
        <p className="text-[#8FA898] text-sm mb-6">{message}</p>
        <div className="text-xs text-[#5A7065] mb-6">
          <p>Vérifiez que le serveur backend est actif sur localhost:3001</p>
          <p className="mt-2">Ou lancez: <code className="bg-[#1A201D] px-1 rounded">npm run dev</code></p>
        </div>
        <button 
          onClick={handleRetry}
          disabled={retrying}
          className="px-6 py-2.5 bg-[#2ECC7A] text-black rounded font-medium hover:bg-[#36e085] transition-all disabled:opacity-50"
        >
          {retrying ? 'Vérification...' : 'Réessayer'}
        </button>
      </div>
    </div>
  );
};

export default ErrorFallback;