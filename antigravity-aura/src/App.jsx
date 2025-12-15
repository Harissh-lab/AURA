import React, { useState, useEffect } from 'react';
import Login from './pages/Auth/Login';
import Dashboard from './pages/Home/Dashboard'; // <--- Make sure this is imported
// import ChatWindow from './components/Chat/ChatWindow'; <--- You can remove this now

import { onAuthChange } from './services/authService';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      setIsAuthenticated(!!user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
          <p className="text-slate-300">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {isAuthenticated ? (
        <Dashboard /> 
      ) : (
        <Login onLogin={() => setIsAuthenticated(true)} />
      )}
    </>
  );
};

export default App;