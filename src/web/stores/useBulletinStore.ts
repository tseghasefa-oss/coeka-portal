import { create } from 'zustand';
import {
  InstitutionalBulletin,
  BulletinPlacement,
  BulletinAudience,
  BulletinCategory,
  BulletinPriority,
} from '../../types/bulletin';

const STORAGE_KEY = 'coeka_institutional_bulletins';

export const INITIAL_BULLETINS: InstitutionalBulletin[] = [
  {
    id: 'blt-1',
    title: '2026/2027 Academic Session Admissions Exercise Commences',
    category: 'Admissions',
    priority: 'HIGH',
    author: 'Office of the Registrar',
    date: 'September 25, 2026',
    summary: 'Applications are formally invited from suitably qualified candidates for admission into NCE and Degree Programmes.',
    content: `The Academic Board of the College of Education, Katsina-Ala announces the commencement of admission screening for the 2026/2027 academic year. 

Candidates who sat for the 2026 Unified Tertiary Matriculation Examination (UTME) and scored a minimum of 100 for NCE or 140 for Degree programmes, and have five (5) O'Level credits including English Language and Mathematics at not more than two sittings, are invited to apply.

Direct Entry candidates for Degree programmes with NCE, ND, or IJMB are also eligible to register via the official COEKA Portal.`,
    placements: ['WEBSITE_TICKER', 'WEBSITE_NOTICEBOARD', 'ADMISSIONS_PORTAL'],
    audiences: ['ALL', 'APPLICANTS'],
    isPublished: true,
    pinToTop: true,
    createdAt: '2026-09-25T08:00:00Z',
    updatedAt: '2026-09-25T08:00:00Z',
  },
  {
    id: 'blt-2',
    title: 'Autonomous Hostel Allocation Now Live on Student Portal',
    category: 'Hostel',
    priority: 'URGENT',
    author: 'Directorate of Student Affairs',
    date: 'September 22, 2026',
    summary: 'Students who have completed 100% of their tuition fee clearance can now select hostel rooms directly from their dashboard.',
    content: `The Directorate of Student Affairs has activated the autonomous room reservation engine for the 2026/2027 academic session. 

Eligible full-time students who have settled their mandatory institutional tuition in full can log into the COEKA Student Portal, navigate to the Hostel Allocation tab, and secure an available bedspace across Sir Kashim Ibrahim, Queen Amina, and Benue Hall residences with zero manual paperwork.`,
    placements: ['WEBSITE_TICKER', 'STUDENT_DASHBOARD', 'WEBSITE_NOTICEBOARD'],
    audiences: ['ALL', 'STUDENTS'],
    isPublished: true,
    pinToTop: true,
    createdAt: '2026-09-22T09:30:00Z',
    updatedAt: '2026-09-22T09:30:00Z',
  },
  {
    id: 'blt-3',
    title: 'First Semester 2026/2027 Resumption & Orientation Schedule',
    category: 'Academic',
    priority: 'HIGH',
    author: 'Academic Planning & Registry',
    date: 'September 18, 2026',
    summary: 'Fresh and returning students are advised to review the approved semester calendar and scheduled matriculation ceremony.',
    content: `All fresh and returning students of the College are notified that physical resumption for the first semester begins on Monday, October 12, 2026. 

Fresh student verification, digital ID capture at the Admissions Directorate, and mandatory orientation lectures will hold between October 14 and October 18 at the College Auditorium. Course registration on the SIMS portal closes three weeks from resumption.`,
    placements: ['WEBSITE_TICKER', 'WEBSITE_NOTICEBOARD', 'STUDENT_DASHBOARD', 'STAFF_PORTAL'],
    audiences: ['ALL', 'STUDENTS', 'STAFF'],
    isPublished: true,
    pinToTop: false,
    createdAt: '2026-09-18T10:00:00Z',
    updatedAt: '2026-09-18T10:00:00Z',
  },
  {
    id: 'blt-4',
    title: 'NCCE Re-Accreditation Team Awards Top Institutional Rating',
    category: 'General',
    priority: 'NORMAL',
    author: 'College Information & Protocol Unit',
    date: 'September 10, 2026',
    summary: 'Full accreditation affirmed across all science, vocational, and arts departments following a rigorous week-long review.',
    content: `The National Commission for Colleges of Education (NCCE) evaluation team has concluded its quinquennial accreditation exercise at the College of Education, Katsina-Ala, awarding an outstanding 100% accreditation rating across all 28 NCE academic programmes.

The Provost commends the Governing Council, academic staff, and management for maintaining premier educational standards and investing in state-of-the-art laboratory infrastructure.`,
    placements: ['WEBSITE_TICKER', 'WEBSITE_NOTICEBOARD', 'STAFF_PORTAL'],
    audiences: ['ALL', 'STAFF'],
    isPublished: true,
    pinToTop: false,
    createdAt: '2026-09-10T12:00:00Z',
    updatedAt: '2026-09-10T12:00:00Z',
  },
];

