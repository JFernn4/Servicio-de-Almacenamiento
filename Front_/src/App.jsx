import { useState, useEffect } from 'react';
import LandingScreen from './pages/Landing/LandingScreen';
import LoginScreen from './pages/Auth/LoginScreen';
import RegisterScreen from './pages/Auth/RegisterScreen';
import CheckEmailScreen from './pages/Auth/CheckEmailScreen';
import ForgotPasswordScreen from './pages/Auth/ForgotPasswordScreen';
import ResetPasswordScreen from './pages/Auth/ResetPasswordScreen';
import VerifyEmailScreen from './pages/Auth/VerifyEmailScreen';
import DashboardScreen from './pages/Dashboard/DashboardScreen';
import AdminView from './components/dashboard/views/AdminView';
import { clearSession, getProfile } from './services/authService';
import { colors } from './styles/theme';

// Pantallas que se abren desde un enlace de correo: ?mode=<pantalla>&token=...
const EMAIL_LINK_SCREENS = ['reset-password', 'verify-email'];

const DEMO_ADMIN_USER = {
  id: 'admin_demo',
  nombre: 'Administrador',
  correo: 'admin@vincloud.app',
  rol: 'admin',
  usadoGb: 0,
  limiteGb: 15,
};

const DEMO_CLIENT_USER = {
  id: 'client_demo',
  nombre: 'Usuario VinCloud',
  correo: 'usuario@vincloud.app',
  rol: 'Usuario',
  usadoGb: 0,
  limiteGb: 15,
};

/**
 * Pantalla inicial según la URL. Se lee una sola vez, al cargar la aplicación.
 */
function readInitialScreen() {
  const params = new URLSearchParams(window.location.search);
  const mode = params.get('mode');
  const token = params.get('token');
  if (EMAIL_LINK_SCREENS.includes(mode) && token) {
    return { screen: mode, token };
  }
  if (
    mode === 'login' ||
    mode === 'register' ||
    mode === 'forgot-password' ||
    mode === 'check-email' ||
    mode === 'admin' ||
    mode === 'dashboard'
  ) {
    return { screen: mode, token: '' };
  }
  return { screen: 'landing', token: '' };
}

const initial = readInitialScreen();

function App() {
  // 'landing' | 'login' | 'register' | 'check-email' | 'forgot-password' | 'reset-password' | 'verify-email' | 'admin'
  const [currentScreen, setCurrentScreen] = useState(initial.screen);
  const [user, setUser] = useState(null);
  const [pendingEmail, setPendingEmail] = useState('');
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
    navigate('landing');
  }

  function handleRegistered(email) {
    setPendingEmail(email);
    navigate('check-email');
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

  // Vista dedicada del Administrador del Sitio Web
  const isUserAdmin =
    user?.rol?.toLowerCase() === 'admin' || user?.rol?.toLowerCase() === 'administrador';
  if (currentScreen === 'admin' || isUserAdmin) {
    return <AdminView user={user || DEMO_ADMIN_USER} onLogout={handleLogout} />;
  }

  if (currentScreen === 'dashboard' || user) {
    return <DashboardScreen user={user || DEMO_CLIENT_USER} onLogout={handleLogout} />;
  }

  if (currentScreen === 'check-email') {
    return (
      <CheckEmailScreen
        email={pendingEmail}
        onGoToLogin={() => navigate('login')}
        onGoToRegister={() => navigate('register')}
        onGoToHome={() => navigate('landing')}
      />
    );
  }
  if (currentScreen === 'register') {
    return (
      <RegisterScreen
        onRegistered={handleRegistered}
        onGoToLogin={() => navigate('login')}
        onGoToHome={() => navigate('landing')}
      />
    );
  }
  if (currentScreen === 'forgot-password') {
    return (
      <ForgotPasswordScreen
        onGoToLogin={() => navigate('login')}
        onGoToHome={() => navigate('landing')}
      />
    );
  }
  if (currentScreen === 'login') {
    return (
      <LoginScreen
        onLogin={setUser}
        onGoToRegister={() => navigate('register')}
        onGoToForgotPassword={() => navigate('forgot-password')}
        onGoToHome={() => navigate('landing')}
      />
    );
  }

  return (
    <LandingScreen
      onGoToLogin={() => navigate('login')}
      onGoToRegister={() => navigate('register')}
    />
  );
}

export default App;
