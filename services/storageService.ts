
import { Product, Project } from '../types';
import { INITIAL_PRODUCTS } from '../constants';

const PRODUCTS_KEY = 'terramatch_products';
const PROJECTS_KEY = 'terramatch_projects';

export const storageService = {
  // Produits
  getProducts: (): Product[] => {
    const data = localStorage.getItem(PRODUCTS_KEY);
    if (!data) {
      localStorage.setItem(PRODUCTS_KEY, JSON.stringify(INITIAL_PRODUCTS));
      return INITIAL_PRODUCTS;
    }
    return JSON.parse(data);
  },

  saveProduct: (product: Product) => {
    const products = storageService.getProducts();
    const index = products.findIndex(p => p.reference === product.reference);
    if (index > -1) products[index] = product;
    else products.push(product);
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  },

  deleteProduct: (reference: string) => {
    const products = storageService.getProducts();
    const filtered = products.filter(p => p.reference !== reference);
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(filtered));
  },

  // Projets
  getProjects: (): Project[] => {
    const data = localStorage.getItem(PROJECTS_KEY);
    return data ? JSON.parse(data) : [];
  },

  getProject: (id: string): Project | undefined => {
    return storageService.getProjects().find(p => p.id === id);
  },

  saveProject: (project: Project) => {
    const projects = storageService.getProjects();
    const index = projects.findIndex(p => p.id === project.id);
    if (index > -1) projects[index] = project;
    else projects.push(project);
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  },

  deleteProject: (id: string) => {
    const projects = storageService.getProjects();
    const filtered = projects.filter(p => p.id !== id);
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(filtered));
  }
};
