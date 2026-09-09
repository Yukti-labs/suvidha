// Configuration and tool registry for Suvidha Tools
import { icons } from './icons.js';

export const appName = 'Suvidha';
export const appNameLong = 'Suvidha Tools';
export const appTagline = 'Private tools for everyday digital work';
export const companyName = 'Yukti Labs';
export const companyTagline = 'Private browser tools';
export const themeStorageKey = 'suvidha-theme';

export { icons };

export const pageGroups = [
  {
    id: 'pdf',
    label: 'PDF',
    anchor: '#pdf-tools',
    description: 'Compress, merge, and unlock documents without uploading.',
    pages: [
      {
        path: 'pages/pdf/pdf-compressor.html',
        file: 'pdf-compressor.html',
        label: 'PDF Compressor',
        shortDesc: 'Reduce PDF size without uploading',
        iconName: 'compressPdf',
        keywords: ['pdf', 'compress', 'shrink', 'reduce size', 'document', 'optimize']
      },
      {
        path: 'pages/pdf/pdf-merger.html',
        file: 'pdf-merger.html',
        label: 'PDF Merger',
        shortDesc: 'Combine multiple PDFs into one document',
        iconName: 'merger',
        keywords: ['pdf', 'merge', 'combine', 'join', 'reorder', 'pages']
      },
      {
        path: 'pages/pdf/pdf-unlock.html',
        file: 'pdf-unlock.html',
        label: 'PDF Unlocker',
        shortDesc: 'Remove passwords from protected PDFs',
        iconName: 'unlock',
        keywords: ['pdf', 'unlock', 'password', 'decrypt', 'remove password', 'security']
      }
    ]
  },
  {
    id: 'images',
    label: 'Images',
    anchor: '#image-tools',
    description: 'Convert and compress photos directly in canvas memory.',
    pages: [
      {
        path: 'pages/image/image-compressor.html',
        file: 'image-compressor.html',
        label: 'Image Compressor',
        shortDesc: 'Compress JPG, PNG, and WebP images locally',
        iconName: 'compressImage',
        keywords: ['image', 'compress', 'photo', 'jpeg', 'png', 'webp', 'shrink']
      },
      {
        path: 'pages/image/image-to-pdf.html',
        file: 'image-to-pdf.html',
        label: 'Image to PDF',
        shortDesc: 'Convert and combine images into clean PDFs',
        iconName: 'imageToPdf',
        keywords: ['image', 'pdf', 'convert', 'jpg to pdf', 'png to pdf', 'photos to document']
      }
    ]
  },
  {
    id: 'utilities',
    label: 'Utilities',
    anchor: '#utility-tools',
    description: 'Fast, secure everyday tools for productivity and credentials.',
    pages: [
      {
        path: 'pages/utility/qr-generator.html',
        file: 'qr-generator.html',
        label: 'QR Code Generator',
        shortDesc: 'Create instant QR codes for URLs, text, and UPI',
        iconName: 'qr',
        keywords: ['qr', 'qr code', 'barcode', 'generator', 'upi qr', 'wifi qr']
      },
      {
        path: 'pages/utility/password-generator.html',
        file: 'password-generator.html',
        label: 'Password Generator',
        shortDesc: 'Generate strong cryptographically random passwords',
        iconName: 'password',
        keywords: ['password', 'generator', 'secure', 'random', 'credentials', 'passphrase']
      },
      {
        path: 'pages/resume/resume-builder.html',
        file: 'resume-builder.html',
        label: 'Resume Builder',
        shortDesc: 'Build clean, professional resumes with live preview',
        iconName: 'resume',
        keywords: ['resume', 'cv', 'career', 'job', 'builder', 'curriculum vitae', 'profile']
      },
      {
        path: 'pages/utility/word-counter.html',
        file: 'word-counter.html',
        label: 'Word Counter',
        shortDesc: 'Count words, characters, and reading time',
        iconName: 'words',
        keywords: ['word counter', 'character count', 'reading time', 'text', 'length']
      },
      {
        path: 'pages/utility/email-validator.html',
        file: 'email-validator.html',
        label: 'Email Validator',
        shortDesc: 'Verify email format, syntax, and typo detection',
        iconName: 'email',
        keywords: ['email', 'validator', 'syntax', 'check', 'verify', 'mx']
      },
      {
        path: 'pages/utility/upi-validator.html',
        file: 'upi-validator.html',
        label: 'UPI ID Validator',
        shortDesc: 'Check UPI VPA syntax and common PSP handles',
        iconName: 'upi',
        keywords: ['upi', 'vpa', 'payment', 'validator', 'handle', 'gpay', 'phonepe']
      }
    ]
  },
  {
    id: 'finance',
    label: 'Finance',
    anchor: '#finance-tools',
    description: 'Loan, investment, and tax calculations with clear charts.',
    pages: [
      {
        path: 'pages/finance/emi-calculator.html',
        file: 'emi-calculator.html',
        label: 'EMI Calculator',
        shortDesc: 'Calculate monthly loan repayments and interest',
        iconName: 'emi',
        keywords: ['emi', 'loan', 'calculator', 'interest', 'amortization', 'mortgage']
      },
      {
        path: 'pages/finance/gst-calculator.html',
        file: 'gst-calculator.html',
        label: 'GST Calculator',
        shortDesc: 'Add or remove GST with instant CGST and SGST splits',
        iconName: 'gst',
        keywords: ['gst', 'tax', 'calculator', 'cgst', 'sgst', 'reverse gst']
      },
      {
        path: 'pages/finance/sip-calculator.html',
        file: 'sip-calculator.html',
        label: 'SIP Calculator',
        shortDesc: 'Project mutual fund growth and compounding wealth',
        iconName: 'sip',
        keywords: ['sip', 'mutual fund', 'investment', 'compound', 'returns', 'wealth']
      }
    ]
  },
  {
    id: 'developer',
    label: 'Developer',
    anchor: '#developer-tools',
    description: 'Format, validate, and convert JSON and structured data.',
    pages: [
      {
        path: 'pages/json/json-formatter.html',
        file: 'json-formatter.html',
        label: 'JSON Formatter',
        shortDesc: 'Beautify, validate, and minify JSON data',
        iconName: 'jsonFormatter',
        keywords: ['json', 'format', 'prettify', 'minify', 'beautify', 'indent', 'developer']
      },
      {
        path: 'pages/json/json-validator.html',
        file: 'json-validator.html',
        label: 'JSON Validator',
        shortDesc: 'Validate JSON syntax with line and error markers',
        iconName: 'jsonValidator',
        keywords: ['json', 'validate', 'syntax', 'linter', 'parser', 'developer']
      },
      {
        path: 'pages/json/json-to-csv.html',
        file: 'json-to-csv.html',
        label: 'JSON to CSV',
        shortDesc: 'Convert nested JSON arrays into tabular CSV format',
        iconName: 'jsonToCsv',
        keywords: ['json', 'csv', 'converter', 'table', 'spreadsheet', 'excel', 'export']
      }
    ]
  },
  {
    id: 'seo',
    label: 'SEO',
    anchor: '#seo-tools',
    description: 'Metadata, sitemaps, and keyword density for websites.',
    pages: [
      {
        path: 'pages/seo/meta-tag-generator.html',
        file: 'meta-tag-generator.html',
        label: 'Meta Tag Generator',
        shortDesc: 'Generate Open Graph, Twitter, and SEO meta tags',
        iconName: 'metaTag',
        keywords: ['seo', 'meta tags', 'open graph', 'twitter card', 'social preview']
      },
      {
        path: 'pages/seo/sitemap-generator.html',
        file: 'sitemap-generator.html',
        label: 'Sitemap Generator',
        shortDesc: 'Build clean XML sitemaps from URL lists',
        iconName: 'sitemap',
        keywords: ['sitemap', 'xml', 'seo', 'google search', 'indexing', 'urls']
      },
      {
        path: 'pages/seo/keyword-analyzer.html',
        file: 'keyword-analyzer.html',
        label: 'Keyword Analyzer',
        shortDesc: 'Analyze keyword frequency and content density',
        iconName: 'keyword',
        keywords: ['keyword', 'density', 'frequency', 'seo', 'content', 'word count']
      }
    ]
  }
];

