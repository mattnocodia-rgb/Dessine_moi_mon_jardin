
import React from 'react';
import { Layout, Database, Package, Plus, Trash2, Edit, ExternalLink, Search, FileText, Upload, CheckCircle, AlertCircle, Loader2, ChevronRight, X, FileSpreadsheet, Leaf, Lock, User } from 'lucide-react';

export const ICONS = {
  Layout: <Layout className="w-5 h-5" />,
  Database: <Database className="w-5 h-5" />,
  Package: <Package className="w-5 h-5" />,
  Plus: <Plus className="w-5 h-5" />,
  Trash: <Trash2 className="w-5 h-5" />,
  Edit: <Edit className="w-5 h-5" />,
  Link: <ExternalLink className="w-5 h-5" />,
  Search: <Search className="w-5 h-5" />,
  Quote: <FileText className="w-5 h-5" />,
  Upload: <Upload className="w-5 h-5" />,
  Excel: <FileSpreadsheet className="w-5 h-5" />,
  Found: <CheckCircle className="w-5 h-5 text-emerald-600" />,
  Missing: <AlertCircle className="w-5 h-5 text-red-600" />,
  Loading: <Loader2 className="w-5 h-5 animate-spin" />,
  Next: <ChevronRight className="w-5 h-5" />,
  Close: <X className="w-5 h-5" />,
  Leaf: <Leaf className="w-5 h-5" />,
  Lock: <Lock className="w-5 h-5" />,
  User: <User className="w-5 h-5" />
};

export const INITIAL_PRODUCTS: any[] = [
  {
    reference: "P2AA11489",
    name: "Panneau Bois Arifi Pin, Saturé Doré, L. 1,80 m x h. 1,80 m x ep. 75 mm",
    url: "https://www.vivreenbois.com/produit/panneau-bois-arifi-pin-sature-dore-l-180-m-x-h-180-m-x-ep-75-mm",
    image_display: "https://images.unsplash.com/photo-1585790050230-5dd28404ccb9?auto=format&fit=crop&q=80&w=400"
  },
  {
    reference: "730510168",
    name: "Panneau de décor Aluminium Tokyo, Gris Anthracite, L. 1.855 m x l. 920 mm x ep. 23 mm",
    url: "https://www.vivreenbois.com/produit/panneau-de-decor-aluminium-tokyo-gris-anthracite-l-1855-m-x-l-920-mm-x-ep-23-mm",
    image_display: "https://images.unsplash.com/photo-1620625515032-654e71b12041?auto=format&fit=crop&q=80&w=400"
  }
];
