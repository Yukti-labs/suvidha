// Navigation module
import { appName, appNameLong, companyName, companyTagline, pageGroups, totalTools } from './config.js';

export function getPathInfo() {
  const normalizedPath = decodeURIComponent(location.pathname.replace(/\\/g, '/')).toLowerCase();
  const currentFile = decodeURIComponent(location.pathname.split('/').pop() || 'index.html').toLowerCase() || 'index.html';
  const isHome = normalizedPath.endsWith('/index.html') || (currentFile === 'index.html' && !normalizedPath.includes('/pages/'));
  const homePrefix = isHome ? '' : '../../';
  
  return { normalizedPath, currentFile, isHome, homePrefix };
}

export function getCurrentPageInfo(pathInfo) {
  const { currentFile } = pathInfo;
  const currentGroup = pageGroups.find(group => group.pages.some(page => page.file === currentFile));
  const currentPage = currentGroup?.pages.find(page => page.file === currentFile) || { label: 'Home', icon: '✦' };
  return { currentGroup, currentPage };
}

export function getHrefs(pathInfo) {
  const { isHome } = pathInfo;
  const homePrefix = isHome ? '' : '../../';
  
  return {
    sectionHref: (anchor) => isHome ? anchor : `${homePrefix}index.html${anchor}`,
    groupHref: (group) => isHome ? group.anchor : pageHref(group.pages[0].path, homePrefix),
    pageHref: (pagePath) => {
      const normalizedPath = decodeURIComponent(location.pathname.replace(/\\/g, '/')).toLowerCase();
      if (normalizedPath.endsWith(`/${pagePath}`)) return '#';
      return `${homePrefix}${pagePath}`;
    }
  };
}

function pageHref(pagePath, homePrefix) {
  const normalizedPath = decodeURIComponent(location.pathname.replace(/\\/g, '/')).toLowerCase();
  if (normalizedPath.endsWith(`/${pagePath}`)) return '#';
  return `${homePrefix}${pagePath}`;
}

export function initMobileNavigation(mobileToggle, mobileDrawer, mobileOverlay, mobileClose) {
  const closeMobile = () => {
    mobileDrawer.classList.remove('is-open');
    mobileOverlay.classList.remove('is-open');
    document.body.style.overflow = '';
  };

  const openMobile = () => {
    mobileDrawer.classList.add('is-open');
    mobileOverlay.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  };

  document.querySelectorAll('[data-open-drawer]').forEach(btn => {
    btn.addEventListener('click', openMobile);
  });
  if (mobileToggle && !mobileToggle.hasAttribute('data-open-drawer')) {
    mobileToggle.addEventListener('click', openMobile);
  }
  if (mobileClose) mobileClose.addEventListener('click', closeMobile);
  if (mobileOverlay) mobileOverlay.addEventListener('click', closeMobile);
  
  if (mobileDrawer) {
    mobileDrawer.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMobile));
  }

  return { closeMobile, openMobile };
}

export function initToolsMenu(toolsMenu, toolsTrigger) {
  if (!toolsTrigger || !toolsMenu) return;

  toolsTrigger.addEventListener('click', event => {
    event.preventDefault();
    const open = toolsMenu.classList.toggle('is-open');
    toolsTrigger.setAttribute('aria-expanded', String(open));
  });

  document.addEventListener('click', event => {
    if (toolsMenu && !toolsMenu.contains(event.target)) {
      toolsMenu.classList.remove('is-open');
      toolsTrigger?.setAttribute('aria-expanded', 'false');
    }
  });
}
