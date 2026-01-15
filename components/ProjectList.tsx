
import React, { useState, useEffect } from 'react';
import { Project } from '../types';
import { ICONS } from '../constants';
import { storageService } from '../services/storageService';

interface ProjectListProps {
  onSelectProject: (id: string) => void;
}

export const ProjectList: React.FC<ProjectListProps> = ({ onSelectProject }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  useEffect(() => {
    setProjects(storageService.getProjects());
  }, []);

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    const newProject: Project = {
      id: Math.random().toString(36).substr(2, 9),
      name: newProjectName,
      createdAt: new Date().toLocaleDateString('fr-FR'),
      sitePhoto: null,
      tasks: [],
      generatedImages: []
    };

    storageService.saveProject(newProject);
    setProjects([...projects, newProject]);
    setNewProjectName('');
    setIsCreating(false);
    onSelectProject(newProject.id);
  };

  const handleDeleteProject = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Supprimer définitivement ce projet ?')) {
      storageService.deleteProject(id);
      setProjects(projects.filter(p => p.id !== id));
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white p-8 rounded-[2rem] border border-stone-100 shadow-xl shadow-emerald-900/5 flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-stone-900 uppercase tracking-tighter leading-none">Mes Projets</h2>
          <p className="text-stone-400 font-medium mt-3 uppercase text-[10px] tracking-[0.2em]">Tableau de bord de vos créations</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest transition-all shadow-xl shadow-emerald-600/20 flex items-center gap-3 active:scale-95"
        >
          {ICONS.Plus} Nouveau Projet
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {projects.map(project => (
          <div
            key={project.id}
            onClick={() => onSelectProject(project.id)}
            className="group bg-white rounded-[2.5rem] border border-stone-100 shadow-lg shadow-emerald-900/5 overflow-hidden cursor-pointer transition-all hover:-translate-y-2 hover:shadow-2xl hover:shadow-emerald-900/10"
          >
            <div className="aspect-[16/10] bg-stone-50 relative overflow-hidden border-b border-stone-50">
              {project.sitePhoto || (project.generatedImages.length > 0) ? (
                <img 
                  src={project.generatedImages[project.generatedImages.length - 1] || project.sitePhoto!} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-stone-200 gap-3">
                  <div className="p-4 bg-white rounded-2xl shadow-sm">{ICONS.Quote}</div>
                  <p className="text-[10px] font-black uppercase tracking-widest">Aucun visuel</p>
                </div>
              )}
              <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => handleDeleteProject(e, project.id)}
                  className="p-3 bg-white/90 backdrop-blur-sm text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-xl"
                >
                  {ICONS.Trash}
                </button>
              </div>
            </div>
            <div className="p-8">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-black text-stone-900 uppercase tracking-tighter group-hover:text-emerald-600 transition-colors">{project.name}</h3>
                  <p className="text-[10px] font-bold text-stone-400 mt-1 uppercase tracking-widest">Créé le {project.createdAt}</p>
                </div>
                <div className="text-emerald-600">
                  {ICONS.Next}
                </div>
              </div>
              <div className="mt-6 flex items-center gap-4">
                <div className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[9px] font-black uppercase tracking-widest">
                  {project.tasks.length} Matériaux
                </div>
                <div className="px-3 py-1 bg-stone-100 text-stone-500 rounded-full text-[9px] font-black uppercase tracking-widest">
                  {project.generatedImages.length} Rendus
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isCreating && (
        <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300 shadow-2xl">
            <div className="p-10 text-center space-y-6">
              <div className="mx-auto w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-xl rotate-3">
                {ICONS.Leaf}
              </div>
              <div>
                <h2 className="text-2xl font-black text-stone-900 uppercase tracking-tighter">Nouveau Projet</h2>
                <p className="text-stone-400 text-sm mt-2">Donnez un nom à votre future création</p>
              </div>
              <form onSubmit={handleCreateProject} className="space-y-4">
                <input
                  autoFocus
                  required
                  type="text"
                  placeholder="Ex: Villa du Lac, Jardin Japonais..."
                  className="w-full px-6 py-4 bg-stone-50 border border-stone-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-stone-800"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                />
                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="flex-1 py-4 border-2 border-stone-100 text-stone-400 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-stone-50 transition-all"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-emerald-600/20 transition-all"
                  >
                    Créer le Studio
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
