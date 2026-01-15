
import React, { useState, useEffect } from 'react';
import { View, User } from './types';
import { Sidebar } from './components/Sidebar';
import { ProjectMatcher } from './components/ProjectMatcher';
import { ProjectList } from './components/ProjectList';
import { Inventory } from './components/Inventory';
import { Login } from './components/Login';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('projects');
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('garden_auth');
    if (saved) setUser(JSON.parse(saved));
  }, []);

  const handleLogin = (name: string, email: string) => {
    const newUser = { name, email };
    setUser(newUser);
    localStorage.setItem('garden_auth', JSON.stringify(newUser));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('garden_auth');
  };

  const handleSelectProject = (id: string) => {
    setActiveProjectId(id);
    setCurrentView('matcher');
  };

  const handleBackToProjects = () => {
    setActiveProjectId(null);
    setCurrentView('projects');
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-stone-50">
      <Sidebar 
        currentView={currentView} 
        onViewChange={(v) => {
          setCurrentView(v);
          if (v !== 'matcher') setActiveProjectId(null);
        }} 
        user={user} 
        onLogout={handleLogout} 
      />
      
      <main className="ml-64 flex-1 h-full overflow-hidden relative flex flex-col">
        <div className="absolute inset-0 pointer-events-none opacity-[0.02]" 
             style={{ backgroundImage: 'radial-gradient(#065f46 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        
        <div className="flex-1 overflow-auto custom-scrollbar relative z-10">
          <div className="max-w-[1500px] mx-auto p-8">
            {currentView === 'projects' && (
              <ProjectList onSelectProject={handleSelectProject} />
            )}
            {currentView === 'matcher' && activeProjectId && (
              <ProjectMatcher projectId={activeProjectId} onBack={handleBackToProjects} />
            )}
            {currentView === 'inventory' && (
              <Inventory />
            )}
          </div>
        </div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
      `}</style>
    </div>
  );
};

export default App;
