
import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Product, ProjectTask, Project } from '../types';
import { ICONS } from '../constants';
import { geminiService } from '../services/geminiService';
import { storageService } from '../services/storageService';
import { ProductForm } from './ProductForm';
import * as XLSX from 'xlsx';

interface ProjectMatcherProps {
  projectId: string;
  onBack: () => void;
}

export const ProjectMatcher: React.FC<ProjectMatcherProps> = ({ projectId, onBack }) => {
  const [project, setProject] = useState<Project | null>(null);
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [importText, setImportText] = useState('');
  const [importMode, setImportMode] = useState<'ai' | 'excel'>('ai');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isVisualizing, setIsVisualizing] = useState(false);
  const [visualizationResult, setVisualizationResult] = useState<string | null>(null);
  const [isAddingProduct, setIsAddingProduct] = useState<string | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  useEffect(() => {
    const p = storageService.getProject(projectId);
    if (p) setProject(p);
    setCatalog(storageService.getProducts());
  }, [projectId]);

  const saveState = (updatedProject: Project) => {
    setProject(updatedProject);
    storageService.saveProject(updatedProject);
  };

  if (!project) return null;

  const handleImport = async () => {
    if (!importText.trim()) return;
    setIsProcessing(true);
    try {
      const parsedTasks = await geminiService.parseQuoteToTasks(importText);
      if (parsedTasks && parsedTasks.length > 0) {
        const newTasks: ProjectTask[] = parsedTasks.map(t => ({
          id: Math.random().toString(36).substr(2, 9),
          reference: t.reference || '',
          name: t.name || '',
          location: t.location || '',
          description: t.description || ''
        }));
        saveState({ ...project, tasks: [...project.tasks, ...newTasks] });
        setImportText('');
      }
    } catch (error: any) {
      console.error(error);
      if (error.message === "KEY_NOT_FOUND" && window.aistudio?.openSelectKey) {
        alert("Votre clé API n'est pas configurée ou a expiré. Veuillez sélectionner une clé valide.");
        await window.aistudio.openSelectKey();
      } else {
        alert("Erreur lors de l'analyse par l'IA. Vérifiez votre connexion.");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

        if (data.length < 1) {
          alert("Le fichier est vide.");
          return;
        }

        // Recherche des index des colonnes basés sur les en-têtes demandés
        const headers = data[0].map(h => String(h || "").trim().toLowerCase());
        
        const findIdx = (targets: string[]) => {
          return headers.findIndex(h => targets.includes(h));
        };

        const idxRef = findIdx(["référence", "reference", "ref", "réf"]);
        const idxName = findIdx(["désignation", "designation", "nom", "produit", "name"]);
        const idxLoc = findIdx(["lieu", "localisation", "location", "emplacement"]);
        const idxDesc = findIdx(["description", "détails", "details", "quantité", "qté"]);
        const idxTex = findIdx(["texture", "visuel", "image"]);

        const rows = data.slice(1);
        const newTasks: ProjectTask[] = rows
          .map(row => {
            const ref = idxRef !== -1 ? String(row[idxRef] || "").trim() : "";
            const name = idxName !== -1 ? String(row[idxName] || "").trim() : "";
            const loc = idxLoc !== -1 ? String(row[idxLoc] || "").trim() : "";
            let desc = idxDesc !== -1 ? String(row[idxDesc] || "").trim() : "";
            
            if (idxTex !== -1 && row[idxTex]) {
              desc += (desc ? " | " : "") + "Texture: " + String(row[idxTex]);
            }

            return {
              id: Math.random().toString(36).substr(2, 9),
              reference: ref,
              name: name,
              location: loc,
              description: desc
            };
          })
          .filter(t => t.reference || t.name || t.location || t.description);

        if (newTasks.length > 0) {
          saveState({ ...project, tasks: [...project.tasks, ...newTasks] });
          alert(`${newTasks.length} éléments importés avec succès.`);
        } else {
          alert("Aucune donnée correspondante trouvée. Vérifiez vos en-têtes (Référence, Désignation, Lieu, Description, Texture).");
        }
      } catch (error) {
        console.error("Excel Import Error:", error);
        alert("Erreur lors de la lecture du fichier Excel/CSV.");
      }
      e.target.value = '';
    };
    reader.readAsBinaryString(file);
  };

  const addTask = () => {
    const newTask = { id: Math.random().toString(36).substr(2, 9), reference: '', name: '', location: '', description: '' };
    saveState({ ...project, tasks: [...project.tasks, newTask] });
  };

  const removeTask = (id: string) => {
    saveState({ ...project, tasks: project.tasks.filter(t => t.id !== id) });
  };

  const updateTask = (id: string, field: keyof ProjectTask, value: string) => {
    saveState({ ...project, tasks: project.tasks.map(t => t.id === id ? { ...t, [field]: value } : t) });
  };

  const selectProductForTask = (taskId: string, product: Product) => {
    saveState({ 
      ...project, 
      tasks: project.tasks.map(t => t.id === taskId ? { ...t, name: product.name, reference: product.reference } : t) 
    });
    setActiveDropdown(null);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => saveState({ ...project, sitePhoto: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateVisualization = async () => {
    if (!project.sitePhoto) return;
    const validMatches = project.tasks
      .map(t => ({ task: t, product: getMatch(t) }))
      .filter(m => m.product !== undefined) as { task: ProjectTask, product: Product }[];

    if (validMatches.length === 0) {
      alert("Veuillez d'abord sélectionner des produits de votre catalogue pour pouvoir générer le rendu.");
      return;
    }

    setIsVisualizing(true);
    try {
      const result = await geminiService.generateVisualization(
        project.sitePhoto, 
        validMatches.map(m => m.product), 
        validMatches.map(m => m.task)
      );
      
      if (result) {
        setVisualizationResult(result);
        saveState({ ...project, generatedImages: [...project.generatedImages, result] });
      } else {
        alert("Désolé, l'IA n'a pas pu traiter ce rendu. Réessayez avec une photo plus lumineuse.");
      }
    } catch (error: any) {
      if (error.message === "KEY_NOT_FOUND" && window.aistudio?.openSelectKey) {
        alert("Veuillez lier votre compte Google Cloud via le bouton 'Clé API Gemini' dans la barre latérale pour activer la génération d'images.");
        await window.aistudio.openSelectKey();
      } else {
        alert("Échec de l'appel à l'API Gemini. Veuillez réessayer.");
      }
    } finally {
      setIsVisualizing(false);
    }
  };

  const getMatch = (task: ProjectTask): Product | undefined => {
    if (!task.reference && !task.name) return undefined;
    return catalog.find(p => 
      (task.reference && p.reference.toLowerCase().trim() === task.reference.toLowerCase().trim()) ||
      (task.name && p.name.toLowerCase().includes(task.name.toLowerCase()))
    );
  };

  const matchedTasksCount = project.tasks.filter(t => getMatch(t) !== undefined).length;

  return (
    <div className="flex flex-col h-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Panel */}
      <div className="bg-white p-8 rounded-[2rem] border border-stone-100 shadow-xl shadow-emerald-900/5 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <button 
            onClick={onBack} 
            className="p-3 bg-stone-50 border border-stone-100 text-stone-400 rounded-xl hover:bg-stone-100 transition-all rotate-180"
            title="Retour aux projets"
          >
            {ICONS.Next}
          </button>
          <div className="flex items-center gap-5">
            <div className="bg-emerald-600 p-4 rounded-2xl text-white shadow-lg rotate-2">
              {ICONS.Leaf}
            </div>
            <div>
              <h2 className="text-3xl font-black text-stone-900 uppercase tracking-tighter leading-none">{project.name}</h2>
              <p className="text-[10px] font-black text-emerald-600 mt-2 uppercase tracking-widest">{matchedTasksCount} Validés</p>
            </div>
          </div>
        </div>
        <button
          onClick={handleGenerateVisualization}
          disabled={!project.sitePhoto || matchedTasksCount === 0 || isVisualizing}
          className={`px-12 py-5 rounded-2xl font-black uppercase tracking-widest text-[11px] flex items-center gap-3 transition-all shadow-2xl active:scale-95 ${
            project.sitePhoto && matchedTasksCount > 0 
              ? 'bg-stone-900 hover:bg-black text-white hover:-translate-y-1' 
              : 'bg-stone-100 text-stone-300 cursor-not-allowed border border-stone-200'
          }`}
        >
          {isVisualizing ? <Loader2 className="w-4 h-4 animate-spin"/> : ICONS.Layout}
          Générer la Visualisation
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 min-h-0 pb-10">
        <div className="lg:col-span-8 flex flex-col gap-8 h-full min-h-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-[250px] shrink-0">
            {/* Site Photo */}
            <div className="bg-white rounded-[2rem] shadow-lg border border-stone-100 flex flex-col overflow-hidden">
              <div className="px-6 py-4 border-b border-stone-50 bg-stone-50/50 flex justify-between items-center">
                <span className="font-black text-[10px] uppercase text-stone-500 tracking-widest">1. Photo Source</span>
                {project.sitePhoto && <button onClick={() => saveState({...project, sitePhoto: null})} className="text-stone-300 hover:text-red-500">{ICONS.Close}</button>}
              </div>
              <div className="flex-1 p-4 relative">
                <div className={`h-full border-2 border-dashed rounded-2xl flex items-center justify-center overflow-hidden transition-colors ${project.sitePhoto ? 'border-emerald-500 bg-emerald-50/10' : 'border-stone-200 bg-stone-50 hover:bg-stone-100'}`}>
                  {project.sitePhoto ? (
                    <img src={project.sitePhoto} className="w-full h-full object-contain p-1" />
                  ) : (
                    <div className="text-center opacity-30 flex flex-col items-center gap-2">
                      {ICONS.Upload}
                      <span className="text-[9px] font-black uppercase tracking-widest">Importer l'existant</span>
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
              </div>
            </div>

            {/* Import */}
            <div className="bg-white rounded-[2rem] shadow-lg border border-stone-100 flex flex-col overflow-hidden">
              <div className="px-6 py-4 border-b border-stone-50 bg-stone-50/50 flex items-center justify-between">
                <span className="font-black text-[10px] uppercase text-stone-500 tracking-widest">2. Importation Devis</span>
                <div className="flex bg-stone-100 p-0.5 rounded-lg border border-stone-200">
                  <button onClick={() => setImportMode('ai')} className={`px-3 py-1 rounded-md text-[9px] font-black uppercase transition-all ${importMode === 'ai' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-400'}`}>IA</button>
                  <button onClick={() => setImportMode('excel')} className={`px-3 py-1 rounded-md text-[9px] font-black uppercase transition-all ${importMode === 'excel' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-400'}`}>Excel</button>
                </div>
              </div>
              <div className="flex-1 p-4 flex flex-col gap-3">
                {importMode === 'ai' ? (
                  <>
                    <textarea 
                      className="flex-1 bg-stone-50 rounded-xl p-3 text-xs outline-none focus:bg-white border border-stone-50 resize-none font-medium text-stone-600"
                      placeholder="Collez ici le texte du devis..."
                      value={importText}
                      onChange={e => setImportText(e.target.value)}
                    />
                    <button onClick={handleImport} disabled={isProcessing || !importText.trim()} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-emerald-600/20 transition-all">
                      {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mx-auto"/> : "Analyser par IA"}
                    </button>
                  </>
                ) : (
                  <div className="flex-1 border-2 border-dashed border-stone-200 rounded-2xl bg-stone-50 flex flex-col items-center justify-center p-6 text-center space-y-4 relative hover:bg-emerald-50/30 transition-all">
                    <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-stone-100 flex items-center justify-center text-emerald-600">{ICONS.Excel}</div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-stone-600 uppercase tracking-widest">Choisir un fichier</p>
                      <p className="text-[8px] text-stone-400 uppercase tracking-widest">(Recherche: Référence, Désignation, Lieu, Description, Texture)</p>
                    </div>
                    <input type="file" accept=".xlsx, .xls, .csv" onChange={handleExcelImport} className="absolute inset-0 opacity-0 cursor-pointer" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-[2rem] shadow-lg border border-stone-100 flex flex-col flex-1 min-h-0 overflow-hidden">
            <div className="px-8 py-4 border-b border-stone-50 bg-stone-50/50 flex justify-between items-center">
              <span className="font-black text-[10px] uppercase text-stone-800 tracking-widest">3. Matériaux & Localisation</span>
              <button onClick={addTask} className="text-[10px] font-black border border-stone-200 px-4 py-2 rounded-xl text-emerald-700 hover:bg-emerald-50 transition-all flex items-center gap-2 uppercase tracking-widest shadow-sm">
                {ICONS.Plus} Nouvelle Ligne
              </button>
            </div>
            <div className="flex-1 overflow-auto custom-scrollbar">
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-stone-50 z-10">
                  <tr className="border-b border-stone-100">
                    <th className="p-4 text-[9px] font-black text-stone-400 uppercase tracking-widest w-[15%]">Référence</th>
                    <th className="p-4 text-[9px] font-black text-stone-400 uppercase tracking-widest w-[30%]">Désignation</th>
                    <th className="p-4 text-[9px] font-black text-stone-400 uppercase tracking-widest w-[20%]">Lieu</th>
                    <th className="p-4 text-[9px] font-black text-stone-400 uppercase tracking-widest w-[20%]">Description</th>
                    <th className="p-4 text-[9px] font-black text-stone-400 uppercase tracking-widest w-[10%] text-center">Texture</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {project.tasks.map(task => {
                    const match = getMatch(task);
                    return (
                      <tr key={task.id} className={`${match ? 'bg-emerald-50/20' : 'bg-red-50/20'} group transition-colors`}>
                        <td className="p-2">
                          <input type="text" value={task.reference} onChange={e => updateTask(task.id, 'reference', e.target.value)} className="w-full bg-transparent p-2 text-xs font-mono font-black text-stone-800 outline-none" placeholder="REF..." />
                        </td>
                        <td className="p-2 relative">
                          <input type="text" value={task.name} onChange={e => updateTask(task.id, 'name', e.target.value)} onFocus={() => setActiveDropdown(task.id)} className="w-full bg-transparent p-2 text-xs font-bold text-stone-700 outline-none" placeholder="Nom du produit..." />
                          {activeDropdown === task.id && (
                            <div className="absolute top-full left-0 w-[350px] max-h-60 overflow-auto bg-white border border-stone-100 rounded-[1.5rem] shadow-2xl z-50 p-3 mt-2 custom-scrollbar animate-in slide-in-from-top-2 duration-200">
                               {catalog.filter(p => !task.name || p.name.toLowerCase().includes(task.name.toLowerCase()) || p.reference.toLowerCase().includes(task.name.toLowerCase())).map(product => (
                                 <div key={product.reference} onMouseDown={(e) => { e.preventDefault(); selectProductForTask(task.id, product); }} className="p-3 hover:bg-emerald-50 rounded-xl cursor-pointer flex items-center gap-4 transition-colors group/item">
                                   <div className="w-10 h-10 rounded-lg bg-stone-100 overflow-hidden shadow-sm shrink-0"><img src={product.image_display} className="w-full h-full object-cover" /></div>
                                   <div className="min-w-0">
                                     <div className="text-[10px] font-black truncate text-stone-900 uppercase leading-tight">{product.name}</div>
                                     <div className="text-[8px] font-mono font-bold text-stone-400 mt-0.5">{product.reference}</div>
                                   </div>
                                 </div>
                               ))}
                               {catalog.length === 0 && <p className="text-[9px] text-center py-4 text-stone-400 font-black uppercase tracking-widest">Base vide</p>}
                            </div>
                          )}
                        </td>
                        <td className="p-2"><input type="text" value={task.location} onChange={e => updateTask(task.id, 'location', e.target.value)} className="w-full bg-transparent p-2 text-xs text-stone-600 outline-none" placeholder="Emplacement..." /></td>
                        <td className="p-2"><input type="text" value={task.description} onChange={e => updateTask(task.id, 'description', e.target.value)} className="w-full bg-transparent p-2 text-xs text-stone-500 italic outline-none" placeholder="Qté / Détails..." /></td>
                        <td className="p-2">
                          <div className={`w-10 h-10 mx-auto rounded-lg border-2 bg-white flex items-center justify-center overflow-hidden shadow-sm ${match ? 'border-emerald-200' : 'border-red-100 border-dashed'}`}>
                            {match ? <img src={match.image_display} className="w-full h-full object-cover" /> : <span className="text-red-300 opacity-30">{ICONS.Missing}</span>}
                          </div>
                        </td>
                        <td className="p-2 text-right">
                          <button onClick={() => removeTask(task.id)} className="p-2 text-stone-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                            {ICONS.Trash}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {project.tasks.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-20 text-center">
                        <p className="text-[10px] font-black text-stone-300 uppercase tracking-widest">Aucune tâche. Utilisez l'IA ou ajoutez manuellement.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              {activeDropdown && <div className="fixed inset-0 z-40" onMouseDown={() => setActiveDropdown(null)} />}
            </div>
          </div>
        </div>

        {/* Gallery Sidebar */}
        <div className="lg:col-span-4 flex flex-col gap-6 h-full min-h-0">
          <div className="bg-white rounded-[2rem] shadow-lg border border-stone-100 flex flex-col flex-1 overflow-hidden">
            <div className="px-6 py-4 border-b border-stone-50 bg-stone-50/50 flex items-center justify-between">
              <span className="font-black text-[10px] uppercase text-stone-500 tracking-widest">Rendus du Projet</span>
              <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{project.generatedImages.length}</span>
            </div>
            <div className="flex-1 p-6 overflow-auto custom-scrollbar space-y-4">
              {project.generatedImages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-stone-200 text-center gap-4">
                  <div className="p-6 bg-stone-50 rounded-3xl border border-stone-100">{ICONS.Layout}</div>
                  <p className="text-[10px] font-black uppercase tracking-widest">Aucun rendu généré</p>
                </div>
              ) : (
                [...project.generatedImages].reverse().map((img, idx) => (
                  <div 
                    key={idx} 
                    className="group relative aspect-video rounded-[2rem] overflow-hidden shadow-md border border-stone-100 cursor-pointer transition-transform hover:scale-[1.02]" 
                    onClick={() => setVisualizationResult(img)}
                  >
                    <img src={img} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-stone-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-2">
                      {ICONS.Search}
                      <span className="font-black text-[9px] uppercase tracking-widest">Agrandir</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Visualisation Modal Re-calibrated */}
      {visualizationResult && (
        <div className="fixed inset-0 bg-stone-950/95 backdrop-blur-xl z-[300] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-500 shadow-2xl relative">
            <div className="p-6 md:p-8 border-b border-stone-50 flex justify-between items-center shrink-0 bg-stone-50/50">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-stone-900 text-white rounded-2xl shadow-lg">{ICONS.Leaf}</div>
                <div>
                  <h3 className="text-xl md:text-2xl font-black text-stone-900 uppercase tracking-tighter leading-none">Vision Studio HD</h3>
                  <p className="text-[9px] font-black text-emerald-600 uppercase mt-2 tracking-widest">Simulation haute-fidélité</p>
                </div>
              </div>
              <button 
                onClick={() => setVisualizationResult(null)} 
                className="w-12 h-12 flex items-center justify-center bg-white border border-stone-100 text-stone-400 rounded-full hover:bg-red-50 hover:text-red-500 transition-all shadow-sm"
              >
                {ICONS.Close}
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6 md:p-10 bg-stone-100/50 flex items-center justify-center">
              <div className="aspect-video w-full max-w-5xl rounded-[3rem] overflow-hidden shadow-2xl bg-white border-8 border-white relative group">
                <img src={visualizationResult} className="w-full h-full object-cover rounded-[2.5rem] transition-transform duration-700" />
                <div className="absolute bottom-8 right-8 bg-emerald-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-emerald-900/40 opacity-0 group-hover:opacity-100 transition-opacity">
                  Rendu Finalisé
                </div>
              </div>
            </div>
            <div className="p-6 md:p-8 border-t border-stone-50 flex flex-col md:flex-row justify-between items-center gap-6 bg-white shrink-0">
              <div className="flex gap-10">
                <div className="space-y-1">
                  <span className="text-[9px] font-black uppercase tracking-widest text-stone-400">Projet</span>
                  <p className="text-lg font-black text-stone-800 tracking-tight">{project.name}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-black uppercase tracking-widest text-stone-400">Qualité</span>
                  <p className="text-lg font-black text-emerald-600 tracking-tight">HD Optimized</p>
                </div>
              </div>
              <div className="flex gap-4 w-full md:w-auto">
                <button 
                  onClick={() => setVisualizationResult(null)} 
                  className="flex-1 md:flex-none px-8 py-4 border-2 border-stone-100 rounded-2xl font-black uppercase text-[10px] tracking-widest text-stone-500 hover:bg-stone-50 transition-all"
                >
                  Fermer
                </button>
                <button 
                  onClick={() => { const link = document.createElement('a'); link.href = visualizationResult; link.download = `RENDU_${project.name}_${new Date().getTime()}.png`; link.click(); }} 
                  className="flex-1 md:flex-none px-10 py-4 bg-stone-900 hover:bg-black text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all"
                >
                  {ICONS.Upload} Télécharger
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isVisualizing && (
        <div className="fixed inset-0 bg-stone-950/90 backdrop-blur-2xl z-[400] flex items-center justify-center p-8">
          <div className="text-center space-y-10">
            <div className="relative mx-auto w-32 h-32">
              <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping" />
              <div className="w-32 h-32 bg-white rounded-[2.5rem] shadow-2xl flex items-center justify-center text-emerald-600 relative z-10 border border-stone-100">
                <Loader2 className="w-12 h-12 animate-spin" />
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="text-4xl font-black text-white uppercase tracking-tighter">Incrustation Studio...</h4>
              <div className="flex items-center justify-center gap-3">
                <span className="w-12 h-0.5 bg-emerald-600/30" />
                <p className="text-emerald-500 font-black uppercase tracking-[0.3em] text-[10px]">Calcul des Textures Réelles</p>
                <span className="w-12 h-0.5 bg-emerald-600/30" />
              </div>
            </div>
          </div>
        </div>
      )}

      {isAddingProduct && (
        <ProductForm 
          initialData={{ reference: '', name: isAddingProduct, url: '', image_display: '' }}
          onSave={(p) => { storageService.saveProduct(p); setCatalog(storageService.getProducts()); }}
          onClose={() => setIsAddingProduct(null)}
        />
      )}
    </div>
  );
};