export const popularTools = [
  {
    path: 'pages/pdf/pdf-compressor.html',
    file: 'pdf-compressor.html',
    label: 'PDF Compressor',
    shortDesc: 'Reduce PDF size without uploading',
    category: 'PDF',
    iconName: 'compressPdf'
  },
  {
    path: 'pages/image/image-compressor.html',
    file: 'image-compressor.html',
    label: 'Image Compressor',
    shortDesc: 'Shrink JPG, PNG, and WebP images locally',
    category: 'Images',
    iconName: 'compressImage'
  },
  {
    path: 'pages/pdf/pdf-merger.html',
    file: 'pdf-merger.html',
    label: 'PDF Merger',
    shortDesc: 'Combine multiple PDFs into one document',
    category: 'PDF',
    iconName: 'merger'
  },
  {
    path: 'pages/json/json-formatter.html',
    file: 'json-formatter.html',
    label: 'JSON Formatter',
    shortDesc: 'Beautify, validate, and minify JSON data',
    category: 'Developer',
    iconName: 'jsonFormatter'
  },
  {
    path: 'pages/image/image-to-pdf.html',
    file: 'image-to-pdf.html',
    label: 'Image to PDF',
    shortDesc: 'Convert and combine images into clean PDFs',
    category: 'Images',
    iconName: 'imageToPdf'
  },
  {
    path: 'pages/finance/emi-calculator.html',
    file: 'emi-calculator.html',
    label: 'EMI Calculator',
    shortDesc: 'Calculate monthly loan repayments and interest',
    category: 'Finance',
    iconName: 'emi'
  }
];

export const totalTools = pageGroups.reduce((count, group) => count + group.pages.length, 0);

export function getToolIcon(iconName) {
  return icons[iconName] || icons.browser;
}
