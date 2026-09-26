import React, { useState } from 'react';
import LoginScreen from './pages/Auth/LoginScreen';
import RegisterScreen from './pages/Auth/RegisterScreen';

function App() {
  const [currentScreen, setCurrentScreen] = useState('login'); // 'login' o 'register'

  return (
    <div style={{ height: "100vh", width: "100vw", margin: 0, padding: 0 }}>
      {currentScreen === 'login' ? (
        <LoginScreen 
          onLogin={() => alert("Login exitoso")} 
          onGoToRegister={() => setCurrentScreen('register')} 
        />
      ) : (
        <RegisterScreen 
          onRegister={() => alert("Registro exitoso")} 
          onGoToLogin={() => setCurrentScreen('login')} 
        />
      )}
    </div>
  );
}

export default App;