function loadStoredBulletins(): InstitutionalBulletin[] {
  if (typeof window === 'undefined') return INITIAL_BULLETINS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error loading stored bulletins:', err);
  }
  return INITIAL_BULLETINS;
}

function saveBulletins(bulletins: InstitutionalBulletin[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bulletins));
  } catch (err) {
    console.error('Error saving bulletins to localStorage:', err);
  }
}

interface BulletinStoreState {
  bulletins: InstitutionalBulletin[];
  addBulletin: (data: Omit<InstitutionalBulletin, 'id' | 'createdAt' | 'updatedAt'>) => InstitutionalBulletin;
  updateBulletin: (id: string, updates: Partial<InstitutionalBulletin>) => void;
  deleteBulletin: (id: string) => void;
  togglePublish: (id: string) => void;
  togglePin: (id: string) => void;
  getBulletinsByPlacement: (placement: BulletinPlacement, audience?: BulletinAudience) => InstitutionalBulletin[];
  resetToDefaults: () => void;
}

export const useBulletinStore = create<BulletinStoreState>((set, get) => ({
  bulletins: loadStoredBulletins(),

  addBulletin: (data) => {
    const now = new Date().toISOString();
    const newBulletin: InstitutionalBulletin = {
      ...data,
      id: `blt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: now,
      updatedAt: now,
    };
    const updated = [newBulletin, ...get().bulletins];
    set({ bulletins: updated });
    saveBulletins(updated);
    return newBulletin;
  },

  updateBulletin: (id, updates) => {
    const now = new Date().toISOString();
    const updated = get().bulletins.map((b) =>
      b.id === id ? { ...b, ...updates, updatedAt: now } : b
    );
    set({ bulletins: updated });
    saveBulletins(updated);
  },

  deleteBulletin: (id) => {
    const updated = get().bulletins.filter((b) => b.id !== id);
    set({ bulletins: updated });
    saveBulletins(updated);
  },

  togglePublish: (id) => {
    const now = new Date().toISOString();
    const updated = get().bulletins.map((b) =>
      b.id === id ? { ...b, isPublished: !b.isPublished, updatedAt: now } : b
    );
    set({ bulletins: updated });
    saveBulletins(updated);
  },

  togglePin: (id) => {
    const now = new Date().toISOString();
    const updated = get().bulletins.map((b) =>
      b.id === id ? { ...b, pinToTop: !b.pinToTop, updatedAt: now } : b
    );
    set({ bulletins: updated });
    saveBulletins(updated);
  },

  getBulletinsByPlacement: (placement, audience) => {
    return get().bulletins
      .filter((b) => {
        if (!b.isPublished) return false;
        const matchesPlacement = b.placements.includes(placement);
        if (!matchesPlacement) return false;
        if (!audience || audience === 'ALL') return true;
        return b.audiences.includes('ALL') || b.audiences.includes(audience);
      })
      .sort((a, b) => {
        if (a.pinToTop && !b.pinToTop) return -1;
        if (!a.pinToTop && b.pinToTop) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  },

  resetToDefaults: () => {
    set({ bulletins: INITIAL_BULLETINS });
    saveBulletins(INITIAL_BULLETINS);
  },
}));
