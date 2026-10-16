import { useState, useEffect } from 'react';
import LoginScreen from './pages/Auth/LoginScreen';
import RegisterScreen from './pages/Auth/RegisterScreen';
import ForgotPasswordScreen from './pages/Auth/ForgotPasswordScreen';
import ResetPasswordScreen from './pages/Auth/ResetPasswordScreen';
import VerifyEmailScreen from './pages/Auth/VerifyEmailScreen';
import SharedFileScreen from './pages/Auth/SharedFileScreen';
import DashboardScreen from './pages/Dashboard/DashboardScreen';
import { clearSession, getProfile } from './services/authService';
import { colors } from './styles/theme';

// Pantallas que se abren desde un enlace de correo: ?mode=<pantalla>&token=...
const EMAIL_LINK_SCREENS = ['reset-password', 'verify-email', 'shared-file'];

/**
 * Pantalla inicial según la URL. Se lee una sola vez, al cargar la aplicación.
 */
function readInitialScreen() {
  const params = new URLSearchParams(window.location.search);
  const mode = params.get('mode');
  const token = params.get('token');
  return EMAIL_LINK_SCREENS.includes(mode) && token ? { screen: mode, token } : { screen: 'login', token: '' };
}

const initial = readInitialScreen();

function App() {
  // 'login' | 'register' | 'forgot-password' | 'reset-password' | 'verify-email' | 'shared-file'
  const [currentScreen, setCurrentScreen] = useState(initial.screen);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Validar la sesión guardada al abrir la aplicación
  useEffect(() => {
    getProfile().then((activeUser) => {
      setUser(activeUser);
      setLoading(false);
    });
  }, []);

  // Cambia de pantalla y quita de la URL el token del enlace del correo
  function navigate(screen) {
    setCurrentScreen(screen);
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  function handleLogout() {
    clearSession();
    setUser(null);
    navigate('login');
  }

  // Al salir de la verificación con sesión abierta, recargar el perfil (correo ya verificado)
  async function leaveVerification() {
    navigate('login');
    setUser(await getProfile());
  }

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC', color: colors.primary, fontWeight: 600 }}>
        Cargando VinCloud...
      </div>
    );
  }

  // Los enlaces de correo se atienden aunque haya una sesión abierta
  if (currentScreen === 'verify-email') {
    return (
      <VerifyEmailScreen
        token={initial.token}
        onGoToLogin={() => navigate('login')}
        onGoToDashboard={user ? leaveVerification : null}
      />
    );
  }
  if (currentScreen === 'reset-password') {
    return <ResetPasswordScreen token={initial.token} onGoToLogin={() => navigate('login')} />;
  }
  if (currentScreen === 'shared-file') {
    return <SharedFileScreen token={initial.token} onGoToLogin={() => navigate('login')} />;
  }

  if (user) {
    return (
      <DashboardScreen
        user={user}
        onLogout={handleLogout}
        onRefreshUser={async () => setUser(await getProfile())}
      />
    );
  }

  if (currentScreen === 'register') {
    return <RegisterScreen onRegister={setUser} onGoToLogin={() => navigate('login')} />;
  }
  if (currentScreen === 'forgot-password') {
    return <ForgotPasswordScreen onGoToLogin={() => navigate('login')} />;
  }
  return (
    <LoginScreen
      onLogin={setUser}
      onGoToRegister={() => navigate('register')}
      onGoToForgotPassword={() => navigate('forgot-password')}
    />
  );
}

export default App;
