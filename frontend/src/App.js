import React, { useState } from 'react';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';

function App() {
  const [currentPage, setCurrentPage] = useState('landing');

  return (
    <div>
      {currentPage === 'landing' ? (
        <LandingPage onEnter={() => setCurrentPage('dashboard')} />
      ) : (
        <Dashboard onBack={() => setCurrentPage('landing')} />
      )}
    </div>
  );
}

export default App;
