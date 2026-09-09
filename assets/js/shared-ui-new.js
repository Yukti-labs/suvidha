// Shared UI module for Suvidha Tools - MiniFolio simplicity & Spectrum UI interactions
import '../css/tool-page.css';
import { appName, appNameLong, companyName, pageGroups, totalTools, icons, getToolIcon } from './modules/config.js';
import { initTheme } from './modules/theme.js';
import { getPathInfo, getCurrentPageInfo, getHrefs, initMobileNavigation } from './modules/navigation.js';
import { initCommandPalette } from './modules/search.js';

(() => {
  if (document.querySelector('.site-header-shell')) return;

  const pathInfo = getPathInfo();
  const { currentGroup, currentPage } = getCurrentPageInfo(pathInfo);
  const { isHome, homePrefix } = pathInfo;
  const brandMarkPath = new URL('../brand/zenskar-mark.svg', import.meta.url).href;
  const faviconPath = new URL('../brand/zenskar-mark.svg', import.meta.url).href;

  // Metadata & Favicon
  const ensureBrandMeta = () => {
    const pageTitle = isHome ? `${appName} — Private browser tools` : `${currentPage.label} — ${appName}`;
    if (!document.title || !document.title.includes(appName)) {
      document.title = pageTitle;
    }
    let icon = document.querySelector('link[rel="icon"]');
    if (!icon) {
      icon = document.createElement('link');
      icon.rel = 'icon';
      document.head.appendChild(icon);
    }
    icon.href = faviconPath;
    icon.type = 'image/svg+xml';
  };
  ensureBrandMeta();

  // Navigation Links
  const homeUrl = isHome ? '#top' : `${homePrefix}index.html`;
  const toolsUrl = isHome ? '#tools' : `${homePrefix}index.html#tools`;
  const privacyUrl = `${homePrefix}pages/privacy.html`;
  const aboutUrl = isHome ? '#about' : `${homePrefix}index.html#about`;

  // Inject Navigation Bar Styles
  const navStyle = document.createElement('style');
  navStyle.id = 'suvidha-nav-styles';
  navStyle.textContent = `
    .site-header-shell {
      position: sticky;
      top: 0;
      z-index: 1000;
      background: color-mix(in srgb, var(--bg) 85%, transparent);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      border-bottom: 1px solid var(--border);
      transition: border-color 0.18s ease;
    }
    .site-header {
      max-width: 1040px;
      margin: 0 auto;
      padding: 0 24px;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }
    .site-logo-wrap {
      display: flex;
      align-items: baseline;
      gap: 10px;
      text-decoration: none;
      color: var(--text);
    }
    .site-logo {
      font-size: 17px;
      font-weight: 700;
      letter-spacing: -0.02em;
    }
    .site-descriptor {
      font-size: 12px;
      color: var(--muted);
      font-weight: 500;
    }
    .site-nav-links {
      display: flex;
      align-items: center;
      gap: 20px;
    }
    .site-nav-item {
      font-size: 13px;
      font-weight: 500;
      color: var(--muted);
      text-decoration: none;
      transition: color 0.15s ease;
    }
    .site-nav-item:hover {
      color: var(--text);
    }
    .site-header-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .header-search-trigger {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      height: 36px;
      padding: 0 12px;
      border-radius: var(--radius-md, 12px);
      border: 1px solid var(--border);
      background: var(--surface);
      color: var(--muted);
      font-size: 13px;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .header-search-trigger:hover {
      border-color: var(--border-hover);
      color: var(--text);
      background: var(--surface2);
    }
    .header-search-trigger kbd {
      font-size: 10px;
      font-family: inherit;
      font-weight: 600;
      padding: 2px 5px;
      border-radius: 4px;
      background: var(--surface2);
      border: 1px solid var(--border);
      color: var(--muted);
    }
    .theme-toggle-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border-radius: var(--radius-md, 12px);
      border: 1px solid var(--border);
      background: var(--surface);
      color: var(--muted);
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .theme-toggle-btn:hover {
      border-color: var(--border-hover);
      color: var(--text);
      background: var(--surface2);
    }
    .mobile-menu-trigger {
      display: none;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border-radius: var(--radius-md, 12px);
      border: 1px solid var(--border);
      background: var(--surface);
      color: var(--text);
      cursor: pointer;
    }
    
    /* Command Palette */
    .cmd-palette {
      position: fixed;
      inset: 0;
      z-index: 10050;
      background: rgba(4, 6, 12, 0.6);
      backdrop-filter: blur(6px);
      display: none;
      align-items: flex-start;
      justify-content: center;
      padding: 10vh 16px 24px;
    }
    .cmd-palette.is-open {
      display: flex;
    }
    .cmd-palette-dialog {
      width: min(600px, 100%);
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg, 16px);
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.28);
      overflow: hidden;
      animation: cmdFadeIn 0.18s ease-out;
    }
    @keyframes cmdFadeIn {
      from { opacity: 0; transform: translateY(-8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .cmd-palette-head {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 18px;
      border-bottom: 1px solid var(--border);
    }
    .cmd-palette-search-icon {
      color: var(--muted);
      display: flex;
    }
    .cmd-palette-head input {
      flex: 1;
      border: none;
      background: transparent;
      font-size: 15px;
      color: var(--text);
      outline: none;
    }
    .cmd-palette-kbd {
      font-size: 11px;
      font-weight: 600;
      padding: 2px 6px;
      border-radius: 4px;
      background: var(--surface2);
      border: 1px solid var(--border);
      color: var(--muted);
    }
    .cmd-palette-list {
      max-height: min(50vh, 380px);
      overflow-y: auto;
      padding: 8px;
    }
    .cmd-palette-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 14px;
      border-radius: var(--radius-md, 12px);
      text-decoration: none;
      color: var(--text);
      transition: background 0.12s ease;
    }
    .cmd-palette-item:hover,
    .cmd-palette-item.is-selected {
      background: var(--surface2);
    }
    .cmd-palette-icon {
      width: 32px;
      height: 32px;
      border-radius: var(--radius-sm, 8px);
      background: var(--surface2);
      display: grid;
      place-items: center;
      color: var(--accent);
      flex-shrink: 0;
    }
    .cmd-palette-copy {
      flex: 1;
      min-width: 0;
    }
    .cmd-palette-title-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .cmd-palette-title-row strong {
      font-size: 14px;
      font-weight: 600;
    }
    .cmd-palette-tag {
      font-size: 11px;
      color: var(--muted);
      font-weight: 500;
    }
    .cmd-palette-copy small {
      display: block;
      font-size: 12px;
      color: var(--muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-top: 1px;
    }
    .cmd-palette-arrow {
      color: var(--muted);
    }
    .cmd-palette-empty {
      padding: 28px;
      text-align: center;
      color: var(--muted);
      font-size: 13px;
    }
    .cmd-palette-foot {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 18px;
      background: var(--surface2);
      border-top: 1px solid var(--border);
      font-size: 11px;
      color: var(--muted);
    }
    .cmd-palette-foot kbd {
      padding: 1px 4px;
      border-radius: 3px;
      background: var(--surface);
      border: 1px solid var(--border);
      margin: 0 2px;
    }

    /* Mobile Drawer */
    .site-mobile-overlay {
      position: fixed;
      inset: 0;
      background: rgba(4, 6, 12, 0.5);
      backdrop-filter: blur(4px);
      z-index: 9998;
      opacity: 0;
      visibility: hidden;
      transition: all 0.2s ease;
    }
    .site-mobile-overlay.is-open {
      opacity: 1;
      visibility: visible;
    }
    .site-mobile-drawer {
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      width: min(320px, 85vw);
      background: var(--surface);
      border-left: 1px solid var(--border);
      z-index: 9999;
      transform: translateX(100%);
      transition: transform 0.24s cubic-bezier(0.16, 1, 0.3, 1);
      display: flex;
      flex-direction: column;
      padding: 20px;
      overflow-y: auto;
    }
    .site-mobile-drawer.is-open {
      transform: translateX(0);
    }
    .drawer-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 24px;
    }
    .drawer-title {
      font-size: 16px;
      font-weight: 700;
    }
    .drawer-close {
      width: 32px;
      height: 32px;
      border-radius: var(--radius-sm, 8px);
      border: 1px solid var(--border);
      background: var(--surface2);
      color: var(--muted);
      cursor: pointer;
      display: grid;
      place-items: center;
    }
    .drawer-links {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 24px;
    }
    .drawer-link {
      font-size: 15px;
      font-weight: 600;
      color: var(--text);
      text-decoration: none;
      padding: 8px 0;
      border-bottom: 1px solid var(--border);
    }
    .drawer-category-title {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--muted);
      margin-bottom: 10px;
    }
    .drawer-categories {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .drawer-cat-link {
      font-size: 13px;
      color: var(--muted);
      text-decoration: none;
      padding: 6px 0;
    }
    .drawer-cat-link:hover {
      color: var(--accent);
    }

    /* Minimal Editorial Footer */
    .site-footer-shell {
      border-top: 1px solid var(--border);
      background: var(--surface);
      margin-top: auto;
    }
    .site-footer {
      max-width: 1040px;
      margin: 0 auto;
      padding: 40px 24px 32px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 20px;
    }
    .footer-brand strong {
      font-size: 15px;
      font-weight: 700;
      display: block;
      color: var(--text);
    }
    .footer-brand span {
      font-size: 13px;
      color: var(--muted);
    }
    .footer-links {
      display: flex;
      align-items: center;
      gap: 20px;
      flex-wrap: wrap;
    }
    .footer-link {
      font-size: 13px;
      color: var(--muted);
      text-decoration: none;
      transition: color 0.15s ease;
    }
    .footer-link:hover {
      color: var(--text);
    }
    .footer-sub {
      width: 100%;
      border-top: 1px solid var(--border);
      padding-top: 20px;
      margin-top: 12px;
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: var(--muted);
      flex-wrap: wrap;
      gap: 10px;
    }

    @media (max-width: 768px) {
      .site-descriptor,
      .site-nav-links {
        display: none;
      }
      .mobile-menu-trigger {
        display: inline-flex;
      }
      .site-header {
        padding: 0 16px;
      }
      .site-footer {
        flex-direction: column;
        align-items: flex-start;
      }
    }
  `;
  document.head.appendChild(navStyle);

  // Header HTML
  const headerHtml = `
    <header class="site-header-shell">
      <div class="site-header">
        <a class="site-logo-wrap" href="${homeUrl}" aria-label="Suvidha Home">
          <span class="site-logo">${appName}</span>
          <span class="site-descriptor">Private browser tools</span>
        </a>
        <nav class="site-nav-links" aria-label="Primary Navigation">
          <a class="site-nav-item" href="${toolsUrl}">Tools</a>
          <a class="site-nav-item" href="${privacyUrl}">Privacy</a>
          <a class="site-nav-item" href="${aboutUrl}">About</a>
        </nav>
        <div class="site-header-actions">
          <button type="button" class="header-search-trigger" data-open-search aria-label="Search tools">
            ${icons.search}
            <span>Search…</span>
            <kbd>/</kbd>
          </button>
          <button type="button" class="theme-toggle-btn" data-theme-toggle aria-label="Toggle theme">
            <span class="theme-icon">${icons.moon}</span>
          </button>
          <button type="button" class="mobile-menu-trigger" id="mobileToggle" aria-label="Open menu">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
          </button>
        </div>
      </div>
    </header>

    <div class="site-mobile-overlay" id="mobileOverlay"></div>
    <aside class="site-mobile-drawer" id="mobileDrawer" aria-label="Mobile Navigation">
      <div class="drawer-head">
        <span class="drawer-title">${appName}</span>
        <button type="button" class="drawer-close" id="mobileClose" aria-label="Close menu">✕</button>
      </div>
      <div class="drawer-links">
        <a class="drawer-link" href="${homeUrl}">Home</a>
        <a class="drawer-link" href="${toolsUrl}">Tools</a>
        <a class="drawer-link" href="${privacyUrl}">Why Private?</a>
        <a class="drawer-link" href="${aboutUrl}">About</a>
      </div>
      <div class="drawer-category-title">Categories</div>
      <div class="drawer-categories">
        ${pageGroups.map(g => `<a class="drawer-cat-link" href="${isHome ? g.anchor : `${homePrefix}index.html${g.anchor}`}">${g.label} (${g.pages.length})</a>`).join('')}
      </div>
    </aside>
  `;

  document.body.insertAdjacentHTML('afterbegin', headerHtml);

  // Minimal Footer HTML
  if (!document.querySelector('.site-footer-shell')) {
    const footerHtml = `
      <footer class="site-footer-shell">
        <div class="site-footer">
          <div class="footer-brand">
            <strong>${appName}</strong>
            <span>Private tools for everyday digital work</span>
          </div>
          <div class="footer-links">
            <a class="footer-link" href="${toolsUrl}">Tools</a>
            <a class="footer-link" href="${privacyUrl}">Privacy</a>
            <a class="footer-link" href="${homeUrl}#faq">FAQ</a>
            <a class="footer-link" href="${aboutUrl}">About</a>
          </div>
          <div class="footer-sub">
            <span>Built with privacy in mind · Processed locally in your browser</span>
            <span>Zero uploads · No tracking · No account</span>
          </div>
        </div>
      </footer>
    `;
    document.body.insertAdjacentHTML('beforeend', footerHtml);
  }

  // Tool Page Enhancements (Standardized Shell)
  if (!isHome && currentGroup && currentPage) {
    const pageContainer = document.querySelector('.tool-page, .content, .container');
    const toolHeader = document.querySelector('.tool-header, .header');

    if (pageContainer && toolHeader) {
      // 1. Breadcrumbs
      const breadcrumbs = document.createElement('nav');
      breadcrumbs.className = 'tool-breadcrumb';
      breadcrumbs.setAttribute('aria-label', 'Breadcrumb');
      breadcrumbs.innerHTML = `
        <a href="${homeUrl}">Suvidha</a>
        <span class="crumb-sep">/</span>
        <a href="${isHome ? currentGroup.anchor : `${homePrefix}index.html${currentGroup.anchor}`}">${currentGroup.label}</a>
        <span class="crumb-sep">/</span>
        <span class="crumb-current">${currentPage.label}</span>
      `;
      toolHeader.insertAdjacentElement('beforebegin', breadcrumbs);

      // 2. Verified Privacy Indicator Tag & Subtle Share Tool Action
      if (!toolHeader.querySelector('.tool-privacy-tag')) {
        const metaRow = document.createElement('div');
        metaRow.className = 'tool-meta-row';
        metaRow.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:8px;flex-wrap:wrap;';

        const privacyTag = document.createElement('div');
        privacyTag.className = 'tool-privacy-tag';
        privacyTag.style.cssText = 'margin-top:0;';
        privacyTag.innerHTML = `${icons.shield} <span>Processed locally · Nothing leaves your device</span>`;
        metaRow.appendChild(privacyTag);

        const shareBtn = document.createElement('button');
        shareBtn.type = 'button';
        shareBtn.className = 'tool-share-btn';
        shareBtn.title = 'Share link to this tool';
        shareBtn.style.cssText = 'display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:500;color:var(--muted);background:none;border:none;cursor:pointer;padding:4px 8px;border-radius:4px;transition:color 0.15s ease;';
        shareBtn.innerHTML = `
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/></svg>
          <span>Share tool</span>
        `;
        shareBtn.addEventListener('click', async () => {
          const shareUrl = window.location.href.split('?')[0];
          const shareText = `Use ${currentPage.label} on Suvidha — private browser tool with zero file uploads:`;
          if (navigator.share) {
            try {
              await navigator.share({ title: `${currentPage.label} — Suvidha`, text: shareText, url: shareUrl });
              return;
            } catch (err) {
              // User cancelled share
            }
          }
          await navigator.clipboard.writeText(shareUrl);
          const origText = shareBtn.innerHTML;
          shareBtn.innerHTML = `<span style="color:var(--success)">✓ Link copied!</span>`;
          setTimeout(() => { shareBtn.innerHTML = origText; }, 2200);
        });
        metaRow.appendChild(shareBtn);

        toolHeader.appendChild(metaRow);
      }

      // 3. Related Tools (Same Category Siblings)
      const siblingTools = currentGroup.pages.filter(p => p.file !== currentPage.file);
      if (siblingTools.length > 0 && !document.querySelector('.related-tools-wrap')) {
        const relatedWrap = document.createElement('div');
        relatedWrap.className = 'related-tools-wrap';
        relatedWrap.innerHTML = `
          <div class="related-tools-title">Related ${currentGroup.label} Tools</div>
          <div class="related-tools-grid">
            ${siblingTools.map(t => `
              <a class="related-tool-chip" href="${t.file}">
                ${getToolIcon(t.iconName)}
                <span>${t.label}</span>
                ${icons.arrowRight}
              </a>
            `).join('')}
          </div>
        `;
        pageContainer.appendChild(relatedWrap);
      }
    }
  }

  // Initialize Modules
  initTheme();
  initCommandPalette({ homePrefix });

  const mobileToggle = document.getElementById('mobileToggle');
  const mobileDrawer = document.getElementById('mobileDrawer');
  const mobileOverlay = document.getElementById('mobileOverlay');
  const mobileClose = document.getElementById('mobileClose');
  initMobileNavigation(mobileToggle, mobileDrawer, mobileOverlay, mobileClose);
})();
