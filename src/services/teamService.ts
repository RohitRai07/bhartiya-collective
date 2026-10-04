/**
 * National Team & State Chapters Service
 * 
 * Manages executive leadership team profiles and regional state chapters.
 * Persists modifications reactively via localStorage and custom event dispatching.
 */

import { NationalTeamMember, StateChapter, TeamPublishStatus } from '../types/team';

const NATIONAL_STORAGE_KEY = 'bharat_collective_national_team';
const STATE_STORAGE_KEY = 'bharat_collective_state_chapters';

const SEED_NATIONAL_TEAM: NationalTeamMember[] = [
  {
    id: 'nat-1',
    role: 'Director of Legal Affairs & Research',
    name: 'Sr. Adv. J. Sai Deepak',
    affiliation: 'Supreme Court of India',
    desc: 'Oversees the Center for Human Rights & Legal Aid, directing constitutional litigations, civilizational jurisprudence analysis, and model legislative inputs.',
    status: 'published',
    order: 1,
  },
  {
    id: 'nat-2',
    role: 'Dean of Academic Inquiry & Fellowships',
    name: 'Prof. Ananya Someshwar',
    affiliation: 'Department of Public Policy & Statecraft',
    desc: 'Leads visiting fellowship admissions, peer-reviewed monograph editorial pipelines, and curricular synthesis for Indian university networks.',
    status: 'published',
    order: 2,
  },
  {
    id: 'nat-3',
    role: 'Convener of National Dialogues',
    name: 'Dr. Meenakshi Sundaram',
    affiliation: 'Center for Public Policy / Studies',
    desc: 'Directs the #BharatDialogue Conclaves, coordinating roundtables between senior advocates, high court jurists, and policy practitioners.',
    status: 'published',
    order: 3,
  },
];

const SEED_STATE_CHAPTERS: StateChapter[] = [
  {
    id: 'sc-up',
    state: 'Uttar Pradesh Chapter',
    convener: 'Dr. Devendra Pandey',
    city: 'Lucknow / Varanasi',
    focus: 'Civil Courts Legal Aid & Traditional Knowledge',
    status: 'published',
    order: 1,
  },
  {
    id: 'sc-delhi',
    state: 'Delhi-NCR Chapter',
    convener: 'Adv. Siddhartha Dave',
    city: 'New Delhi / Ghaziabad',
    focus: 'Supreme Court & High Court Advocacy',
    status: 'published',
    order: 2,
  },
  {
    id: 'sc-maha',
    state: 'Maharashtra Chapter',
    convener: 'Dr. Arvind Deshmukh',
    city: 'Mumbai / Pune',
    focus: 'Labour Rights & Industrial Policy',
    status: 'published',
    order: 3,
  },
  {
    id: 'sc-kar',
    state: 'Karnataka & South Chapter',
    convener: 'Dr. Ramalingam Iyer',
    city: 'Bengaluru',
    focus: 'IPR, Tech Policy & AI Governance',
    status: 'published',
    order: 4,
  },
  {
    id: 'sc-bihar',
    state: 'Bihar & Jharkhand Chapter',
    convener: 'Prof. Alok Ranjan',
    city: 'Patna',
    focus: 'Panchayat Governance & Agrarian Law',
    status: 'published',
    order: 5,
  },
  {
    id: 'sc-guj',
    state: 'Gujarat Chapter',
    convener: 'Adv. Niharika Patel',
    city: 'Ahmedabad',
    focus: 'Artisanal Guilds & Micro-Enterprise',
    status: 'published',
    order: 6,
  },
  {
    id: 'sc-mp',
    state: 'Madhya Pradesh Chapter',
    convener: 'Dr. Vikramaditya Chouhan',
    city: 'Bhopal / Indore',
    focus: 'Forest Rights & Tribal Legal Defense',
    status: 'published',
    order: 7,
  },
  {
    id: 'sc-raj',
    state: 'Rajasthan Chapter',
    convener: 'Adv. Mahendra Singh Shekhawat',
    city: 'Jaipur / Jodhpur',
    focus: 'Ecological Heritage & Heritage Law',
    status: 'published',
    order: 8,
  },
];

let memoryNationalTeam: NationalTeamMember[] = [...SEED_NATIONAL_TEAM];
let memoryStateChapters: StateChapter[] = [...SEED_STATE_CHAPTERS];

function loadStoredNationalTeam(): NationalTeamMember[] {
  if (typeof window === 'undefined') return [...memoryNationalTeam];
  try {
    const raw = localStorage.getItem(NATIONAL_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(NATIONAL_STORAGE_KEY, JSON.stringify(SEED_NATIONAL_TEAM));
      return [...SEED_NATIONAL_TEAM];
    }
    return JSON.parse(raw);
  } catch {
    return [...memoryNationalTeam];
  }
}

