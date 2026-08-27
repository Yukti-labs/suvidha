// Configuration and constants
export const appName = 'Suvidha';
export const appNameLong = 'Suvidha Tools';
export const companyName = 'Yukti Labs';
export const companyTagline = 'Ancient Wisdom. Modern Innovation';
export const themeStorageKey = 'suvidha-theme';

export const pageGroups = [
  {
    label: 'PDF',
    anchor: '#pdf-tools',
    pages: [
      { path: 'pages/pdf/pdf-unlock.html', file: 'pdf-unlock.html', label: 'PDF Unlocker', icon: '🔓' },
      { path: 'pages/pdf/pdf-merger.html', file: 'pdf-merger.html', label: 'PDF Merger', icon: '📎' },
      { path: 'pages/pdf/pdf-compressor.html', file: 'pdf-compressor.html', label: 'PDF Compressor', icon: '📉' }
    ]
  },
  {
    label: 'Image',
    anchor: '#image-tools',
    pages: [
      { path: 'pages/image/image-to-pdf.html', file: 'image-to-pdf.html', label: 'Image to PDF', icon: '🖼️' },
      { path: 'pages/image/image-compressor.html', file: 'image-compressor.html', label: 'Image Compressor', icon: '🗜️' }
    ]
  },
  {
    label: 'Utility',
    anchor: '#utility-tools',
    pages: [
      { path: 'pages/utility/qr-generator.html', file: 'qr-generator.html', label: 'QR Generator', icon: '▦' }
    ]
  },
  {
    label: 'Finance',
    anchor: '#finance-tools',
    pages: [
      { path: 'pages/finance/emi-calculator.html', file: 'emi-calculator.html', label: 'EMI Calculator', icon: '🏦' },
      { path: 'pages/finance/gst-calculator.html', file: 'gst-calculator.html', label: 'GST Calculator', icon: '🧾' },
      { path: 'pages/finance/sip-calculator.html', file: 'sip-calculator.html', label: 'SIP Calculator', icon: '📈' }
    ]
  },
  {
    label: 'Career',
    anchor: '#career-tools',
    pages: [
      { path: 'pages/resume/resume-builder.html', file: 'resume-builder.html', label: 'Resume Builder', icon: '📄' }
    ]
  },
  {
    label: 'JSON',
    anchor: '#json-tools',
    pages: [
      { path: 'pages/json/json-validator.html', file: 'json-validator.html', label: 'JSON Validator', icon: '🔍' },
      { path: 'pages/json/json-formatter.html', file: 'json-formatter.html', label: 'JSON Formatter', icon: '🎨' },
      { path: 'pages/json/json-to-csv.html', file: 'json-to-csv.html', label: 'JSON to CSV', icon: '📊' }
    ]
  },
  {
    label: 'SEO',
    anchor: '#seo-tools',
    pages: [
      { path: 'pages/seo/meta-tag-generator.html', file: 'meta-tag-generator.html', label: 'Meta Tag Generator', icon: '🏷️' },
      { path: 'pages/seo/sitemap-generator.html', file: 'sitemap-generator.html', label: 'Sitemap Generator', icon: '🗺️' },
      { path: 'pages/seo/keyword-analyzer.html', file: 'keyword-analyzer.html', label: 'Keyword Analyzer', icon: '🔑' }
    ]
  },
  {
    label: 'Lookup',
    anchor: '#lookup-tools',
    pages: [
      { path: 'pages/lookup/email-lookup.html', file: 'email-lookup.html', label: 'Email Account Lookup', icon: '📧' },
      { path: 'pages/lookup/money-upi-lookup.html', file: 'money-upi-lookup.html', label: 'Mobile UPI Lookup', icon: '📱' }
    ]
  }
];

export const totalTools = pageGroups.reduce((count, group) => count + group.pages.length, 0);
