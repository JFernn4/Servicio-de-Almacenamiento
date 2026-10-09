import { useState, useEffect } from 'react';
import LoginScreen from './pages/Auth/LoginScreen';
import RegisterScreen from './pages/Auth/RegisterScreen';
import DashboardScreen from './pages/Dashboard/DashboardScreen';
import { clearSession, getProfile } from './services/authService';
import { colors } from './styles/theme';

function App() {
  const [authScreen, setAuthScreen] = useState('login'); // 'login' | 'register'
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Validar la sesión guardada al abrir la aplicación
  useEffect(() => {
    getProfile().then((activeUser) => {
      setUser(activeUser);
      setLoading(false);
    });
  }, []);

  function handleLogout() {
    clearSession();
    setUser(null);
    setAuthScreen('login');
  }

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC', color: colors.primary, fontWeight: 600 }}>
        Cargando VinCloud...
      </div>
    );
  }

  if (user) {
    return <DashboardScreen user={user} onLogout={handleLogout} />;
  }

  return authScreen === 'login' ? (
    <LoginScreen onLogin={setUser} onGoToRegister={() => setAuthScreen('register')} />
  ) : (
    <RegisterScreen onRegister={setUser} onGoToLogin={() => setAuthScreen('login')} />
  );
}

export default App;
