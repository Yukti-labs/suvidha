// Main entry point for shared UI components
import { appName, appNameLong, companyName, companyTagline, pageGroups, totalTools } from './modules/config.js';
import { initTheme } from './modules/theme.js';
import { getPathInfo, getCurrentPageInfo, getHrefs, initMobileNavigation, initToolsMenu } from './modules/navigation.js';
import { initFeedbackSystem } from './modules/feedback.js';
import { initCommandPalette } from './modules/search.js';

(() => {
  // Prevent duplicate initialization
  if (document.querySelector('.site-nav-shell')) return;

  // Get path information
  const pathInfo = getPathInfo();
  const { currentGroup, currentPage } = getCurrentPageInfo(pathInfo);
  const { sectionHref, groupHref, pageHref } = getHrefs(pathInfo);
  const { isHome, homePrefix } = pathInfo;

  // Brand assets
  const brandMarkPath = new URL('../brand/zenskar-mark.svg', import.meta.url).href;
  const faviconPath = new URL('../brand/zenskar-mark.svg', import.meta.url).href;

  // Ensure brand metadata
  const ensureBrandMeta = () => {
    const relTitle = document.title || (isHome ? appNameLong : currentPage.label);
    if (!relTitle.toLowerCase().includes('suvidha')) {
      document.title = isHome ? `${appNameLong} — by ${companyName}` : `${currentPage.label} | ${appNameLong}`;
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

  // Inject shared styles
  const style = document.createElement('style');
  style.id = 'shared-ui-styles';
  style.textContent = `
    :root,
    html[data-theme='light']{
      --bg:#f6f8fc !important;
      --surface:#ffffff !important;
      --surface2:#f1f5fb !important;
      --border:#d9e2ef !important;
      --text:#1e293b !important;
      --muted:#64748b !important;
      --accent:#2563eb !important;
      --accent2:#7c3aed !important;
      --accent3:#16a34a !important;
      --hover-bg:#e9f0fb !important;
      --overlay-bg:rgba(4,6,12,.52) !important;
      --nav-bg:rgba(255,255,255,.9) !important;
      --nav-shadow:0 14px 44px rgba(15,23,42,.12) !important;
      --grid-opacity:.06 !important;
    }
    html[data-theme='dark']{
      --bg:#0d1117 !important;
      --surface:#161b22 !important;
      --surface2:#21262d !important;
      --border:#30363d !important;
      --text:#e6edf3 !important;
      --muted:#9aa4b2 !important;
      --accent:#58a6ff !important;
      --accent2:#a78bfa !important;
      --accent3:#3fb950 !important;
      --hover-bg:#263140 !important;
      --overlay-bg:rgba(2,6,12,.66) !important;
      --nav-bg:rgba(22,27,34,.92) !important;
      --nav-shadow:0 18px 52px rgba(0,0,0,.35) !important;
      --grid-opacity:.16 !important;
    }
    body{background:var(--bg) !important;color:var(--text) !important}
    body::before{opacity:var(--grid-opacity) !important}
    .card,.how,.hero-copy,.hero-panel,.workflow-card,.section-panel,.tool-card,.cta-band,.result-card,.rbox,.hero-box,.result-box,.stat,.file-item,.drop-zone,.file-info,.breakdown,.compare-panel{background:var(--surface) !important;border-color:var(--border) !important;color:var(--text) !important}
    .drop-zone,.input-row,input[type=number],input[type=text],input[type=url],input[type=tel],input[type=password],textarea,select,.mode-btn,.rate-btn,.tab,.fmt-btn,.q-btn,.site-mobile-home,.site-mobile-anchor,.site-mobile-company{background:var(--surface2) !important;border-color:var(--border) !important;color:var(--text) !important}
    .tool-desc,.sub,.hero-sub,.panel-copy,.section-copy,.rbox-label,.result-box-label,.field-label,.site-tool-meta,.site-mobile-sub,.site-brand-title,.site-brand-copy,.site-brand{color:var(--text)}
    .eyebrow,.section-kicker,.panel-kicker,.site-brand-meta,.site-brand-sub,.site-tool-meta,.site-mobile-sub,.company-tagline,.footer{color:var(--muted) !important}
    .site-nav,.site-mobile-drawer,.site-tools-dropdown{background:var(--nav-bg) !important;border-color:var(--border) !important;box-shadow:var(--nav-shadow) !important}
    .site-nav-link,.site-tools-trigger,.site-nav-chip,.site-mobile-toggle{color:var(--text) !important}
    .site-nav-link:hover,.site-nav-link.is-active,.site-tools-trigger:hover,.site-tools-trigger[aria-expanded='true'],.site-tool-link:hover,.site-tool-link.is-active{background:var(--hover-bg) !important}
    .site-brand-mark{background:var(--surface) !important}
    .theme-toggle{display:inline-flex;align-items:center;justify-content:center;gap:8px;height:40px;padding:0 14px;border-radius:999px;border:1px solid var(--border);background:var(--surface2);color:var(--text);font-size:12px;font-weight:700;cursor:pointer;transition:all .2s ease}
    .theme-toggle:hover{background:var(--hover-bg)}
    .theme-toggle .theme-icon{font-size:14px;line-height:1}
    .theme-toggle.mobile{width:100%;margin-bottom:10px;justify-content:space-between}
    body.has-site-nav{padding-top:12px !important;}
    .tool-nav{display:none !important;}
    .site-nav-shell{position:fixed;top:0;left:0;right:0;height:64px;z-index:9999;pointer-events:none;display:flex;align-items:center;justify-content:center}
    .site-nav-spacer{height:64px;width:100%;flex:0 0 auto}
    .site-nav{pointer-events:auto;display:flex;align-items:center;justify-content:space-between;gap:12px;max-width:1200px;margin:0 auto;padding:8px 16px;border:1px solid color-mix(in srgb,var(--border) 70%, transparent);border-radius:12px;background:color-mix(in srgb,var(--surface, #141416) 90%, transparent);backdrop-filter:blur(12px);box-shadow:0 8px 24px rgba(0,0,0,0.12);height:100%}
    .site-brand{display:flex;align-items:center;gap:12px;text-decoration:none;color:inherit;min-width:0}
    .site-brand-mark{width:36px;height:36px;border-radius:10px;display:grid;place-items:center;background:color-mix(in srgb,var(--surface2, var(--surface, #1e1e22)) 78%, transparent);border:1px solid color-mix(in srgb,var(--border) 76%, transparent);box-shadow:0 8px 16px color-mix(in srgb,var(--accent, #58a6ff) 15%, transparent);overflow:hidden;padding:5px}
    .site-brand-mark img{width:100%;height:100%;object-fit:contain;display:block}
    .site-brand-title{font-size:14px;font-weight:700;letter-spacing:-0.02em;color:var(--text);white-space:nowrap}
    .site-nav-desktop{display:flex;align-items:center;gap:10px}
    .site-nav-link,.site-tools-trigger{display:inline-flex;align-items:center;justify-content:center;height:40px;padding:0 14px;border-radius:999px;border:1px solid transparent;text-decoration:none;background:transparent;color:var(--muted);font-size:13px;font-weight:600;cursor:pointer;transition:all .2s ease;font-family:inherit}
    .site-nav-link:hover,.site-nav-link.is-active,.site-tools-trigger:hover,.site-tools-trigger[aria-expanded='true']{color:var(--text);background:color-mix(in srgb,var(--surface2, var(--surface, #1e1e22)) 78%, transparent);border-color:color-mix(in srgb,var(--border) 70%, transparent)}
    .site-tools-menu{position:relative}
    .site-tools-dropdown{position:absolute;top:calc(100% + 10px);right:0;width:min(440px,calc(100vw - 48px));padding:16px;border-radius:16px;border:1px solid color-mix(in srgb,var(--border) 82%, transparent);background:color-mix(in srgb,var(--surface, #141416) 96%, transparent);backdrop-filter:blur(20px);box-shadow:0 12px 40px rgba(0,0,0,.22);display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;opacity:0;visibility:hidden;transition:opacity .18s ease,visibility .18s ease;pointer-events:none}
    .site-tools-menu:hover .site-tools-dropdown,.site-tools-menu.is-open .site-tools-dropdown{opacity:1;visibility:visible;pointer-events:auto}
    .site-tool-group{padding:4px}
    .site-tool-group-label{display:block;margin-bottom:8px;font-size:10px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}
    .site-tool-link{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:14px;text-decoration:none;color:var(--text);transition:all .18s ease}
    .site-tool-link:hover,.site-tool-link.is-active{background:color-mix(in srgb,var(--surface2, var(--surface, #1e1e22)) 86%, transparent)}
    .site-tool-icon{width:30px;height:30px;border-radius:10px;display:grid;place-items:center;background:color-mix(in srgb,var(--surface2, var(--surface, #1e1e22)) 88%, transparent);font-size:14px;flex-shrink:0}
    .site-tool-copy{display:flex;flex-direction:column;gap:2px;min-width:0}
    .site-tool-title{font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .site-tool-meta{font-size:11px;color:var(--muted)}
    .site-search-btn{display:inline-flex;align-items:center;gap:8px;height:40px;padding:0 12px 0 14px;border-radius:999px;border:1px solid color-mix(in srgb,var(--border) 70%, transparent);background:color-mix(in srgb,var(--surface2, var(--surface, #1e1e22)) 82%, transparent);color:var(--muted);font-size:12px;font-weight:600;cursor:pointer;font-family:inherit}
    .site-search-btn kbd{font:10px/1 'Syne Mono',monospace;padding:3px 6px;border-radius:6px;border:1px solid var(--border);color:var(--muted)}
    .cmd-palette{position:fixed;inset:0;z-index:10050;background:rgba(4,6,12,.58);backdrop-filter:blur(8px);display:none;align-items:flex-start;justify-content:center;padding:12vh 16px 24px}
    .cmd-palette.is-open{display:flex}
    .cmd-palette-dialog{width:min(640px,100%);border:1px solid var(--border);border-radius:20px;background:var(--surface);box-shadow:0 28px 80px rgba(0,0,0,.35);overflow:hidden}
    .cmd-palette-head{display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid var(--border)}
    .cmd-palette-head input{flex:1;border:0;background:transparent;color:var(--text);font:16px/1.4 inherit;outline:none}
    .cmd-palette-head kbd{font:11px 'Syne Mono',monospace;color:var(--muted)}
    .cmd-palette-list{max-height:min(52vh,420px);overflow:auto;padding:8px}
    .cmd-palette-item{display:flex;align-items:center;gap:12px;padding:12px 12px;border-radius:14px;text-decoration:none;color:var(--text)}
    .cmd-palette-item:hover,.cmd-palette-item:focus{background:var(--hover-bg)}
    .cmd-palette-item strong,.cmd-palette-item small{display:block}
    .cmd-palette-item small{color:var(--muted);font-size:11px;margin-top:2px}
    .cmd-palette-icon{width:34px;height:34px;border-radius:10px;display:grid;place-items:center;background:var(--surface2);flex-shrink:0}
    .cmd-palette-empty{padding:28px 12px;text-align:center;color:var(--muted);font-size:13px}
    .site-nav-actions{display:flex;align-items:center;gap:10px}
    .site-nav-chip{display:inline-flex;align-items:center;gap:8px;height:40px;padding:0 14px;border-radius:999px;border:1px solid color-mix(in srgb,var(--border) 70%, transparent);text-decoration:none;color:var(--text);font-size:12px;font-weight:700;background:color-mix(in srgb,var(--surface2, var(--surface, #1e1e22)) 82%, transparent)}
    .site-nav-chip span{font-size:11px;color:var(--muted);font-weight:500}
    .site-mobile-toggle{display:none;width:44px;height:44px;border-radius:14px;border:1px solid color-mix(in srgb,var(--border) 70%, transparent);background:color-mix(in srgb,var(--surface2, var(--surface, #1e1e22)) 82%, transparent);color:var(--text);cursor:pointer;align-items:center;justify-content:center}
    .site-mobile-toggle svg{width:18px;height:18px}
    .site-mobile-overlay{position:fixed;inset:0;background:var(--overlay-bg);backdrop-filter:blur(4px);z-index:9997;opacity:0;visibility:hidden;transition:all .2s ease}
    .site-mobile-overlay.is-open{opacity:1;visibility:visible}
    .site-mobile-drawer{position:fixed;top:12px;right:12px;bottom:12px;width:min(360px,calc(100vw - 24px));padding:18px;border:1px solid color-mix(in srgb,var(--border) 85%, transparent);border-radius:24px;background:color-mix(in srgb,var(--surface, #141416) 97%, transparent);backdrop-filter:blur(18px);box-shadow:0 20px 60px rgba(0,0,0,.26);z-index:9998;transform:translateX(108%);transition:transform .24s ease;overflow:auto}
    .site-mobile-drawer.is-open{transform:translateX(0)}
    .site-mobile-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px}
    .site-mobile-title{font-size:18px;font-weight:700;letter-spacing:-0.02em;color:var(--text)}
    .site-mobile-sub{font-size:12px;color:var(--muted);margin-top:2px}
    .site-mobile-company{margin:12px 0 14px;padding:10px 12px;border-radius:12px;background:color-mix(in srgb,var(--surface2, var(--surface, #1e1e22)) 75%, transparent);border:1px solid color-mix(in srgb,var(--border) 65%, transparent)}
    .site-mobile-company strong{display:block;font-size:13px;color:var(--text)}
    .site-mobile-company span{display:block;font-size:11px;color:var(--muted);margin-top:2px}
    .site-mobile-close{width:40px;height:40px;border:none;border-radius:12px;background:color-mix(in srgb,var(--surface2, var(--surface, #1e1e22)) 88%, transparent);color:var(--text);cursor:pointer}
    .site-mobile-home,.site-mobile-anchor{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 14px;margin-bottom:10px;border-radius:16px;border:1px solid color-mix(in srgb,var(--border) 72%, transparent);text-decoration:none;color:var(--text);background:color-mix(in srgb,var(--surface2, var(--surface, #1e1e22)) 72%, transparent)}
    .site-mobile-anchor-list{display:grid;gap:8px;margin-bottom:14px}
    .site-mobile-group{padding:14px 0;border-top:1px solid color-mix(in srgb,var(--border) 56%, transparent)}
    .site-mobile-group:first-of-type{border-top:none;padding-top:4px}
    .site-mobile-group-label{display:block;margin-bottom:10px;font-size:10px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}
    .site-mobile-tool{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 0;text-decoration:none;color:var(--text);border-bottom:1px solid color-mix(in srgb,var(--border) 38%, transparent)}
    .site-mobile-tool:last-child{border-bottom:none;padding-bottom:0}
    .site-mobile-tool-info{display:flex;align-items:center;gap:10px;min-width:0}
    .site-mobile-tool-arrow{color:var(--muted);font-size:14px}
    .page-crumb{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:0 0 18px;padding:10px 14px;border:1px solid color-mix(in srgb,var(--border) 70%, transparent);border-radius:16px;background:color-mix(in srgb,var(--surface, #141416) 84%, transparent);font-size:12px;color:var(--muted);backdrop-filter:blur(10px)}
    .page-crumb a{color:var(--text);text-decoration:none;font-weight:600}
    .page-crumb strong{color:var(--text)}
    .global-footer-wrap{max-width:1180px;margin:34px auto 14px;padding:0 22px}
    .global-footer{border:1px solid var(--border);background:var(--surface);border-radius:24px;padding:22px 22px 16px;box-shadow:var(--nav-shadow)}
    .global-footer-top{display:grid;grid-template-columns:1.2fr .9fr;gap:20px;align-items:start}
    .gf-title{font-size:16px;font-weight:700;letter-spacing:-.02em;color:var(--text);margin-bottom:6px}
    .gf-sub{font-size:13px;color:var(--muted);line-height:1.7}
    .gf-links{display:grid;grid-template-columns:1fr 1fr;gap:10px}
    .gf-link{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:10px 12px;border:1px solid var(--border);background:var(--surface2);border-radius:12px;text-decoration:none;color:var(--text);font-size:12px;font-weight:600;transition:all .2s ease}
    .gf-link span{color:var(--muted);font-family:'Syne Mono',monospace;font-size:11px}
    .gf-link:hover{background:var(--hover-bg)}
    .gf-badges{display:flex;flex-wrap:gap:8px;margin-top:14px}
    .gf-badge{padding:7px 10px;border:1px solid var(--border);border-radius:999px;background:var(--surface2);font:11px 'Syne Mono',monospace;color:var(--muted)}
    .gf-bottom{margin-top:14px;padding-top:12px;border-top:1px solid var(--border);display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;color:var(--muted);font:11px 'Syne Mono',monospace}
    .app-dock{display:none}
    @media (max-width: 960px){
      .site-nav-desktop,.site-nav-chip{display:none}
      .site-mobile-toggle{display:none}
      .site-search-btn{display:none}
      .theme-toggle:not(.mobile){display:none}
      .app-dock{display:grid;grid-template-columns:repeat(4,1fr);position:fixed;left:12px;right:12px;bottom:max(10px,env(safe-area-inset-bottom));z-index:9996;padding:6px;border:1px solid var(--border);border-radius:22px;background:color-mix(in srgb,var(--surface) 92%, transparent);backdrop-filter:blur(18px);box-shadow:0 12px 40px rgba(0,0,0,.28)}
      .app-dock-item{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;min-height:52px;border:0;background:transparent;color:var(--muted);text-decoration:none;font-size:10px;font-weight:700;cursor:pointer;font-family:inherit;border-radius:16px}
      .app-dock-item.is-active,.app-dock-item:hover{color:var(--text);background:var(--hover-bg)}
      .app-dock-icon{font-size:18px;line-height:1}
      body.has-site-nav{padding-bottom:92px !important}
    }
    @media (prefers-reduced-motion: reduce){
      *,*::before,*::after{animation:none !important;transition:none !important}
    }
    @media (max-width: 760px){
      .content{max-width:100% !important}
      .card,.how{padding:20px !important}
      .settings,.result-grid,.result-hero,.result-row-grid,.result-rows,.quality-grid,.stats.visible,.result-stats.visible,.compare.visible{grid-template-columns:1fr !important}
      .tabs{grid-template-columns:repeat(2,minmax(0,1fr)) !important}
      .rate-grid{grid-template-columns:repeat(3,minmax(0,1fr)) !important}
      .dl-row,.fmt-row{flex-direction:column !important}
      .drop-zone{padding:24px 18px !important}
      .compare-panel img{height:140px !important}
      .result-card,.hero-box,.result-box,.rbox,.stat{padding:14px !important}
    }
    @media (max-width: 520px){
      .site-nav-shell{top:12px;left:12px;right:12px}
      .site-nav{padding:12px 14px;border-radius:18px}
      .site-nav-spacer{height:88px}
      .site-brand-mark{width:38px;height:38px;border-radius:12px}
      .site-brand-title{font-size:14px}
      .tabs,.mode-row{grid-template-columns:repeat(2,minmax(0,1fr)) !important}
      .rate-grid{grid-template-columns:repeat(2,minmax(0,1fr)) !important}
      .breakdown-row,.file-info,.compare-label,.slider-row{flex-direction:column;align-items:flex-start}
      body.has-site-nav{padding-left:14px !important;padding-right:14px !important}
      .header{margin-bottom:28px !important}
      .global-footer-wrap{margin-top:28px;padding:0 14px}
      .global-footer{padding:18px 16px 14px;border-radius:18px}
      .global-footer-top{grid-template-columns:1fr}
      .gf-links{grid-template-columns:1fr}
    }

    /* Quiet, high-frequency UI: no lift, no stagger, no looping motion */
    .workflow-card,.tool-card,.section-panel,.cta-band,.gf-link,.category-link{
      transition:background-color .15s ease,border-color .15s ease,box-shadow .15s ease;
    }
    .workflow-card:hover,.tool-card:hover{
      border-color:color-mix(in srgb,var(--accent) 40%, var(--border));
      background:var(--hover-bg) !important;
    }
    .btn,.theme-toggle,.app-dock-item,.site-nav-link,.site-tool-link{
      transition:background-color .15s ease,border-color .15s ease,color .15s ease;
    }
    .btn:active,.site-nav-link:active,.site-tool-link:active,.gf-link:active,.app-dock-item:active{
      transform:scale(0.98);
    }
    .input-row input,.input-row select,.input-row textarea{
      border:none;
      border-radius:8px;
      padding:12px 16px;
    }
    .input-row input:focus,.input-row select:focus,.input-row textarea:focus{
      outline:none;
      box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 35%, transparent);
      background:var(--surface);
    }
    .category-bar{
      display:flex;
      flex-wrap:wrap;
      gap:8px;
      margin:12px 0;
      padding:0 8px;
    }
    .category-link{
      display:inline-flex;
      align-items:center;
      gap:6px;
      padding:6px 12px;
      border-radius:999px;
      border:1px solid color-mix(in srgb,var(--border) 60%, transparent);
      text-decoration:none;
      font-size:13px;
      font-weight:600;
      color:var(--muted);
    }
    .category-link:hover{
      color:var(--text);
      background:color-mix(in srgb,var(--surface2, var(--surface, #1e1e22)) 70%, transparent);
    }
    .category-link.is-active{
      color:var(--text);
      background:color-mix(in srgb,var(--accent, #58a6ff) 20%, transparent);
      border-color:color-mix(in srgb,var(--accent, #58a6ff) 40%, transparent);
    }
    :focus-visible{
      outline:2px solid var(--accent);
      outline-offset:2px;
    }
    .cmd-palette-item{transition:none}
  `;
  document.head.appendChild(style);
  document.body.classList.add('has-site-nav');

  // Generate navigation HTML
  const desktopGroups = pageGroups.map(group => `
    <div class="site-tool-group">
      <span class="site-tool-group-label">${group.label}</span>
      ${group.pages.map(page => `
        <a class="site-tool-link${page.file === pathInfo.currentFile ? ' is-active' : ''}" href="${pageHref(page.path)}">
          <span class="site-tool-icon">${page.icon}</span>
          <span class="site-tool-copy">
            <span class="site-tool-title">${page.label}</span>
            <span class="site-tool-meta">${group.label} tool</span>
          </span>
        </a>
      `).join('')}
    </div>
  `).join('');

  const mobileGroups = pageGroups.map(group => `
    <div class="site-mobile-group">
      <span class="site-mobile-group-label">${group.label}</span>
      ${group.pages.map(page => `
        <a class="site-mobile-tool" href="${pageHref(page.path)}">
          <span class="site-mobile-tool-info">
            <span class="site-tool-icon">${page.icon}</span>
            <span class="site-tool-copy">
              <span class="site-tool-title">${page.label}</span>
              <span class="site-tool-meta">${group.label} tool</span>
            </span>
          </span>
          <span class="site-mobile-tool-arrow">→</span>
        </a>
      `).join('')}
    </div>
  `).join('');

  const navHtml = `
    <div class="site-nav-shell">
      <div class="site-nav">
        <a class="site-brand" href="${isHome ? '#top' : `${homePrefix}index.html`}" aria-label="Go to ${appName} home">
          <span class="site-brand-mark"><img src="${brandMarkPath}" alt="${companyName} logo"></span>
          <span class="site-brand-title">${appNameLong}</span>
        </a>
        <nav class="site-nav-desktop" aria-label="Primary navigation">
          <a class="site-nav-link${isHome ? ' is-active' : ''}" href="${isHome ? '#top' : `${homePrefix}index.html`}">Home</a>
          ${pageGroups.slice(0, 4).map(group => `<a class="site-nav-link" href="${groupHref(group)}">${group.label}</a>`).join('')}
          <div class="site-tools-menu" id="siteToolsMenu">
            <button class="site-tools-trigger" id="siteToolsTrigger" type="button" aria-expanded="false">All tools</button>
            <div class="site-tools-dropdown">${desktopGroups}</div>
          </div>
        </nav>
        <div class="site-nav-actions">
          <button class="site-search-btn" type="button" data-open-search aria-label="Search tools">Search <kbd>Ctrl K</kbd></button>
          <button class="theme-toggle" type="button" data-theme-toggle><span class="theme-icon">🌙</span><span class="theme-text">Dark</span></button>
          <button class="site-mobile-toggle" id="siteMobileToggle" type="button" data-open-drawer aria-label="Open menu">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
          </button>
        </div>
      </div>
    </div>
    <div class="site-nav-spacer" aria-hidden="true"></div>
    <div class="site-mobile-overlay" id="siteMobileOverlay"></div>
    <aside class="site-mobile-drawer" id="siteMobileDrawer" aria-label="Mobile navigation">
      <div class="site-mobile-head">
        <div>
          <div class="site-mobile-title">${appNameLong}</div>
          <div class="site-mobile-sub">${currentGroup ? `${currentGroup.label} · ${currentPage.label}` : 'Private web toolkit'}</div>
        </div>
        <button class="site-mobile-close" id="siteMobileClose" type="button" aria-label="Close menu">✕</button>
      </div>
      <div class="site-mobile-company"><strong>${companyName}</strong><span>${companyTagline}</span></div>
      <button class="theme-toggle mobile" type="button" data-theme-toggle><span><span class="theme-icon">🌙</span> <span class="theme-text">Dark</span></span><strong>Theme</strong></button>
      <button class="theme-toggle mobile" type="button" data-open-search><span>Search tools</span><strong>Ctrl K</strong></button>
      <a class="site-mobile-home" href="${isHome ? '#top' : `${homePrefix}index.html`}">
        <span>Go to home</span>
        <strong>${totalTools} tools</strong>
      </a>
      <div class="site-mobile-anchor-list">
        ${pageGroups.map(group => `<a class="site-mobile-anchor" href="${groupHref(group)}"><span>${group.label}</span><strong>View</strong></a>`).join('')}
      </div>
      ${mobileGroups}
    </aside>
  `;

  document.body.insertAdjacentHTML('afterbegin', navHtml);
  document.body.insertAdjacentHTML('beforeend', `
    <nav class="app-dock" aria-label="App shortcuts">
      <a class="app-dock-item${isHome ? ' is-active' : ''}" href="${isHome ? '#top' : `${homePrefix}index.html`}">
        <span class="app-dock-icon">⌂</span>
        <span>Home</span>
      </a>
      <button class="app-dock-item" type="button" data-open-search>
        <span class="app-dock-icon">⌕</span>
        <span>Search</span>
      </button>
      <button class="app-dock-item" type="button" data-open-drawer>
        <span class="app-dock-icon">☰</span>
        <span>Tools</span>
      </button>
      <button class="app-dock-item" type="button" data-theme-toggle>
        <span class="theme-icon app-dock-icon">🌙</span>
        <span class="theme-text">Theme</span>
      </button>
    </nav>
  `);

  // Generate footer
  if (!document.querySelector('.global-footer-wrap')) {
    const footerWrap = document.createElement('div');
    footerWrap.className = 'global-footer-wrap';
    const year = new Date().getFullYear();
    footerWrap.innerHTML = `
      <footer class="global-footer">
        <div class="global-footer-top">
          <div>
            <div class="gf-title">Suvidha Tools</div>
            <div class="gf-sub">A private web toolkit by ${companyName} · ${companyTagline}</div>
            <div class="gf-badges">
              <span class="gf-badge">Zero uploads</span>
              <span class="gf-badge">Works offline</span>
              <span class="gf-badge">Mobile ready</span>
              <span class="gf-badge">No signup</span>
            </div>
          </div>
          <div class="gf-links">
            <a class="gf-link" href="${groupHref(pageGroups[0])}">PDF Tools <span>Open</span></a>
            <a class="gf-link" href="${groupHref(pageGroups[1])}">Image Tools <span>Open</span></a>
            <a class="gf-link" href="${groupHref(pageGroups[2])}">Utility <span>Open</span></a>
            <a class="gf-link" href="${groupHref(pageGroups[3])}">Finance <span>Open</span></a>
            <a class="gf-link" href="${groupHref(pageGroups[5])}">JSON Tools <span>Open</span></a>
            <a class="gf-link feedback-footer-link" href="#" id="footerFeedbackBtn">Send Feedback <span>💬</span></a>
          </div>
        </div>
        <div class="gf-bottom">
          <span>© ${year} Yukti Labs</span>
          <span>Ancient Wisdom. Modern Innovation</span>
        </div>
      </footer>
    `;
    document.body.appendChild(footerWrap);
  }

  // Add page breadcrumbs and category bar for non-home pages
  if (!isHome) {
    const header = document.querySelector('.content .header, .header');
    if (header) {
      header.insertAdjacentHTML('beforebegin', `
        <div class="page-crumb">
          <a href="${homePrefix}index.html">${appName} home</a>
          <span>•</span>
          <a href="${homePrefix}index.html${currentGroup?.anchor || ''}">${currentGroup?.label || 'Tools'}</a>
          <span>•</span>
          <strong>${currentPage.label}</strong>
        </div>
      `);
      header.insertAdjacentHTML('afterend', `
        <div class="category-bar">
          ${pageGroups.map(g => `<a class="category-link${g === currentGroup ? ' is-active' : ''}" href="${homePrefix}index.html${g.anchor}">${g.label}</a>`).join('')}
        </div>
      `);
    }
  }

  // Initialize modules
  const themeToggles = document.querySelectorAll('[data-theme-toggle]');
  initTheme(themeToggles);

  const mobileToggle = document.getElementById('siteMobileToggle');
  const mobileDrawer = document.getElementById('siteMobileDrawer');
  const mobileOverlay = document.getElementById('siteMobileOverlay');
  const mobileClose = document.getElementById('siteMobileClose');
  initMobileNavigation(mobileToggle, mobileDrawer, mobileOverlay, mobileClose);

  const toolsMenu = document.getElementById('siteToolsMenu');
  const toolsTrigger = document.getElementById('siteToolsTrigger');
  initToolsMenu(toolsMenu, toolsTrigger);
  initCommandPalette({ homePrefix, pageHref });

  // Initialize feedback system
  initFeedbackSystem();

})();
