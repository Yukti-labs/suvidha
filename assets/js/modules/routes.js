// Centralized Canonical Tool Route Registry for Suvidha 2.2
// STRICT RULE: All tool routes are canonical and root-relative.
// Never construct routes by concatenating relative directories.

export const TOOL_ROUTES = Object.freeze({
  'pdf-compressor': '/pages/pdf/pdf-compressor.html',
  'pdf-merger': '/pages/pdf/pdf-merger.html',
  'pdf-unlock': '/pages/pdf/pdf-unlock.html',
  'image-compressor': '/pages/image/image-compressor.html',
  'image-to-pdf': '/pages/image/image-to-pdf.html',
  'emi-calculator': '/pages/finance/emi-calculator.html',
  'gst-calculator': '/pages/finance/gst-calculator.html',
  'sip-calculator': '/pages/finance/sip-calculator.html',
  'json-formatter': '/pages/json/json-formatter.html',
  'json-validator': '/pages/json/json-validator.html',
  'json-to-csv': '/pages/json/json-to-csv.html',
  'meta-tag-generator': '/pages/seo/meta-tag-generator.html',
  'sitemap-generator': '/pages/seo/sitemap-generator.html',
  'keyword-analyzer': '/pages/seo/keyword-analyzer.html',
  'resume-builder': '/pages/resume/resume-builder.html',
  'word-counter': '/pages/utility/word-counter.html',
  'qr-generator': '/pages/utility/qr-generator.html',
  'password-generator': '/pages/utility/password-generator.html'
});

const ALIASES = Object.freeze({
  'pdf-unlocker': 'pdf-unlock',
  'qr-code-generator': 'qr-generator',
  'qrcode-generator': 'qr-generator',
  'image-compress': 'image-compressor',
  'pdf-compress': 'pdf-compressor',
  'json-beautifier': 'json-formatter'
});

/**
 * Normalizes any tool identifier (slug, label, file, or path) to its canonical slug.
 */
export function normalizeToolSlug(identifier = '') {
  if (!identifier) return '';
  
  let cleaned = String(identifier).trim().toLowerCase();
  
  // Strip URL query and hashes if present
  cleaned = cleaned.split('?')[0].split('#')[0];
  
  // Extract filename if a path is passed (e.g. /pages/pdf/pdf-compressor.html -> pdf-compressor)
  if (cleaned.includes('/')) {
    cleaned = cleaned.split('/').pop();
  }
  
  // Strip .html extension
  cleaned = cleaned.replace(/\.html$/, '');
  
  // Convert spaces to hyphens (e.g. "PDF Compressor" -> "pdf-compressor")
  cleaned = cleaned.replace(/\s+/g, '-');
  
  // Check aliases
  if (ALIASES[cleaned]) {
    return ALIASES[cleaned];
  }
  
  return cleaned;
}

/**
 * Returns the canonical root-relative route for a tool.
 * @param {string} identifier - Tool name, slug, or filename
 * @param {string} param - Optional query parameter string (e.g. "target=1mb" or "?target=1mb")
 * @returns {string} Root-relative canonical URL (e.g. "/pages/pdf/pdf-compressor.html?target=1mb")
 */
export function getToolRoute(identifier, param = '') {
  const slug = normalizeToolSlug(identifier);
  const route = TOOL_ROUTES[slug];
  
  if (!route) {
    console.warn(`[Routes] Unknown tool identifier: "${identifier}"`);
    return '/';
  }
  
  if (!param) return route;
  
  const cleanParam = String(param).replace(/^\?/, '').trim();
  return cleanParam ? `${route}?${cleanParam}` : route;
}

/**
 * Returns all 18 active tool canonical routes.
 */
export function getAllToolRoutes() {
  return Object.values(TOOL_ROUTES);
}

/**
 * Validates whether a given path is an active production tool route.
 */
export function isValidToolRoute(path = '') {
  if (!path) return false;
  const clean = path.split('?')[0].split('#')[0];
  return Object.values(TOOL_ROUTES).includes(clean);
}
