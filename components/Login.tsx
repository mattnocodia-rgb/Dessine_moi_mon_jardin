
import React, { useState } from 'react';
import { ICONS } from '../constants';

interface LoginProps {
  onLogin: (name: string, email: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Identifiants en dur demandés : admin@admin.fr / admin
    if (email === 'admin@admin.fr' && password === 'admin') {
      setError(null);
      onLogin("Administrateur Studio", email);
    } else {
      setError("Identifiants incorrects. Veuillez réessayer.");
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-stone-50 relative overflow-hidden">
      {/* Texture de fond */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#059669 0.5px, transparent 0.5px)', backgroundSize: '32px 32px' }} />
      
      <div className="w-full max-w-md p-8 relative z-10">
        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-emerald-900/10 border border-stone-100 overflow-hidden animate-in fade-in zoom-in duration-500">
          <div className="p-10 text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-emerald-600/20 rotate-3">
              {ICONS.Leaf}
            </div>
            <div>
              <h2 className="text-3xl font-black text-stone-900 tracking-tighter uppercase">Connexion</h2>
              <p className="text-stone-400 font-medium text-sm mt-2">Accédez à votre espace "Dessine moi un jardin"</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 text-red-600 text-xs font-bold animate-in slide-in-from-top-2">
                {ICONS.Missing}
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="text-left space-y-1">
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-4">Email Professionnel</label>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-6 py-4 bg-stone-50 border border-stone-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium"
                  placeholder="admin@admin.fr"
                />
              </div>
              <div className="text-left space-y-1">
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest ml-4">Mot de passe</label>
                <input
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-6 py-4 bg-stone-50 border border-stone-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium"
                  placeholder="••••••••"
                />
              </div>
              <button
                type="submit"
                className="w-full py-4 bg-stone-900 hover:bg-black text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-stone-900/20 active:scale-95 mt-4"
              >
                Se connecter au Studio
              </button>
            </form>
          </div>
          <div className="p-6 bg-emerald-50 border-t border-emerald-100 text-center">
            <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest">Architectural precision studio</p>
          </div>
        </div>
      </div>
    </div>
  );
};
