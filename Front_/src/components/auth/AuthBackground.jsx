function AuthBackground() {
  return (
    <div style={{ 
      position: 'absolute', 
      top: 0, 
      left: 0, 
      width: '100%', 
      height: '100%', 
      zIndex: 0, 
      overflow: 'hidden', 
      backgroundColor: '#1F050E' 
    }}>
      <svg viewBox="0 0 1440 810" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
        <path fill="#250612">
          <animate attributeName="d" dur="15s" repeatCount="indefinite"
            values="M0,0 C300,200 500,600 800,810 L0,810 Z;
                    M0,0 C450,150 400,700 900,810 L0,810 Z;
                    M0,0 C300,200 500,600 800,810 L0,810 Z" />
        </path>
        <path fill="#2D0615">
          <animate attributeName="d" dur="20s" repeatCount="indefinite"
            values="M1440,0 C1100,100 900,500 600,810 L1440,810 Z;
                    M1440,0 C1200,200 800,600 500,810 L1440,810 Z;
                    M1440,0 C1100,100 900,500 600,810 L1440,810 Z" />
        </path>
        <path fill="#36081A">
          <animate attributeName="d" dur="12s" repeatCount="indefinite"
            values="M1440,400 C1100,500 1200,810 900,810 L1440,810 Z;
                    M1440,300 C1000,400 1300,700 800,810 L1440,810 Z;
                    M1440,400 C1100,500 1200,810 900,810 L1440,810 Z" />
        </path>
        <path fill="#3B0A1F" opacity="0.8">
          <animate attributeName="d" dur="18s" repeatCount="indefinite"
            values="M0,300 C200,400 100,700 400,810 L0,810 Z;
                    M0,200 C300,300 200,600 500,810 L0,810 Z;
                    M0,300 C200,400 100,700 400,810 L0,810 Z" />
        </path>
      </svg>
    </div>
  );
}

export default AuthBackground;
