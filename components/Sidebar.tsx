
import React, { useState, useEffect } from 'react';
import { View, User } from '../types';
import { ICONS } from '../constants';

interface SidebarProps {
  currentView: View;
  onViewChange: (view: View) => void;
  user: User | null;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, user, onLogout }) => {
  const [hasApiKey, setHasApiKey] = useState(false);

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio?.hasSelectedApiKey) {
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(selected);
      }
    };
    checkKey();
    const interval = setInterval(checkKey, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectKey = async () => {
    if (window.aistudio?.openSelectKey) {
      await window.aistudio.openSelectKey();
      setHasApiKey(true);
    }
  };

  return (
    <div className="w-64 bg-stone-900 h-full fixed left-0 top-0 flex flex-col text-white shadow-xl z-50">
      <div className="p-6 border-b border-stone-800 flex items-center gap-3">
        <div className="p-2 bg-emerald-600 rounded-lg shadow-lg shadow-emerald-900/20">
          {ICONS.Leaf}
        </div>
        <div>
          <h1 className="font-black text-sm tracking-widest leading-none uppercase">Dessine moi</h1>
          <h1 className="font-bold text-lg tracking-tight text-emerald-400">un jardin</h1>
        </div>
      </div>
      
      <nav className="flex-1 p-4 space-y-2 mt-4">
        <button
          onClick={() => onViewChange('projects')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
            currentView === 'projects' || currentView === 'matcher' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' : 'text-stone-400 hover:bg-stone-800 hover:text-white'
          }`}
        >
          {ICONS.Layout}
          <span className="font-bold text-sm uppercase tracking-wide">Mes Projets</span>
        </button>
        
        <button
          onClick={() => onViewChange('inventory')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
            currentView === 'inventory' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' : 'text-stone-400 hover:bg-stone-800 hover:text-white'
          }`}
        >
          {ICONS.Database}
          <span className="font-bold text-sm uppercase tracking-wide">Base Produits</span>
        </button>

        <div className="pt-8 px-2">
           <div className="text-[10px] font-black text-stone-600 uppercase tracking-widest mb-3 ml-2">Configuration</div>
           <button
            onClick={handleSelectKey}
            className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border transition-all ${
              hasApiKey 
                ? 'border-emerald-900/50 bg-emerald-900/10 text-emerald-400' 
                : 'border-red-900/50 bg-red-900/10 text-red-400 animate-pulse'
            }`}
          >
            <div className="flex items-center gap-3">
              {ICONS.Lock}
              <span className="font-bold text-[10px] uppercase tracking-widest">Clé API Gemini</span>
            </div>
            <div className={`w-2 h-2 rounded-full ${hasApiKey ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`} />
          </button>
          {!hasApiKey && (
            <p className="text-[8px] text-red-500/70 mt-2 px-2 italic">Facturation requise pour les rendus HD</p>
          )}
        </div>
      </nav>

      <div className="p-4 border-t border-stone-800 space-y-4">
        {user && (
          <div className="flex items-center gap-3 px-2 py-2 bg-stone-800/50 rounded-xl">
            <div className="w-8 h-8 bg-emerald-700 rounded-full flex items-center justify-center text-[10px] font-black">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate">{user.name}</p>
              <button onClick={onLogout} className="text-[10px] text-emerald-500 font-bold hover:underline">Déconnexion</button>
            </div>
          </div>
        )}
        <div className="text-stone-500 text-[10px] font-medium tracking-wide">
          <p>&copy; 2024 Dessine moi un jardin</p>
        </div>
      </div>
    </div>
  );
};
