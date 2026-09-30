import React, { useState, useEffect } from 'react';
import LoginScreen from './pages/Auth/LoginScreen';
import RegisterScreen from './pages/Auth/RegisterScreen';
import ForgotPasswordScreen from './pages/Auth/ForgotPasswordScreen';
import ResetPasswordScreen from './pages/Auth/ResetPasswordScreen';
import VerifyEmailScreen from './pages/Auth/VerifyEmailScreen';
import DashboardScreen from './pages/Dashboard/DashboardScreen';
import { getCurrentUser, clearSession, getProfile } from './services/authService';

function App() {
  const [currentScreen, setCurrentScreen] = useState('login'); // 'login' | 'register' | 'forgot-password' | 'reset-password' | 'verify-email'
  const [urlToken, setUrlToken] = useState('');
  const [user, setUser] = useState(() => getCurrentUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Detectar parámetros en la URL (por ejemplo: ?mode=reset-password&token=... o ?mode=verify-email&token=...)
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');
    const token = params.get('token');

    if (mode === 'reset-password' && token) {
      setCurrentScreen('reset-password');
      setUrlToken(token);
    } else if (mode === 'verify-email' && token) {
      setCurrentScreen('verify-email');
      setUrlToken(token);
    }

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
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  function handleNavigate(screenName) {
    setCurrentScreen(screenName);
    window.history.replaceState({}, document.title, window.location.pathname);
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

  // Si no está en un flujo de verificación o reseteo por enlace directo, y está autenticado, mostrar Dashboard
  if (user && currentScreen !== 'verify-email' && currentScreen !== 'reset-password') {
    return <DashboardScreen user={user} onLogout={handleLogout} />;
  }

  return (
    <div style={{ height: "100vh", width: "100vw", margin: 0, padding: 0 }}>
      {currentScreen === 'login' && (
        <LoginScreen 
          onLogin={handleAuthSuccess} 
          onGoToRegister={() => handleNavigate('register')}
          onGoToForgotPassword={() => handleNavigate('forgot-password')}
        />
      )}

      {currentScreen === 'register' && (
        <RegisterScreen 
          onRegister={handleAuthSuccess} 
          onGoToLogin={() => handleNavigate('login')} 
        />
      )}

      {currentScreen === 'forgot-password' && (
        <ForgotPasswordScreen 
          onGoToLogin={() => handleNavigate('login')} 
        />
      )}

      {currentScreen === 'reset-password' && (
        <ResetPasswordScreen 
          token={urlToken}
          onGoToLogin={() => handleNavigate('login')} 
        />
      )}

      {currentScreen === 'verify-email' && (
        <VerifyEmailScreen 
          token={urlToken}
          onGoToLogin={() => handleNavigate('login')}
          onGoToDashboard={user ? () => handleNavigate('login') : null}
        />
      )}
    </div>
  );
}

export default App;
