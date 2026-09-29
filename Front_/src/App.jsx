import React, { useState, useEffect } from 'react';
import LoginScreen from './pages/Auth/LoginScreen';
import RegisterScreen from './pages/Auth/RegisterScreen';
import DashboardScreen from './pages/Dashboard/DashboardScreen';
import { getCurrentUser, clearSession, getProfile } from './services/authService';

function App() {
  const [currentScreen, setCurrentScreen] = useState('login'); // 'login' | 'register'
  const [user, setUser] = useState(() => getCurrentUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Sincronizar o validar sesión guardada
    async function syncSession() {
      const activeUser = await getProfile();
      if (activeUser) {
        setUser(activeUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    }

    syncSession();
  }, []);

  function handleAuthSuccess(authenticatedUser) {
    setUser(authenticatedUser);
  }

  function handleLogout() {
    clearSession();
    setUser(null);
    setCurrentScreen('login');
  }

  if (loading) {
    return (
      <div style={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#F8FAFC",
        color: "#7D1535",
        fontWeight: 600,
        fontFamily: "'Inter', sans-serif"
      }}>
        Cargando VinCloud...
      </div>
    );
  }

  if (user) {
    return <DashboardScreen user={user} onLogout={handleLogout} />;
  }

  return (
    <div style={{ height: "100vh", width: "100vw", margin: 0, padding: 0 }}>
      {currentScreen === 'login' ? (
        <LoginScreen 
          onLogin={handleAuthSuccess} 
          onGoToRegister={() => setCurrentScreen('register')} 
        />
      ) : (
        <RegisterScreen 
          onRegister={handleAuthSuccess} 
          onGoToLogin={() => setCurrentScreen('login')} 
        />
      )}
    </div>
  );
}

export default App;
