// Data types
export interface Member {
  id: string;
  name: string;
  role: string;
  title?: string;
  image?: string;
  bio?: string;
  bio_long?: string;
  interest?: string;
  email?: string;
  github?: string;
  linkedin?: string;
  twitter?: string;
  google_scholar?: string;
  orcid?: string;
  type: 'member' | 'alumn';
  current_position?: string;
}

export interface Publication {
  id: number;
  title: string;
  journal: string;
  date: string;
  year: number;
  authors: string;
  link?: string;
  doi?: string;
  preprint_url?: string;
  preprint_label?: string;
  image?: string;
}

export interface NewsItem {
  date: string;
  title: string;
  category: string;
  excerpt?: string;
  images?: Array<{ src: string } | string>;
}

export interface ContactInfo {
  email: string;
  office: string;
  mapUrl?: string;
}

export interface LabInfo {
  name: string;
  fullName: string;
  tagline: string;
  description: string;
  affiliation: string;
  department: string;
  centers: Array<{
    name: string;
    url: string;
  }>;
}

export type IconName = 'Brain' | 'Dna' | 'Pill' | 'Lightbulb' | 'Github' | 'Database' | 'Terminal';

export interface ResearchDirection {
  id: string;
  title: string;
  question: string;
  description: string;
  keyAreas: string[];
  icon: IconName;
}

export interface ResearchProject {
  id: string;
  title: string;
  description: string;
  icon: IconName;
}

export interface ResearchData {
  intro: string;
  directions: ResearchDirection[];
  projects?: ResearchProject[];
}

export interface ResourceTool {
  id: string;
  name: string;
  description: string;
  icon: IconName;
  tags: string[];
  link: string;
}

export interface ResourcesData {
  intro: string;
  tools: ResourceTool[];
}

// Data caching to avoid repeated fetches
const cache: Record<string, any> = {};

async function loadJSON<T>(path: string): Promise<T> {
  if (cache[path]) {
    return cache[path];
  }

  try {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`Failed to load ${path}: ${response.statusText}`);
    }
    const data = await response.json();
    cache[path] = data;
    return data;
  } catch (error) {
    console.error(`Error loading ${path}:`, error);
    throw error;
  }
}

// Data loading functions
export async function loadMembers() {
  const data = await loadJSON<any>('/data/members.json');
  return {
    PI: data.pi,
    MEMBERS: data.members,
    ALUMNI: data.alumni
  };
}

// Map a publication date like "Jul 2025" to a month number (1-12); 0 when only a year is given.
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
function monthIndex(date: string | undefined): number {
  if (!date) return 0;
  const idx = MONTHS.indexOf(date.trim().slice(0, 3).toLowerCase());
  return idx === -1 ? 0 : idx + 1;
}

export async function loadPublications() {
  const data = await loadJSON<any>('/data/publications.json');

  // Read from the unified 'publications' field
  const publications = data.publications || data.byYear || [];

  // Sort by year descending (newest first), papers within each year by month descending.
  const sortedPublications = [...publications]
    .sort((a, b) => b.year - a.year)
    .map((group: any) => ({
      ...group,
      papers: [...(group.papers || [])].sort(
        (a: any, b: any) => monthIndex(b.date) - monthIndex(a.date)
      ),
    }));

  return {
    PUBLICATIONS_BY_YEAR: sortedPublications,
    ALL_PUBLICATIONS: sortedPublications.flatMap((group: any) => group.papers || [])
  };
}

export async function loadNews() {
  const data = await loadJSON<any>('/data/news.json');
  return data.items;
}

export async function loadLabInfo() {
  const data = await loadJSON<any>('/data/labInfo.json');
  return {
    CONTACT: data.contact,
    LAB_INFO: data.lab
  };
}

export async function loadResearch(): Promise<ResearchData> {
  return loadJSON<ResearchData>('/data/research.json');
}

export async function loadResources(): Promise<ResourcesData> {
  return loadJSON<ResourcesData>('/data/resources.json');
}

// Preload all data for better performance
export async function preloadAllData() {
  try {
    await Promise.all([
      loadMembers(),
      loadPublications(),
      loadNews(),
      loadLabInfo(),
      loadResearch(),
      loadResources()
    ]);
  } catch (error) {
    console.error('Error preloading data:', error);
  }
}
