export interface GuestProjectRecord {
  slug: string;
  title: string;
  editToken: string;
  expiresAt: string;
}

const GUEST_ID_KEY = 'swm_guest_id';
const GUEST_PROJECTS_KEY = 'sharewithme_guest_projects';

export function getOrCreateGuestSessionId(): string {
  if (typeof window === 'undefined') return '';

  let guestId = localStorage.getItem(GUEST_ID_KEY);
  if (!guestId) {
    // Generate simple UUID-like string
    guestId = 'guest_' + Math.random().toString(36).substring(2, 12) + '_' + Date.now().toString(36);
    localStorage.setItem(GUEST_ID_KEY, guestId);
    // Also set cookie
    document.cookie = `${GUEST_ID_KEY}=${guestId}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
  }
  return guestId;
}

export function getLocalGuestProjects(): GuestProjectRecord[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem(GUEST_PROJECTS_KEY);
    if (!raw) return [];
    const list: GuestProjectRecord[] = JSON.parse(raw);
    const now = Date.now();
    // Filter out expired locally
    return list.filter((p) => new Date(p.expiresAt).getTime() > now);
  } catch {
    return [];
  }
}

export function saveLocalGuestProject(project: GuestProjectRecord) {
  if (typeof window === 'undefined') return;

  try {
    const existing = getLocalGuestProjects();
    const updated = [project, ...existing.filter((p) => p.slug !== project.slug)];
    localStorage.setItem(GUEST_PROJECTS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save guest project to localStorage', e);
  }
}

export function removeLocalGuestProject(slug: string) {
  if (typeof window === 'undefined') return;

  try {
    const existing = getLocalGuestProjects();
    const updated = existing.filter((p) => p.slug !== slug);
    localStorage.setItem(GUEST_PROJECTS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to remove guest project from localStorage', e);
  }
}
