
import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { ICONS } from '../constants';
import { storageService } from '../services/storageService';
import { ProductForm } from './ProductForm';

export const Inventory: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>();
  const [searchTerm, setSearchTerm] = useState('');

  const loadProducts = () => {
    setProducts(storageService.getProducts());
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleSave = (product: Product) => {
    storageService.saveProduct(product);
    loadProducts();
    setIsFormOpen(false);
    setEditingProduct(undefined);
  };

  const handleDelete = (ref: string) => {
    if (confirm('Voulez-vous vraiment supprimer ce produit ?')) {
      storageService.deleteProduct(ref);
      loadProducts();
    }
  };

  const filteredProducts = products.filter(p => {
    const search = searchTerm.toLowerCase();
    return p.name.toLowerCase().includes(search) || p.reference.toLowerCase().includes(search);
  });

  return (
    <div className="flex flex-col h-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col lg:flex-row justify-between lg:items-center bg-white p-8 rounded-[2rem] border border-stone-100 shadow-xl shadow-emerald-900/5 gap-6">
        <div>
          <h2 className="text-3xl font-black text-stone-900 tracking-tighter uppercase leading-none">Catalogue Technique</h2>
          <p className="text-stone-400 font-medium mt-3">Gérez vos références et textures haute définition.</p>
        </div>
        <button
          onClick={() => {
            setEditingProduct(undefined);
            setIsFormOpen(true);
          }}
          className="px-10 py-5 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[11px] tracking-widest rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-emerald-600/20 transition-all active:scale-95 hover:-translate-y-1"
        >
          {ICONS.Plus} Nouveau Produit
        </button>
      </div>

      <div className="bg-white rounded-[2rem] shadow-xl shadow-emerald-900/5 border border-stone-100 flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="p-6 border-b border-stone-50 bg-stone-50/30 flex items-center gap-6">
          <div className="flex-1 relative">
            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-300">
              {ICONS.Search}
            </span>
            <input
              type="text"
              placeholder="Rechercher une référence ou une désignation..."
              className="w-full pl-14 pr-6 py-4 rounded-[1.5rem] border border-stone-100 bg-white outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all font-medium text-stone-600"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="hidden md:block px-5 py-2 bg-emerald-50 rounded-xl text-emerald-800 font-black text-[10px] uppercase tracking-widest border border-emerald-100">
            {filteredProducts.length} ARTICLES
          </div>
        </div>

        <div className="overflow-auto flex-1 custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="sticky top-0 bg-white shadow-sm z-10">
              <tr className="border-b border-stone-50">
                <th className="p-6 text-[10px] font-black text-stone-400 uppercase tracking-widest">Texture</th>
                <th className="p-6 text-[10px] font-black text-stone-400 uppercase tracking-widest">Référence</th>
                <th className="p-6 text-[10px] font-black text-stone-400 uppercase tracking-widest">Désignation</th>
                <th className="p-6 text-[10px] font-black text-stone-400 uppercase tracking-widest text-center">Fiche</th>
                <th className="p-6 text-[10px] font-black text-stone-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {filteredProducts.map(p => (
                <tr key={p.reference} className="hover:bg-stone-50/50 transition-colors group">
                  <td className="p-6">
                    <div className="w-16 h-16 rounded-2xl border border-stone-100 overflow-hidden bg-white p-1 shadow-sm">
                      <img src={p.image_display} className="w-full h-full object-cover rounded-xl" alt={p.name} />
                    </div>
                  </td>
                  <td className="p-6">
                    <span className="font-mono text-[10px] font-black text-stone-800 bg-stone-100 px-3 py-1.5 rounded-lg uppercase tracking-widest">
                      {p.reference}
                    </span>
                  </td>
                  <td className="p-6 text-xs font-bold text-stone-700 leading-relaxed max-w-md">
                    {p.name}
                  </td>
                  <td className="p-6 flex justify-center">
                    {p.url ? (
                      <a 
                        href={p.url} 
                        target="_blank" 
                        className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white border border-stone-100 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                      >
                        {ICONS.Link}
                      </a>
                    ) : (
                      <span className="text-stone-200">--</span>
                    )}
                  </td>
                  <td className="p-6 text-right">
                    <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          setEditingProduct(p);
                          setIsFormOpen(true);
                        }}
                        className="p-3 bg-white border border-stone-100 text-stone-600 hover:bg-stone-900 hover:text-white rounded-xl shadow-sm transition-all"
                      >
                        {ICONS.Edit}
                      </button>
                      <button
                        onClick={() => handleDelete(p.reference)}
                        className="p-3 bg-white border border-stone-100 text-red-500 hover:bg-red-500 hover:text-white rounded-xl shadow-sm transition-all"
                      >
                        {ICONS.Trash}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredProducts.length === 0 && (
            <div className="py-24 flex flex-col items-center justify-center text-stone-300 gap-6">
              <div className="p-10 bg-stone-50 rounded-[2.5rem] border-2 border-dashed border-stone-200 opacity-50">
                {ICONS.Package}
              </div>
              <div className="text-center space-y-2">
                <p className="font-black uppercase text-xs tracking-widest text-stone-400">Base vide ou aucun résultat</p>
                <p className="text-sm font-medium">Affinez votre recherche ou ajoutez un produit.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {isFormOpen && (
        <ProductForm
          initialData={editingProduct}
          onSave={handleSave}
          onClose={() => {
            setIsFormOpen(false);
            setEditingProduct(undefined);
          }}
        />
      )}
    </div>
  );
};
