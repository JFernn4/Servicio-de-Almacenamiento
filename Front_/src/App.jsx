import React, { useState } from 'react';
import LoginScreen from './pages/Auth/LoginScreen';
import RegisterScreen from './pages/Auth/RegisterScreen';
import DashboardScreen from './pages/Dashboard/DashboardScreen';

function App() {
  const [currentScreen, setCurrentScreen] = useState('login'); // 'login', 'register', o 'dashboard'
  const [currentUser, setCurrentUser] = useState({ name: 'Carlos Alvarado', initials: 'CA', role: 'Cliente' });

  return (
    <div style={{ height: "100vh", width: "100vw", margin: 0, padding: 0 }}>
      {currentScreen === 'login' ? (
        <LoginScreen 
          onLogin={(user) => { if(user) setCurrentUser(user); setCurrentScreen('dashboard'); }} 
          onGoToRegister={() => setCurrentScreen('register')} 
        />
      ) : currentScreen === 'register' ? (
        <RegisterScreen 
          onRegister={(user) => { if(user) setCurrentUser(user); setCurrentScreen('dashboard'); }} 
          onGoToLogin={() => setCurrentScreen('login')} 
        />
      ) : (
        <DashboardScreen 
          user={currentUser}
          onLogout={() => setCurrentScreen('login')}
        />
      )}
    </div>
  );
}

export default App;
