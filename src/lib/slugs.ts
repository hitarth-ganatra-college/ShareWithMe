const ADJECTIVES = [
  'swift', 'bold', 'brave', 'bright', 'calm', 'clever', 'cool', 'epic', 'fast',
  'fresh', 'gentle', 'happy', 'keen', 'lively', 'lucky', 'neat', 'noble',
  'proud', 'quick', 'quiet', 'sharp', 'shiny', 'smart', 'super', 'tidy', 'vivid'
];

const NOUNS = [
  'tiger', 'eagle', 'falcon', 'otter', 'fox', 'panda', 'wolf', 'hawk', 'koala',
  'lynx', 'dolphin', 'bear', 'star', 'nova', 'comet', 'pixel', 'wave', 'breeze',
  'glider', 'spark', 'orbit', 'flame', 'quest', 'pilot', 'coder', 'craft'
];

const RESERVED_SLUGS = new Set([
  'api', 'auth', 'dashboard', 'new', 'login', 'signup', 'admin', 'settings',
  'p', 'raw', 'preview', 'terms', 'privacy', 'about', 'contact', 'public',
  'favicon.ico', 'robots.txt', 'sitemap.xml'
]);

export function generateRandomSlug(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(10 + Math.random() * 90);
  return `${adj}-${noun}-${num}`;
}

export function validateCustomSlug(slug: string): { valid: boolean; error?: string } {
  const cleaned = (slug || '').trim().toLowerCase();

  if (!cleaned) {
    return { valid: false, error: 'Slug cannot be empty' };
  }

  if (cleaned.length < 3) {
    return { valid: false, error: 'Slug must be at least 3 characters long' };
  }

  if (cleaned.length > 40) {
    return { valid: false, error: 'Slug cannot exceed 40 characters' };
  }

  if (RESERVED_SLUGS.has(cleaned)) {
    return { valid: false, error: 'This slug name is reserved' };
  }

  const validPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;
  if (!validPattern.test(cleaned)) {
    return {
      valid: false,
      error: 'Slug can only contain lowercase letters, numbers, and hyphens (no consecutive hyphens)',
    };
  }

  return { valid: true };
}