function saveNationalTeam(list: NationalTeamMember[]) {
  memoryNationalTeam = [...list];
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(NATIONAL_STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('bharat:content-updated', { detail: { type: 'nationalTeam' } }));
  } catch (e) {
    console.error('Failed to save national team:', e);
  }
}

function loadStoredStateChapters(): StateChapter[] {
  if (typeof window === 'undefined') return [...memoryStateChapters];
  try {
    const raw = localStorage.getItem(STATE_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STATE_STORAGE_KEY, JSON.stringify(SEED_STATE_CHAPTERS));
      return [...SEED_STATE_CHAPTERS];
    }
    return JSON.parse(raw);
  } catch {
    return [...memoryStateChapters];
  }
}

function saveStateChapters(list: StateChapter[]) {
  memoryStateChapters = [...list];
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STATE_STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('bharat:content-updated', { detail: { type: 'stateTeam' } }));
  } catch (e) {
    console.error('Failed to save state chapters:', e);
  }
}

export const teamService = {
  // ===================== NATIONAL TEAM =====================
  async getNationalTeam(options?: { includeDrafts?: boolean }): Promise<NationalTeamMember[]> {
    await new Promise(resolve => setTimeout(resolve, 30));
    let items = loadStoredNationalTeam();
    if (!options?.includeDrafts) {
      items = items.filter(m => m.status === 'published');
    }
    return items;
  },

  async createNationalMember(data: Omit<NationalTeamMember, 'id'>): Promise<NationalTeamMember> {
    await new Promise(resolve => setTimeout(resolve, 60));
    const items = loadStoredNationalTeam();
    const newMember: NationalTeamMember = {
      ...data,
      id: `nat-${Date.now()}`,
      status: data.status || 'published',
    };
    saveNationalTeam([...items, newMember]);
    return newMember;
  },

  async updateNationalMember(id: string, updates: Partial<NationalTeamMember>): Promise<NationalTeamMember> {
    await new Promise(resolve => setTimeout(resolve, 60));
    const items = loadStoredNationalTeam();
    const idx = items.findIndex(m => m.id === id);
    if (idx === -1) throw new Error('National team member not found.');
    const updated = { ...items[idx], ...updates };
    items[idx] = updated;
    saveNationalTeam(items);
    return updated;
  },

  async toggleNationalMemberPublish(id: string): Promise<NationalTeamMember> {
    const items = loadStoredNationalTeam();
    const member = items.find(m => m.id === id);
    if (!member) throw new Error('National team member not found');
    const newStatus: TeamPublishStatus = member.status === 'draft' ? 'published' : 'draft';
    return this.updateNationalMember(id, { status: newStatus });
  },

  async deleteNationalMember(id: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 60));
    const items = loadStoredNationalTeam();
    saveNationalTeam(items.filter(m => m.id !== id));
    return true;
  },

  // ===================== STATE CHAPTERS =====================
  async getStateChapters(options?: { includeDrafts?: boolean }): Promise<StateChapter[]> {
    await new Promise(resolve => setTimeout(resolve, 30));
    let items = loadStoredStateChapters();
    if (!options?.includeDrafts) {
      items = items.filter(c => c.status === 'published');
    }
    return items;
  },

  async createStateChapter(data: Omit<StateChapter, 'id'>): Promise<StateChapter> {
    await new Promise(resolve => setTimeout(resolve, 60));
    const items = loadStoredStateChapters();
    const newChapter: StateChapter = {
      ...data,
      id: `state-${Date.now()}`,
      status: data.status || 'published',
    };
    saveStateChapters([...items, newChapter]);
    return newChapter;
  },

  async updateStateChapter(id: string, updates: Partial<StateChapter>): Promise<StateChapter> {
    await new Promise(resolve => setTimeout(resolve, 60));
    const items = loadStoredStateChapters();
    const idx = items.findIndex(c => c.id === id);
    if (idx === -1) throw new Error('State chapter not found.');
    const updated = { ...items[idx], ...updates };
    items[idx] = updated;
    saveStateChapters(items);
    return updated;
  },

  async toggleStateChapterPublish(id: string): Promise<StateChapter> {
    const items = loadStoredStateChapters();
    const chapter = items.find(c => c.id === id);
    if (!chapter) throw new Error('State chapter not found');
    const newStatus: TeamPublishStatus = chapter.status === 'draft' ? 'published' : 'draft';
    return this.updateStateChapter(id, { status: newStatus });
  },

  async deleteStateChapter(id: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 60));
    const items = loadStoredStateChapters();
    saveStateChapters(items.filter(c => c.id !== id));
    return true;
  },
};
