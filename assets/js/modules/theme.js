// Theme management module
import { themeStorageKey, icons } from './config.js';

export function getPreferredTheme() {
  const savedTheme = localStorage.getItem(themeStorageKey);
  if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyTheme(theme, toggles) {
  const nextTheme = theme === 'dark' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', nextTheme);
  localStorage.setItem(themeStorageKey, nextTheme);
  const isDark = nextTheme === 'dark';
  
  const buttons = toggles || document.querySelectorAll('[data-theme-toggle]');
  buttons.forEach(btn => {
    const icon = btn.querySelector('.theme-icon');
    if (icon) {
      icon.innerHTML = isDark ? icons.sun : icons.moon;
    }
    btn.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    btn.setAttribute('title', isDark ? 'Switch to light mode' : 'Switch to dark mode');
  });
}

export function initTheme(toggles) {
  const preferredTheme = getPreferredTheme();
  applyTheme(preferredTheme, toggles);

  document.querySelectorAll('[data-theme-toggle]').forEach(btn => {
    btn.addEventListener('click', () => {
      const activeTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
      applyTheme(activeTheme === 'dark' ? 'light' : 'dark', toggles);
    });
  });
}
