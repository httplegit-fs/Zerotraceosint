import { Request, Response, NextFunction } from 'express';

export const proxyMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.url) return next();

  try {
    // 1. Phone Lookup Proxy
    if (req.url.startsWith('/api/phone-lookup') || req.url.startsWith('/api/lookup')) {
      let phone = '';
      try {
        const urlObj = new URL(req.url, 'http://localhost');
        phone = urlObj.searchParams.get('number') || urlObj.searchParams.get('phone') || urlObj.searchParams.get('num') || urlObj.searchParams.get('mobile') || '';
        const key = urlObj.searchParams.get('key') || '';
        const action = urlObj.searchParams.get('action') || '';
        const customTarget = urlObj.searchParams.get('targetUrl') || '';
        
        let targetUrl = '';
        if (customTarget && customTarget.includes('alonepatel.shop')) {
          targetUrl = `https://api-src.alonepatel.shop/api?key=${encodeURIComponent(key || 'INDIAN_HACKER_BRO')}&action=${encodeURIComponent(action || 'num')}&number=${encodeURIComponent(phone)}`;
        } else if (customTarget && customTarget.includes('trycloudflare.com')) {
          targetUrl = `https://storage-deutschland-don-patterns.trycloudflare.com/num?number=${encodeURIComponent(phone)}&key=${encodeURIComponent(key || 'DADDY')}`;
        } else if (customTarget) {
          const u = new URL(customTarget);
          if (key) u.searchParams.set(urlObj.searchParams.get('keyParam') || 'key', key);
          if (action) u.searchParams.set(urlObj.searchParams.get('actionParam') || 'action', action);
          u.searchParams.set(urlObj.searchParams.get('queryParam') || 'number', phone);
          targetUrl = u.toString();
        } else {
          targetUrl = `https://storage-deutschland-don-patterns.trycloudflare.com/num?number=${encodeURIComponent(phone)}&key=${encodeURIComponent(key || 'DADDY')}`;
        }
        
        const apiRes = await fetch(targetUrl, {
          headers: {
            'Accept': 'application/json, text/plain, */*',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36'
          }
        });
        const text = await apiRes.text();
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.send(text);
        return;
      } catch (err: any) {
        try {
          const fallbackUrl = `https://api-src.alonepatel.shop/api?key=INDIAN_HACKER_BRO&action=num&number=${encodeURIComponent(phone)}`;
          const fbRes = await fetch(fallbackUrl);
          const fbText = await fbRes.text();
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.send(fbText);
          return;
        } catch (fbErr: any) {
          res.status(502).json({
            status: "error",
            error: "Remote telecom gateway connection failed",
            message: err?.message || "Failed to reach remote API",
            mobile: phone
          });
          return;
        }
      }
    }

    // 2. Aadhaar Lookup Proxy
    if (req.url.startsWith('/api/aadhar-lookup') || req.url.startsWith('/api/aadhaar-lookup')) {
      let aadhar = '';
      try {
        const urlObj = new URL(req.url, 'http://localhost');
        aadhar = urlObj.searchParams.get('aadhar') || urlObj.searchParams.get('aadhaar') || urlObj.searchParams.get('uid') || urlObj.searchParams.get('value') || '';
        const key = urlObj.searchParams.get('key') || 'INDIAN_HACKER_BRO';
        const action = urlObj.searchParams.get('action') || 'aadhar';
        const customTarget = urlObj.searchParams.get('targetUrl') || '';
        const queryParam = urlObj.searchParams.get('queryParam') || '';

        let targetUrl = '';
        if (customTarget && customTarget.includes('trycloudflare.com')) {
          const qParam = queryParam || 'aadhar';
          const cleanBase = customTarget.split('?')[0];
          targetUrl = `${cleanBase}?${qParam}=${encodeURIComponent(aadhar)}&key=${encodeURIComponent(key || 'DADDY')}`;
        } else if (customTarget && customTarget.includes('alonepatel.shop')) {
          targetUrl = `https://api-src.alonepatel.shop/api?key=${encodeURIComponent(key)}&action=${encodeURIComponent(action)}&aadhar=${encodeURIComponent(aadhar)}`;
        } else if (customTarget) {
          const u = new URL(customTarget);
          if (key) u.searchParams.set('key', key);
          if (action) u.searchParams.set('action', action);
          u.searchParams.set(queryParam || 'aadhar', aadhar);
          targetUrl = u.toString();
        } else {
          targetUrl = `https://api-src.alonepatel.shop/api?key=${encodeURIComponent(key)}&action=aadhar&aadhar=${encodeURIComponent(aadhar)}`;
        }
        
        const apiRes = await fetch(targetUrl, {
          headers: { 'Accept': 'application/json, text/plain, */*' }
        });
        const text = await apiRes.text();
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.send(text);
        return;
      } catch (err: any) {
        res.status(502).json({
          status: "error",
          error: "Remote Aadhaar gateway connection failed",
          message: err?.message,
          aadhar
        });
        return;
      }
    }

    // 3. UPI Lookup Proxy
    if (req.url.startsWith('/api/upi-lookup') || req.url.startsWith('/api/upi')) {
      let upi = '';
      try {
        const urlObj = new URL(req.url, 'http://localhost');
        upi = urlObj.searchParams.get('upi') || urlObj.searchParams.get('vpa') || urlObj.searchParams.get('id') || urlObj.searchParams.get('value') || '';
        const key = urlObj.searchParams.get('key') || 'INDIAN_HACKER_BRO';
        const action = urlObj.searchParams.get('action') || 'upiinfo';
        const customTarget = urlObj.searchParams.get('targetUrl') || '';
        const queryParam = urlObj.searchParams.get('queryParam') || '';

        let targetUrl = '';
        if (customTarget && customTarget.includes('trycloudflare.com')) {
          const qParam = queryParam || 'upi';
          const cleanBase = customTarget.split('?')[0];
          targetUrl = `${cleanBase}?${qParam}=${encodeURIComponent(upi)}&key=${encodeURIComponent(key || 'DADDY')}`;
        } else if (customTarget && customTarget.includes('alonepatel.shop')) {
          targetUrl = `https://api-src.alonepatel.shop/api?key=${encodeURIComponent(key)}&action=${encodeURIComponent(action)}&upi=${encodeURIComponent(upi)}`;
        } else if (customTarget) {
          const u = new URL(customTarget);
          if (key) u.searchParams.set('key', key);
          if (action) u.searchParams.set('action', action);
          u.searchParams.set(queryParam || 'upi', upi);
          targetUrl = u.toString();
        } else {
          targetUrl = `https://api-src.alonepatel.shop/api?key=${encodeURIComponent(key)}&action=upiinfo&upi=${encodeURIComponent(upi)}`;
        }
        
        const apiRes = await fetch(targetUrl, {
          headers: { 'Accept': 'application/json, text/plain, */*' }
        });
        const text = await apiRes.text();
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.send(text);
        return;
      } catch (err: any) {
        res.status(502).json({
          status: "error",
          error: "Remote UPI gateway connection failed",
          message: err?.message,
          upi
        });
        return;
      }
    }

    // 4. Email Lookup Proxy
    if (req.url.startsWith('/api/email-lookup') || req.url.startsWith('/api/email')) {
      let email = '';
      try {
        const urlObj = new URL(req.url, 'http://localhost');
        email = urlObj.searchParams.get('email') || urlObj.searchParams.get('mail') || urlObj.searchParams.get('id') || urlObj.searchParams.get('value') || '';
        const key = urlObj.searchParams.get('key') || '';
        const action = urlObj.searchParams.get('action') || '';
        const customTarget = urlObj.searchParams.get('targetUrl') || '';
        const queryParam = urlObj.searchParams.get('queryParam') || '';

        let targetUrl = '';
        if (customTarget && customTarget.includes('trycloudflare.com')) {
          const qParam = queryParam || (customTarget.includes('/email') ? 'value' : 'email');
          const cleanBase = customTarget.split('?')[0];
          targetUrl = `${cleanBase}?${qParam}=${encodeURIComponent(email)}&key=${encodeURIComponent(key || 'DADDY')}`;
        } else if (customTarget && customTarget.includes('alonepatel.shop')) {
          targetUrl = `https://api-src.alonepatel.shop/api?key=${encodeURIComponent(key || 'INDIAN_HACKER_BRO')}&action=${encodeURIComponent(action || 'email')}&email=${encodeURIComponent(email)}`;
        } else if (customTarget) {
          const u = new URL(customTarget);
          if (key) u.searchParams.set('key', key);
          if (action) u.searchParams.set('action', action);
          const qParam = queryParam || (u.pathname.includes('/email') ? 'value' : 'email');
          u.searchParams.set(qParam, email);
          targetUrl = u.toString();
        } else {
          targetUrl = `https://api-src.alonepatel.shop/api?key=${encodeURIComponent(key || 'INDIAN_HACKER_BRO')}&action=email&email=${encodeURIComponent(email)}`;
        }
        
        const apiRes = await fetch(targetUrl, {
          headers: { 'Accept': 'application/json, text/plain, */*' }
        });
        const text = await apiRes.text();
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.send(text);
        return;
      } catch (err: any) {
        try {
          const fallbackUrl = `https://api-src.alonepatel.shop/api?key=INDIAN_HACKER_BRO&action=email&email=${encodeURIComponent(email)}`;
          const fbRes = await fetch(fallbackUrl);
          const fbText = await fbRes.text();
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.send(fbText);
          return;
        } catch (fbErr: any) {
          res.status(502).json({
            status: "error",
            error: "Remote Email gateway connection failed",
            message: err?.message,
            email
          });
          return;
        }
      }
    }

    // 5. Vehicle Lookup Proxy
    if (req.url.startsWith('/api/vehicle-lookup') || req.url.startsWith('/api/rc-lookup') || req.url.startsWith('/api/vehicle')) {
      let rc = '';
      try {
        const urlObj = new URL(req.url, 'http://localhost');
        rc = urlObj.searchParams.get('rc') || urlObj.searchParams.get('vehicle') || urlObj.searchParams.get('reg') || urlObj.searchParams.get('value') || '';
        const key = urlObj.searchParams.get('key') || 'INDIAN_HACKER_BRO';
        const action = urlObj.searchParams.get('action') || 'vehicle-v1';
        const customTarget = urlObj.searchParams.get('targetUrl') || '';
        const queryParam = urlObj.searchParams.get('queryParam') || '';

        let targetUrl = '';
        if (customTarget && customTarget.includes('trycloudflare.com')) {
          const qParam = queryParam || 'rc';
          const cleanBase = customTarget.split('?')[0];
          targetUrl = `${cleanBase}?${qParam}=${encodeURIComponent(rc)}&key=${encodeURIComponent(key || 'DADDY')}`;
        } else if (customTarget && customTarget.includes('alonepatel.shop')) {
          targetUrl = `https://api-src.alonepatel.shop/api?key=${encodeURIComponent(key)}&action=${encodeURIComponent(action)}&rc=${encodeURIComponent(rc)}`;
        } else if (customTarget) {
          const u = new URL(customTarget);
          if (key) u.searchParams.set('key', key);
          if (action) u.searchParams.set('action', action);
          u.searchParams.set(queryParam || 'rc', rc);
          targetUrl = u.toString();
        } else {
          targetUrl = `https://api-src.alonepatel.shop/api?key=${encodeURIComponent(key)}&action=vehicle-v1&rc=${encodeURIComponent(rc)}`;
        }
        
        const apiRes = await fetch(targetUrl, {
          headers: { 'Accept': 'application/json, text/plain, */*' }
        });
        const text = await apiRes.text();
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.send(text);
        return;
      } catch (err: any) {
        res.status(502).json({
          status: "error",
          error: "Remote Vehicle gateway connection failed",
          message: err?.message,
          rc
        });
        return;
      }
    }

    // 6. IMEI Lookup Proxy
    if (req.url.startsWith('/api/imei-lookup') || req.url.startsWith('/api/imei')) {
      let imei = '';
      try {
        const urlObj = new URL(req.url, 'http://localhost');
        imei = urlObj.searchParams.get('imei') || urlObj.searchParams.get('imei_num') || urlObj.searchParams.get('num') || urlObj.searchParams.get('value') || '';
        const key = urlObj.searchParams.get('key') || 'INDIAN_HACKER_BRO';
        const action = urlObj.searchParams.get('action') || 'imei-info';
        const customTarget = urlObj.searchParams.get('targetUrl') || '';
        const queryParam = urlObj.searchParams.get('queryParam') || '';

        let targetUrl = '';
        if (customTarget && customTarget.includes('trycloudflare.com')) {
          const qParam = queryParam || 'imei_num';
          const cleanBase = customTarget.split('?')[0];
          targetUrl = `${cleanBase}?${qParam}=${encodeURIComponent(imei)}&key=${encodeURIComponent(key || 'DADDY')}`;
        } else if (customTarget && customTarget.includes('alonepatel.shop')) {
          targetUrl = `https://api-src.alonepatel.shop/api?key=${encodeURIComponent(key)}&action=${encodeURIComponent(action)}&imei_num=${encodeURIComponent(imei)}`;
        } else if (customTarget) {
          const u = new URL(customTarget);
          if (key) u.searchParams.set('key', key);
          if (action) u.searchParams.set('action', action);
          u.searchParams.set(queryParam || 'imei_num', imei);
          targetUrl = u.toString();
        } else {
          targetUrl = `https://api-src.alonepatel.shop/api?key=${encodeURIComponent(key)}&action=imei-info&imei_num=${encodeURIComponent(imei)}`;
        }
        
        const apiRes = await fetch(targetUrl, {
          headers: { 'Accept': 'application/json, text/plain, */*' }
        });
        const text = await apiRes.text();
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.send(text);
        return;
      } catch (err: any) {
        res.status(502).json({
          status: "error",
          error: "Remote IMEI gateway connection failed",
          message: err?.message,
          imei
        });
        return;
      }
    }

    // 7. TGID Lookup Proxy
    if (req.url.startsWith('/api/tgid-lookup') || req.url.startsWith('/api/tgid')) {
      let tgid = '';
      try {
        const urlObj = new URL(req.url, 'http://localhost');
        tgid = urlObj.searchParams.get('id') || urlObj.searchParams.get('tgid') || urlObj.searchParams.get('value') || '';
        const key = urlObj.searchParams.get('key') || 'Tgid_num';
        const action = urlObj.searchParams.get('action') || 'tgid';
        const customTarget = urlObj.searchParams.get('targetUrl') || '';
        const queryParam = urlObj.searchParams.get('queryParam') || '';

        let targetUrl = '';
        if (customTarget && customTarget.includes('trycloudflare.com')) {
          const qParam = queryParam || 'id';
          const cleanBase = customTarget.split('?')[0];
          targetUrl = `${cleanBase}?${qParam}=${encodeURIComponent(tgid)}&key=${encodeURIComponent(key || 'Tgid_num')}`;
        } else if (customTarget && customTarget.includes('alonepatel.shop')) {
          targetUrl = `https://api-src.alonepatel.shop/api?key=${encodeURIComponent(key)}&action=${encodeURIComponent(action)}&id=${encodeURIComponent(tgid)}`;
        } else if (customTarget) {
          const u = new URL(customTarget);
          if (key) u.searchParams.set('key', key);
          if (action) u.searchParams.set('action', action);
          u.searchParams.set(queryParam || 'id', tgid);
          targetUrl = u.toString();
        } else {
          targetUrl = `https://api-src.alonepatel.shop/api?key=${encodeURIComponent(key)}&action=tgid&id=${encodeURIComponent(tgid)}`;
        }
        
        const apiRes = await fetch(targetUrl, {
          headers: { 'Accept': 'application/json, text/plain, */*' }
        });
        const text = await apiRes.text();
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.send(text);
        return;
      } catch (err: any) {
        res.status(502).json({
          status: "error",
          error: "Remote TGID gateway connection failed",
          message: err?.message,
          tgid
        });
        return;
      }
    }

  } catch (err) {
    console.error('Proxy Middleware Error:', err);
  }

  next();
};
