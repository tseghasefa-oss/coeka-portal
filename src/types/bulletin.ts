export type BulletinPlacement =
  | 'WEBSITE_TICKER'       // Top slim emergency/bulletin bar on the public website
  | 'WEBSITE_NOTICEBOARD'  // Public campus notice board & news section
  | 'STUDENT_DASHBOARD'    // Student SIMS dashboard home newsfeed
  | 'STAFF_PORTAL'         // Academic & non-academic staff workspace
  | 'ADMISSIONS_PORTAL';   // Public candidate screening & application gateway

export type BulletinAudience =
  | 'ALL'                  // Public / all visitors & portal users
  | 'STUDENTS'             // Enrolled students across NCE, Degree, Secondary, Primary
  | 'STAFF'                // Academic staff, Lecturers, Deans, HODs, Non-academic staff
  | 'APPLICANTS'           // Candidates submitting or checking admissions screening
  | 'ADMIN';               // Administrative officers & executives

export type BulletinPriority = 'NORMAL' | 'HIGH' | 'URGENT';
export type BulletinCategory = 'Admissions' | 'Academic' | 'Hostel' | 'Bursary' | 'General' | 'Emergency';

export interface InstitutionalBulletin {
  id: string;
  title: string;
  category: BulletinCategory;
  priority: BulletinPriority;
  summary: string;
  content: string;
  author: string;                   // e.g. "Office of the Registrar", "Provost Directorate"
  date: string;                     // e.g. "September 29, 2026"
  placements: BulletinPlacement[];  // Where it will appear (multi-select)
  audiences: BulletinAudience[];    // Who can see it (multi-select)
  isPublished: boolean;             // Live vs Draft status
  pinToTop: boolean;                // Priority pinning in lists
  expiresAt?: string;               // Optional expiration date
  createdAt: string;
  updatedAt: string;
}
