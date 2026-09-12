import { defineConfig } from 'vite';
import { resolve } from 'node:path';

function apiDevServerPlugin() {
  return {
    name: 'api-dev-server',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url === '/api/feedback' || req.url.startsWith('/api/feedback?')) {
          if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', async () => {
              try {
                const handler = (await import('./api/feedback.js')).default;
                req.body = body;
                res.status = (code) => {
                  res.statusCode = code;
                  return res;
                };
                res.json = (data) => {
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify(data));
                };
                await handler(req, res);
              } catch (err) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: false, error: err.message }));
              }
            });
            return;
          } else if (req.method === 'OPTIONS') {
            res.statusCode = 200;
            res.end();
            return;
          }
        }
        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [apiDevServerPlugin()],
  base: './',
  publicDir: 'public',
  server: {
    open: true
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        pdfUnlock: resolve(__dirname, 'pages/pdf/pdf-unlock.html'),
        pdfMerger: resolve(__dirname, 'pages/pdf/pdf-merger.html'),
        pdfCompressor: resolve(__dirname, 'pages/pdf/pdf-compressor.html'),
        imageToPdf: resolve(__dirname, 'pages/image/image-to-pdf.html'),
        imageCompressor: resolve(__dirname, 'pages/image/image-compressor.html'),
        qrGenerator: resolve(__dirname, 'pages/utility/qr-generator.html'),
        passwordGenerator: resolve(__dirname, 'pages/utility/password-generator.html'),
        wordCounter: resolve(__dirname, 'pages/utility/word-counter.html'),
        emailValidator: resolve(__dirname, 'pages/utility/email-validator.html'),
        upiValidator: resolve(__dirname, 'pages/utility/upi-validator.html'),
        emiCalculator: resolve(__dirname, 'pages/finance/emi-calculator.html'),
        gstCalculator: resolve(__dirname, 'pages/finance/gst-calculator.html'),
        sipCalculator: resolve(__dirname, 'pages/finance/sip-calculator.html'),
        resumeBuilder: resolve(__dirname, 'pages/resume/resume-builder.html'),
        jsonValidator: resolve(__dirname, 'pages/json/json-validator.html'),
        jsonFormatter: resolve(__dirname, 'pages/json/json-formatter.html'),
        jsonToCsv: resolve(__dirname, 'pages/json/json-to-csv.html'),
        metaTagGenerator: resolve(__dirname, 'pages/seo/meta-tag-generator.html'),
        sitemapGenerator: resolve(__dirname, 'pages/seo/sitemap-generator.html'),
        keywordAnalyzer: resolve(__dirname, 'pages/seo/keyword-analyzer.html'),
        emailLookup: resolve(__dirname, 'pages/lookup/email-lookup.html'),
        moneyUpiLookup: resolve(__dirname, 'pages/lookup/money-upi-lookup.html'),
        privacy: resolve(__dirname, 'pages/privacy.html')
      }
    }
  }
});
