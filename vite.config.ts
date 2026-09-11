import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig, Plugin} from 'vite';

// LINT.IfChange(aistudio_media_plugin)
function aistudioMediaPlugin(): Plugin {
  return {
    name: 'vite-plugin-aistudio-media',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url && (req.url.startsWith('/api/phone-lookup') || req.url.startsWith('/api/proxy') || req.url.startsWith('/api/lookup'))) {
          let phone = '';
          try {
            const urlObj = new URL(req.url, 'http://localhost');
            phone = urlObj.searchParams.get('number') || urlObj.searchParams.get('phone') || urlObj.searchParams.get('num') || urlObj.searchParams.get('mobile') || '';
            const key = urlObj.searchParams.get('key') || 'INDIAN_HACKER_BRO';
            
            // Forward user input as-is without + or +91 to target API
            const targetUrl = `https://api-src.alonepatel.shop/api?key=INDIAN_HACKER_BRO&action=num&number=${encodeURIComponent(phone)}`;
            
            const apiRes = await fetch(targetUrl, {
              headers: {
                'Accept': 'application/json, text/plain, */*',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
              }
            });
            const text = await apiRes.text();
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            res.end(text);
            return;
          } catch (err: any) {
            res.statusCode = 502;
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(JSON.stringify({
              status: "error",
              error: "Remote telecom gateway connection failed",
              message: err?.message || "Failed to reach remote API",
              mobile: phone
            }));
            return;
          }
        }

        if (req.url && (req.url.startsWith('/api/aadhar-lookup') || req.url.startsWith('/api/aadhaar-lookup'))) {
          let aadhar = '';
          try {
            const urlObj = new URL(req.url, 'http://localhost');
            aadhar = urlObj.searchParams.get('aadhar') || urlObj.searchParams.get('aadhaar') || urlObj.searchParams.get('uid') || '';
            
            const targetUrl = `https://api-src.alonepatel.shop/api?key=INDIAN_HACKER_BRO&action=aadhar&aadhar=${encodeURIComponent(aadhar)}`;
            
            const apiRes = await fetch(targetUrl, {
              headers: {
                'Accept': 'application/json, text/plain, */*',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
              }
            });
            const text = await apiRes.text();
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            res.end(text);
            return;
          } catch (err: any) {
            res.statusCode = 502;
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(JSON.stringify({
              status: "error",
              error: "Remote Aadhaar gateway connection failed",
              message: err?.message || "Failed to reach remote API",
              aadhar: aadhar
            }));
            return;
          }
        }

        if (req.url && (req.url.startsWith('/api/upi-lookup') || req.url.startsWith('/api/upi'))) {
          let upi = '';
          try {
            const urlObj = new URL(req.url, 'http://localhost');
            upi = urlObj.searchParams.get('upi') || urlObj.searchParams.get('vpa') || urlObj.searchParams.get('id') || '';
            
            const targetUrl = `https://api-src.alonepatel.shop/api?key=INDIAN_HACKER_BRO&action=upiinfo&upi=${encodeURIComponent(upi)}`;
            
            const apiRes = await fetch(targetUrl, {
              headers: {
                'Accept': 'application/json, text/plain, */*',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
              }
            });
            const text = await apiRes.text();
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            res.end(text);
            return;
          } catch (err: any) {
            res.statusCode = 502;
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(JSON.stringify({
              status: "error",
              error: "Remote UPI gateway connection failed",
              message: err?.message || "Failed to reach remote API",
              upi: upi
            }));
            return;
          }
        }

        if (req.url && (req.url.startsWith('/api/email-lookup') || req.url.startsWith('/api/email'))) {
          let email = '';
          try {
            const urlObj = new URL(req.url, 'http://localhost');
            email = urlObj.searchParams.get('email') || urlObj.searchParams.get('mail') || urlObj.searchParams.get('id') || '';
            
            const targetUrl = `https://api-src.alonepatel.shop/api?key=INDIAN_HACKER_BRO&action=email&email=${encodeURIComponent(email)}`;
            
            const apiRes = await fetch(targetUrl, {
              headers: {
                'Accept': 'application/json, text/plain, */*',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
              }
            });
            const text = await apiRes.text();
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            res.end(text);
            return;
          } catch (err: any) {
            res.statusCode = 502;
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(JSON.stringify({
              status: "error",
              error: "Remote Email gateway connection failed",
              message: err?.message || "Failed to reach remote API",
              email: email
            }));
            return;
          }
        }

        if (req.url && (req.url.startsWith('/api/vehicle-lookup') || req.url.startsWith('/api/rc-lookup') || req.url.startsWith('/api/vehicle') || req.url.startsWith('/api/rc'))) {
          let rc = '';
          try {
            const urlObj = new URL(req.url, 'http://localhost');
            rc = urlObj.searchParams.get('rc') || urlObj.searchParams.get('vehicle') || urlObj.searchParams.get('reg') || urlObj.searchParams.get('number') || '';
            
            const targetUrl = `https://api-src.alonepatel.shop/api?key=INDIAN_HACKER_BRO&action=vehicle-v1&rc=${encodeURIComponent(rc)}`;
            
            const apiRes = await fetch(targetUrl, {
              headers: {
                'Accept': 'application/json, text/plain, */*',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
              }
            });
            const text = await apiRes.text();
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            res.end(text);
            return;
          } catch (err: any) {
            res.statusCode = 502;
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(JSON.stringify({
              status: "error",
              error: "Remote Vehicle / RC gateway connection failed",
              message: err?.message || "Failed to reach remote API",
              rc: rc
            }));
            return;
          }
        }

        if (req.url && (req.url.startsWith('/api/imei-lookup') || req.url.startsWith('/api/imei') || req.url.startsWith('/api/imei-info'))) {
          let imei = '';
          try {
            const urlObj = new URL(req.url, 'http://localhost');
            imei = urlObj.searchParams.get('imei') || urlObj.searchParams.get('imei_num') || urlObj.searchParams.get('num') || urlObj.searchParams.get('number') || '';
            
            const targetUrl = `https://api-src.alonepatel.shop/api?key=INDIAN_HACKER_BRO&action=imei-info&imei_num=${encodeURIComponent(imei)}`;
            
            const apiRes = await fetch(targetUrl, {
              headers: {
                'Accept': 'application/json, text/plain, */*',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
              }
            });
            const text = await apiRes.text();
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            res.end(text);
            return;
          } catch (err: any) {
            res.statusCode = 502;
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(JSON.stringify({
              status: "error",
              error: "Remote IMEI gateway connection failed",
              message: err?.message || "Failed to reach remote API",
              imei: imei
            }));
            return;
          }
        }

        if (req.url && (req.url.startsWith('/api/tgid-lookup') || req.url.startsWith('/api/tgid'))) {
          let tgid = '';
          try {
            const urlObj = new URL(req.url, 'http://localhost');
            tgid = urlObj.searchParams.get('id') || urlObj.searchParams.get('tgid') || '';
            
            const targetUrl = `https://api-src.alonepatel.shop/api?key=Tgid_num&action=tgid&id=${encodeURIComponent(tgid)}`;
            
            const apiRes = await fetch(targetUrl, {
              headers: {
                'Accept': 'application/json, text/plain, */*',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
              }
            });
            const text = await apiRes.text();
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            res.end(text);
            return;
          } catch (err: any) {
            res.statusCode = 502;
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(JSON.stringify({
              status: "error",
              error: "Remote TGID gateway connection failed",
              message: err?.message || "Failed to reach remote API",
              tgid: tgid
            }));
            return;
          }
        }

        if (req.url && req.url.startsWith('/assets/aistudio/')) {
          const rawPath = req.url.split('?')[0].split('#')[0];
          try {
            const decodedPath = decodeURIComponent(rawPath);
            const relativePath = decodedPath.replace(/^\//, '');
            const aistudioDir = path.resolve(
              __dirname,
              'public',
              'assets',
              'aistudio',
            );
            const filePath = path.resolve(__dirname, 'public', relativePath);
            if (
              filePath.startsWith(aistudioDir + path.sep) &&
              fs.existsSync(filePath) &&
              fs.statSync(filePath).isFile()
            ) {
              const ext = path.extname(filePath).toLowerCase();
              const mimeMap: Record<string, string> = {
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.png': 'image/png',
                '.gif': 'image/gif',
                '.webp': 'image/webp',
                '.svg': 'image/svg+xml',
                '.bmp': 'image/bmp',
                '.ico': 'image/x-icon',
                '.mp4': 'video/mp4',
                '.webm': 'video/webm',
                '.ogv': 'video/ogg',
                '.mp3': 'audio/mpeg',
                '.wav': 'audio/wav',
                '.ogg': 'audio/ogg',
                '.pdf': 'application/pdf',
              };
              res.setHeader(
                'Content-Type',
                mimeMap[ext] || 'application/octet-stream',
              );
              res.setHeader('Cache-Control', 'no-cache');
              fs.createReadStream(filePath).pipe(res);
              return;
            }
          } catch {
            // Fall through if URI decoding or file access fails
          }
        }
        next();
      });
    },
  };
}
// LINT.ThenChange(//depot/google3/java/com/google/alkali/boq/makersuite/applet_dev_service/templates/initializers/react_theme/vite.config.ts:aistudio_media_plugin)

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), aistudioMediaPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
