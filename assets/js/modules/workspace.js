// Workspace Module: Recently Used Tools & Local State
// STRICT PRIVACY GUARANTEE:
// Stores ONLY { slug, timestamp } in localStorage.
// NEVER stores uploaded files, filenames, file contents, JSON contents,
// resume contents, financial numbers, passwords, or personal data.

import { normalizeToolSlug, getToolRoute, isValidToolRoute, TOOL_ROUTES } from './routes.js';
import { pageGroups, getToolIcon } from './config.js';

export const RECENT_TOOLS_KEY = 'suvidha_recent_tools';
export const MAX_RECENT_TOOLS = 5;

function getStorage() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
    if (typeof localStorage !== 'undefined') {
      return localStorage;
    }
  } catch (e) {
    // SecurityError or restricted storage access
  }
  return null;
}

/**
 * Records a tool usage into Recently Used.
 * Deduplicates and keeps the newest at the top, max 5 entries.
 * @param {string} identifier - Tool slug, label, or path
 * @returns {Array<{slug: string, timestamp: number}>}
 */
export function recordRecentTool(identifier) {
  const storage = getStorage();
  if (!storage) return [];

  const slug = normalizeToolSlug(identifier);
  if (!slug || !TOOL_ROUTES[slug]) {
    return getRecentTools();
  }

  try {
    const list = getRecentTools();
    // Deduplicate: remove if already exists
    const filtered = list.filter(item => item.slug !== slug);
    // Unshift newest with current timestamp
    filtered.unshift({
      slug,
      timestamp: Date.now()
    });
    // Max 5 items
    const trimmed = filtered.slice(0, MAX_RECENT_TOOLS);
    storage.setItem(RECENT_TOOLS_KEY, JSON.stringify(trimmed));
    return trimmed;
  } catch (err) {
    console.warn('[Workspace] Could not save recent tool:', err);
    return [];
  }
}

/**
 * Retrieves the raw Recently Used tools list from localStorage.
 * @returns {Array<{slug: string, timestamp: number}>}
 */
export function getRecentTools() {
  const storage = getStorage();
  if (!storage) return [];

  try {
    const raw = storage.getItem(RECENT_TOOLS_KEY);
    if (!raw) return [];
    
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // Filter to valid active tools only & normalize format
    const valid = parsed
      .map(item => {
        // Handle legacy format ({ name, url } or string slug)
        const slug = typeof item === 'string' ? item : (item.slug || normalizeToolSlug(item.url || item.name));
        const timestamp = typeof item.timestamp === 'number' ? item.timestamp : Date.now();
        return { slug, timestamp };
      })
      .filter(item => Boolean(item.slug && TOOL_ROUTES[item.slug]));

    // Deduplicate by slug
    const seen = new Set();
    const deduped = [];
    for (const item of valid) {
      if (!seen.has(item.slug)) {
        seen.add(item.slug);
        deduped.push(item);
      }
    }

    return deduped.slice(0, MAX_RECENT_TOOLS);
  } catch (err) {
    console.warn('[Workspace] Could not parse recent tools:', err);
    return [];
  }
}

/**
 * Clears Recently Used history.
 */
export function clearRecentTools() {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.removeItem(RECENT_TOOLS_KEY);
  } catch (err) {
    console.warn('[Workspace] Could not clear recent tools:', err);
  }
}

/**
 * Retrieves hydrated Recent Tool objects with names, icons, descriptions, and canonical URLs.
 * @returns {Array<{slug: string, name: string, url: string, category: string, iconName: string, shortDesc: string, timestamp: number}>}
 */
export function getRecentToolObjects() {
  const recents = getRecentTools();
  if (recents.length === 0) return [];

  const allPages = pageGroups.flatMap(group => 
    group.pages.map(p => ({
      slug: normalizeToolSlug(p.file),
      name: p.label,
      url: getToolRoute(p.file),
      category: group.label,
      iconName: p.iconName,
      shortDesc: p.shortDesc || ''
    }))
  );

  const pageMap = new Map(allPages.map(p => [p.slug, p]));

  return recents
    .map(r => {
      const tool = pageMap.get(r.slug);
      if (!tool) return null;
      return {
        ...tool,
        timestamp: r.timestamp
      };
    })
    .filter(Boolean);
}

/**
 * Renders the Recently Used shelf on the homepage.
 */
export function renderRecentToolsShelf(shelfElement, gridElement, onClear) {
  if (!shelfElement || !gridElement) return;

  const tools = getRecentToolObjects();

  if (tools.length === 0) {
    shelfElement.style.display = 'none';
    gridElement.innerHTML = '';
    return;
  }

  shelfElement.style.display = 'block';
  gridElement.innerHTML = tools.map(tool => `
    <a href="${tool.url}" class="tool-card" data-tool-slug="${tool.slug}">
      <div class="tool-card-head">
        <div class="tool-card-icon">${getToolIcon(tool.iconName)}</div>
        <span class="tool-card-arrow">→</span>
      </div>
      <div class="tool-card-name">${tool.name}</div>
      <div class="tool-card-desc">${tool.shortDesc || tool.category}</div>
    </a>
  `).join('');

  const clearBtn = shelfElement.querySelector('#clearRecentBtn');
  if (clearBtn && !clearBtn.dataset.bound) {
    clearBtn.dataset.bound = 'true';
    clearBtn.addEventListener('click', () => {
      clearRecentTools();
      renderRecentToolsShelf(shelfElement, gridElement, onClear);
      if (typeof onClear === 'function') onClear();
    });
  }
}
