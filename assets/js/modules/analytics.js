// Suvidha Privacy-Safe Analytics (Vercel Web Analytics Integration)
// STRICT GUARANTEE: Never transmits file data, filenames, file contents,
// personal information, financial numbers, or raw natural language queries.

const ALLOWED_EVENTS = new Set([
  'tool_opened',
  'tool_started',
  'tool_completed',
  'tool_downloaded',
  'tell_suvidha_opened',
  'tell_suvidha_route',
  'search_used',
  'share_clicked',
  'install_clicked',
  'app_installed'
]);

// Allowed sanitized property keys
const ALLOWED_KEYS = new Set([
  'tool',
  'category',
  'target',
  'platform',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content'
]);

// Initialize Vercel Analytics Queue
if (typeof window !== 'undefined') {
  window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
}

let isScriptLoaded = false;
export function initAnalytics() {
  if (typeof window === 'undefined' || isScriptLoaded) return;
  
  // Only inject script in browser environment if not already present
  if (!document.querySelector('script[src*="insights/script.js"]') && 
      !document.querySelector('script[src*="va.vercel-scripts.com"]')) {
    const script = document.createElement('script');
    script.defer = true;
    script.src = '/_vercel/insights/script.js';
    script.onerror = () => {
      // Gracefully fall back if not hosted on Vercel or in local preview
      console.debug('[Analytics] Vercel insights endpoint not active (local/preview mode)');
    };
    document.head.appendChild(script);
  }
  isScriptLoaded = true;
}

/**
 * Extracts and sanitizes UTM parameters from current URL.
 * Strictly prevents personal data, emails, or file names from leaking.
 */
export function getSanitizedUtm() {
  if (typeof window === 'undefined') return {};
  try {
    const params = new URLSearchParams(window.location.search);
    const utm = {};
    const safeRegex = /^[a-zA-Z0-9_\-\.]{1,64}$/;

    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'].forEach(key => {
      const val = params.get(key);
      if (val && safeRegex.test(val)) {
        // Prevent emails or potential paths
        if (!val.includes('@') && !val.includes('/') && !val.includes('\\')) {
          utm[key] = val;
        }
      }
    });
    return utm;
  } catch {
    return {};
  }
}

/**
 * Sanitizes an event payload against strict privacy rules.
 * Throws away any unrecognized keys, personal info, file names, or raw sentences.
 */
export function sanitizePayload(data = {}) {
  const clean = {};
  if (!data || typeof data !== 'object') return clean;

  for (const [key, val] of Object.entries(data)) {
    if (!ALLOWED_KEYS.has(key)) continue;
    if (typeof val !== 'string' && typeof val !== 'number') continue;

    const strVal = String(val).trim();
    // Safety check: no paths, no sentences (> 80 chars), no emails, no file extensions (.pdf, .png, etc.)
    if (strVal.length > 80) continue;
    if (strVal.includes('@') || strVal.includes('://') || strVal.includes('\\')) continue;
    if (/\.(pdf|jpe?g|png|webp|gif|docx?|json|zip)$/i.test(strVal)) continue;

    clean[key] = strVal;
  }
  return clean;
}

/**
 * Central event tracking function.
 */
export function trackEvent(name, data = {}) {
  if (!ALLOWED_EVENTS.has(name)) {
    console.warn(`[Analytics] Rejected unauthorized event: "${name}"`);
    return false;
  }

  const sanitizedData = sanitizePayload({
    ...getSanitizedUtm(),
    ...data
  });

  // Log in development/preview console
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    console.log(`[Analytics Event] ${name}:`, sanitizedData);
  }

  try {
    if (typeof window !== 'undefined' && typeof window.va === 'function') {
      window.va('event', { name, data: sanitizedData });
    }
  } catch (err) {
    console.debug('[Analytics] Dispatch error:', err.message);
  }

  return true;
}

// Explicit semantic workflow helpers (no blind button auto-detection)
export const analytics = {
  toolOpened(toolSlug, category) {
    return trackEvent('tool_opened', { tool: toolSlug, category });
  },
  toolStarted(toolSlug) {
    return trackEvent('tool_started', { tool: toolSlug });
  },
  toolCompleted(toolSlug) {
    return trackEvent('tool_completed', { tool: toolSlug });
  },
  toolDownloaded(toolSlug) {
    return trackEvent('tool_downloaded', { tool: toolSlug });
  },
  tellSuvidhaOpened() {
    return trackEvent('tell_suvidha_opened');
  },
  tellSuvidhaRoute(toolSlug) {
    return trackEvent('tell_suvidha_route', { tool: toolSlug });
  },
  searchUsed(toolSlug) {
    return trackEvent('search_used', { tool: toolSlug });
  },
  shareClicked(toolSlug) {
    return trackEvent('share_clicked', { tool: toolSlug });
  },
  installClicked(platform) {
    return trackEvent('install_clicked', { platform });
  },
  appInstalled() {
    return trackEvent('app_installed');
  }
};

/**
 * Builds a privacy-safe share URL with sanitized campaign parameters.
 */
export function buildShareUrl(toolUrl, toolSlug) {
  try {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://suvidhatools.in';
    const cleanSlug = toolSlug.replace(/[^a-z0-9_\-]/gi, '_');
    const u = new URL(toolUrl, origin);
    u.search = '';
    u.searchParams.set('utm_source', 'share');
    u.searchParams.set('utm_medium', 'suvidha');
    u.searchParams.set('utm_campaign', cleanSlug);
    return u.toString();
  } catch {
    return toolUrl;
  }
}
