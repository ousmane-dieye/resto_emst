import { Component } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ToastContainer from './components/Toast';
import Layout from './components/Layout';
import ErrorFallback from './components/ErrorFallback';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Menu from './pages/Menu';
import Commandes from './pages/Commandes';
import Points from './pages/Points';
import Notifications from './pages/Notifications';
import Cuisine from './pages/Cuisine';
import Stocks from './pages/Stocks';
import Fournisseurs from './pages/Fournisseurs';
import Utilisateurs from './pages/Utilisateurs';
import Prediction from './pages/Prediction';
import { useAuth } from './context/AuthContext';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback message="Une erreur inattendue s'est produite" />;
    }
    return this.props.children;
  }
}

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen bg-bg flex items-center justify-center"><div className="w-8 h-8 border-2 border-bg3 border-t-green rounded-full animate-spin" /></div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen bg-bg flex items-center justify-center"><div className="w-8 h-8 border-2 border-bg3 border-t-green rounded-full animate-spin" /></div>;
  }

  if (user) {
    return <Navigate to={getHomePage(user)} replace />;
  }

  return children;
};

const getHomePage = (user) => {
  const pages = {
    ETUDIANT: '/menu',
    CUISINIER: '/cuisine',
    ADMINISTRATEUR: '/dashboard',
    GESTIONNAIRE: '/stocks',
    SUPER_ADMIN: '/dashboard',
  };
  return pages[user.role] || '/menu';
};

const AppRoutes = () => {
  const { user } = useAuth();
  const homePage = getHomePage(user);

  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Auth /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Auth register /></PublicRoute>} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/menu" element={<Menu />} />
                <Route path="/commandes" element={<Commandes />} />
                <Route path="/points" element={<Points />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/cuisine" element={<Cuisine />} />
                <Route path="/stocks" element={<Stocks />} />
                <Route path="/fournisseurs" element={<Fournisseurs />} />
                <Route path="/utilisateurs" element={<Utilisateurs />} />
                <Route path="/prediction" element={<Prediction />} />
                <Route path="*" element={<Navigate to={homePage} replace />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

const App = () => {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <AppRoutes />
            <ToastContainer />
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default App;