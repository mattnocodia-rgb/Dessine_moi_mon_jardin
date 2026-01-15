
export interface Product {
  reference: string;
  name: string;
  url: string;
  image_display: string;
}

export interface ProjectTask {
  id: string;
  reference: string;
  name: string;
  location: string;
  description: string;
}

export interface Project {
  id: string;
  name: string;
  createdAt: string;
  sitePhoto: string | null;
  tasks: ProjectTask[];
  generatedImages: string[];
}

export interface MatchResult {
  taskId: string;
  term: string;
  product?: Product;
  isFound: boolean;
}

export type View = 'projects' | 'matcher' | 'inventory';

export interface User {
  email: string;
  name: string;
}
