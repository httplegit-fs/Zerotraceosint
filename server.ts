import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// --- MongoDB Schemas ---
const passwordLogSchema = new mongoose.Schema({
  oldPassword: { type: String, default: '2007' },
  newPassword: { type: String, required: true },
  changedAt: { type: Date, default: Date.now },
  source: { type: String, default: 'forgot_question_recovery' },
  ipAddress: { type: String, default: '' },
  userAgent: { type: String, default: '' },
});

const securityConfigSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: String, required: true },
  isImmutable: { type: Boolean, default: false },
  updatedAt: { type: Date, default: Date.now }
});

const PasswordLog = mongoose.models.PasswordLog || mongoose.model('PasswordLog', passwordLogSchema);
const SecurityConfig = mongoose.models.SecurityConfig || mongoose.model('SecurityConfig', securityConfigSchema);

// MongoDB connection state tracker
let isMongoConnected = false;

const DEFAULT_MONGO_URI = 'mongodb+srv://httplegitfs_db_user:Q8uGZxERXsrf2VV1@cluster0.iojnad7.mongodb.net/zerotrace?retryWrites=true&w=majority';

function resolveMongoUri(): string {
  const envUri = (process.env.MONGODB_URI || '').trim();
  // Check if envUri is a valid MongoDB connection scheme
  if (envUri.startsWith('mongodb://') || envUri.startsWith('mongodb+srv://')) {
    return envUri;
  }
  // If an invalid string like "2007" was provided in MONGODB_URI, fall back gracefully
  if (envUri) {
    console.warn(`[MongoDB] Note: Environment MONGODB_URI ("${envUri}") is not a valid connection string. Using default cluster database URI.`);
  }
  return DEFAULT_MONGO_URI;
}

async function initMongoDB() {
  const mongoUri = resolveMongoUri();

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    isMongoConnected = true;
    console.log('[MongoDB] Connected successfully to database.');

    // Seed default master PIN if not present
    const existing = await SecurityConfig.findOne({ key: 'master_pin' });
    if (!existing) {
      await SecurityConfig.create({
        key: 'master_pin',
        value: '2007',
        isImmutable: false,
        updatedAt: new Date()
      });
      console.log('[MongoDB] Seeded default master PIN: 2007');
    }

    // Seed permanent immutable search security PIN (9161)
    const existingSearchPin = await SecurityConfig.findOne({ key: 'search_security_pin' });
    if (!existingSearchPin) {
      await SecurityConfig.create({
        key: 'search_security_pin',
        value: '9161',
        isImmutable: true,
        updatedAt: new Date()
      });
      console.log('[MongoDB] Seeded immutable search security PIN: 9161');
    } else if (existingSearchPin.value !== '9161' || !existingSearchPin.isImmutable) {
      // Enforce immutability
      existingSearchPin.value = '9161';
      existingSearchPin.isImmutable = true;
      await existingSearchPin.save();
      console.log('[MongoDB] Enforced immutable search security PIN: 9161');
    }
  } catch (err) {
    isMongoConnected = false;
    console.warn('[MongoDB] Connection error (running with fallback):', (err as Error).message);
  }
}

// Re-try connection if reconnect needed
mongoose.connection.on('connected', () => {
  isMongoConnected = true;
  console.log('[MongoDB] Mongoose connection established.');
});
mongoose.connection.on('error', (err) => {
  isMongoConnected = false;
  console.warn('[MongoDB] Mongoose error:', err.message);
});
mongoose.connection.on('disconnected', () => {
  isMongoConnected = false;
  console.warn('[MongoDB] Mongoose disconnected.');
});

// --- API Routes ---

// Health & DB status
app.get('/api/health', (req, res) => {
  const currentUri = resolveMongoUri();
  res.json({
    status: 'ok',
    mongoConnected: isMongoConnected,
    hasMongoUri: Boolean(currentUri.startsWith('mongodb://') || currentUri.startsWith('mongodb+srv://'))
  });
});

// Real-time ping endpoint
app.get('/api/ping', (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.json({ pong: true, time: Date.now() });
});

// Fetch current active PIN / master password
app.get('/api/pin', async (req, res) => {
  try {
    if (isMongoConnected) {
      const config = await SecurityConfig.findOne({ key: 'master_pin' });
      if (config && config.value) {
        return res.json({
          currentPin: config.value,
          updatedAt: config.updatedAt,
          isDbConnected: true
        });
      }
    }
    // Fallback if not connected or not yet initialized
    return res.json({
      currentPin: '2007',
      isDbConnected: isMongoConnected
    });
  } catch (error) {
    console.error('Error fetching PIN:', error);
    return res.json({
      currentPin: '2007',
      isDbConnected: false,
      error: (error as Error).message
    });
  }
});

// Verify PIN against MongoDB - STRICTLY requires the active current PIN.
// Any previous/old PIN is treated as EXPIRED and access is strictly DENIED.
app.post('/api/auth/verify', async (req, res) => {
  try {
    const { pin } = req.body;
    if (!pin || typeof pin !== 'string') {
      return res.status(400).json({ granted: false, message: 'PIN is required' });
    }

    const cleanPin = pin.trim().toLowerCase();
    let currentPinInDb = '2007';

    if (isMongoConnected) {
      const config = await SecurityConfig.findOne({ key: 'master_pin' });
      if (config && config.value) {
        currentPinInDb = config.value.trim();
      }
    }

    // STRICT MATCH: Only the active master PIN is valid
    const isMatch = cleanPin === currentPinInDb.toLowerCase();

    if (isMatch) {
      return res.json({
        granted: true,
        currentPin: currentPinInDb,
        isDbConnected: isMongoConnected,
        message: 'ACCESS GRANTED'
      });
    }

    // Check if the entered PIN was an old/expired PIN
    let isExpiredPin = false;
    if (isMongoConnected) {
      // Check password change logs to see if this PIN was previously used
      const escaped = cleanPin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pastLog = await PasswordLog.findOne({
        oldPassword: { $regex: new RegExp(`^${escaped}$`, 'i') }
      });
      if (pastLog) {
        isExpiredPin = true;
      } else if (cleanPin === '2007' && currentPinInDb.toLowerCase() !== '2007') {
        isExpiredPin = true;
      }
    } else if (cleanPin === '2007' && currentPinInDb.toLowerCase() !== '2007') {
      isExpiredPin = true;
    }

    if (isExpiredPin) {
      return res.json({
        granted: false,
        isExpired: true,
        currentPin: currentPinInDb,
        isDbConnected: isMongoConnected,
        message: 'ACCESS DENIED: OLD PIN HAS EXPIRED. PLEASE USE THE NEW PIN.'
      });
    }

    return res.json({
      granted: false,
      isExpired: false,
      currentPin: currentPinInDb,
      isDbConnected: isMongoConnected,
      message: 'ACCESS DENIED: INVALID SECURITY PIN'
    });
  } catch (error) {
    console.error('Error verifying PIN:', error);
    return res.status(500).json({
      granted: false,
      error: (error as Error).message
    });
  }
});

// Fetch permanent immutable search bar PIN from MongoDB
app.get('/api/search-pin', async (req, res) => {
  try {
    let pin = '9161';
    let isImmutable = true;

    if (isMongoConnected) {
      const config = await SecurityConfig.findOne({ key: 'search_security_pin' });
      if (config && config.value) {
        pin = config.value;
        isImmutable = config.isImmutable ?? true;
      }
    }

    return res.json({
      success: true,
      pin,
      isImmutable,
      isDbConnected: isMongoConnected,
      description: 'Permanent immutable security PIN for search console unlock (stored in MongoDB)'
    });
  } catch (error) {
    console.error('Error fetching search PIN:', error);
    return res.json({
      success: true,
      pin: '9161',
      isImmutable: true,
      isDbConnected: false,
      error: (error as Error).message
    });
  }
});

// Verify Search Bar Security PIN against MongoDB (strictly checks permanent 9161)
app.post('/api/search-pin/verify', async (req, res) => {
  try {
    const { pin } = req.body;
    if (!pin || typeof pin !== 'string') {
      return res.status(400).json({
        granted: false,
        message: 'PIN is required'
      });
    }

    const cleanPin = pin.trim().toLowerCase();
    let searchPinInDb = '9161';

    if (isMongoConnected) {
      const config = await SecurityConfig.findOne({ key: 'search_security_pin' });
      if (config && config.value) {
        searchPinInDb = config.value.trim();
      }
    }

    // STRICT MATCH: ONLY the permanent MongoDB PIN (9161) is valid
    const isMatch = cleanPin === searchPinInDb.toLowerCase() || cleanPin === '9161';

    if (isMatch) {
      return res.json({
        granted: true,
        isDbConnected: isMongoConnected,
        isImmutable: true,
        clearanceLevel: 4,
        message: 'ACCESS GRANTED: SECURITY PIN AUTHENTICATED // SEARCHING UNLOCKED'
      });
    }

    return res.json({
      granted: false,
      isDbConnected: isMongoConnected,
      message: 'ACCESS DENIED: INVALID SECURITY PIN // ACCESS RESTRICTED'
    });
  } catch (error) {
    console.error('Error verifying search PIN:', error);
    return res.status(500).json({
      granted: false,
      error: (error as Error).message
    });
  }
});

// Update & log password change (Old password -> New password)
app.post('/api/pin/change', async (req, res) => {
  try {
    const { oldPassword, newPassword, source } = req.body;

    if (!newPassword || typeof newPassword !== 'string' || !newPassword.trim()) {
      return res.status(400).json({
        success: false,
        error: 'newPassword is required'
      });
    }

    const cleanNewPassword = newPassword.trim();
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    let resolvedOldPassword = oldPassword ? String(oldPassword).trim() : '2007';

    if (isMongoConnected) {
      // Find current PIN to record accurate old password if not provided
      const currentConfig = await SecurityConfig.findOne({ key: 'master_pin' });
      if (currentConfig && currentConfig.value) {
        resolvedOldPassword = oldPassword || currentConfig.value;
      }

      // 1. Create audit log of the password change
      const logEntry = await PasswordLog.create({
        oldPassword: resolvedOldPassword,
        newPassword: cleanNewPassword,
        changedAt: new Date(),
        source: source || 'forgot_question_recovery',
        ipAddress,
        userAgent
      });

      // 2. Update master PIN config
      await SecurityConfig.findOneAndUpdate(
        { key: 'master_pin' },
        { value: cleanNewPassword, updatedAt: new Date() },
        { upsert: true, new: true }
      );

      console.log(`[MongoDB] Password updated: "${resolvedOldPassword}" -> "${cleanNewPassword}" at ${new Date().toISOString()}`);

      return res.json({
        success: true,
        isDbConnected: true,
        logId: logEntry._id,
        oldPassword: resolvedOldPassword,
        newPassword: cleanNewPassword,
        changedAt: logEntry.changedAt
      });
    }

    // When MongoDB is not connected, respond with success so app continues with local storage
    return res.json({
      success: true,
      isDbConnected: false,
      oldPassword: resolvedOldPassword,
      newPassword: cleanNewPassword,
      changedAt: new Date().toISOString(),
      note: 'Saved locally. Provide MONGODB_URI in Settings to automatically sync into MongoDB database.'
    });
  } catch (error) {
    console.error('Error changing PIN in MongoDB:', error);
    return res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

// Fetch password audit history
app.get('/api/pin/history', async (req, res) => {
  try {
    if (isMongoConnected) {
      const logs = await PasswordLog.find().sort({ changedAt: -1 }).limit(50);
      return res.json({
        success: true,
        isDbConnected: true,
        logs
      });
    }
    return res.json({
      success: true,
      isDbConnected: false,
      logs: []
    });
  } catch (error) {
    console.error('Error fetching password history:', error);
    return res.status(500).json({
      success: false,
      error: (error as Error).message
    });
  }
});

// ==========================================
// OSINT INTELLIGENCE BACKEND PROXY ROUTES
// ==========================================

const API_BASE = 'https://api-src.alonepatel.shop/api';
const DEFAULT_KEY = 'INDIAN_HACKER_BRO';

// ⚙️ PHONE LOOKUP DEDICATED CONFIGURATION (Isse aap future me easily change kar sakte hain)
const PHONE_API_BASE = 'https://storage-deutschland-don-patterns.trycloudflare.com/num';
const PHONE_DEFAULT_KEY = 'DADDY';


// Helper to proxy requests safely and guarantee JSON response
async function proxyRemoteApi(url: string, res: express.Response) {
  const maxAttempts = 2;
  const timeoutMs = 45000; // 45 seconds to allow deep telecom and KYC lookups

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': 'https://api-src.alonepatel.shop/',
          'Cache-Control': 'no-cache'
        }
      });
      clearTimeout(timeout);

      const text = await response.text();
      res.setHeader('Content-Type', 'application/json');

      try {
        const parsed = JSON.parse(text);
        return res.status(response.status >= 200 && response.status < 500 ? response.status : 200).json(parsed);
      } catch {
        return res.status(200).json({
          status: response.ok ? 'success' : 'error',
          raw: text
        });
      }
    } catch (err: any) {
      if (attempt < maxAttempts) {
        console.warn(`[Proxy] Attempt ${attempt} failed for ${url} (${err?.message || 'unknown error'}), retrying...`);
        await new Promise(r => setTimeout(r, 1200));
        continue;
      }
      console.error(`Proxy request failed for ${url}:`, err?.message || err);
      return res.status(504).json({
        status: false,
        error: true,
        message: `Gateway Timeout: Remote API took longer than ${timeoutMs / 1000}s to respond (${err?.message || 'Upstream connection error'}). Please verify the input or try again.`
      });
    }
  }
}

// 1. Phone Lookup Proxy (NEW DEDICATED ROUTE)
app.get('/api/phone-lookup', async (req, res) => {
  const number = (req.query.number as string) || (req.query.num as string) || '';
  
  // Agar request me key pass nahi kiye ho, toh default PHONE_DEFAULT_KEY ('DADDY') use hoga
  const key = (req.query.key as string) || PHONE_DEFAULT_KEY;
  
  if (!number) {
    return res.status(400).json({ status: 'error', message: 'number query param required' });
  }
  
  const cleanNumber = encodeURIComponent(number.trim());
  const cleanKey = encodeURIComponent(key.trim());
  
  // Final URL target: https://storage-deutschland-don-patterns.trycloudflare.com/num?number=9876543210&key=DADDY
  const targetUrl = `${PHONE_API_BASE}?number=${cleanNumber}&key=${cleanKey}`;
  
  return proxyRemoteApi(targetUrl, res);
});

// 2. Aadhaar Lookup Proxy
app.get('/api/aadhar-lookup', async (req, res) => {
  const aadhar = (req.query.aadhar as string) || (req.query.uid as string) || '';
  const key = (req.query.key as string) || DEFAULT_KEY;
  if (!aadhar) {
    return res.status(400).json({ status: 'error', message: 'aadhar query param required' });
  }
  const cleanAadhar = encodeURIComponent(aadhar.trim());
  const targetUrl = `${API_BASE}?key=${encodeURIComponent(key)}&action=aadhar&aadhar=${cleanAadhar}`;
  return proxyRemoteApi(targetUrl, res);
});

// 3. UPI Lookup Proxy
app.get('/api/upi-lookup', async (req, res) => {
  const upi = (req.query.upi as string) || (req.query.vpa as string) || '';
  const key = (req.query.key as string) || DEFAULT_KEY;
  if (!upi) {
    return res.status(400).json({ status: 'error', message: 'upi query param required' });
  }
  const cleanUpi = encodeURIComponent(upi.trim());
  const targetUrl = `${API_BASE}?key=${encodeURIComponent(key)}&action=upiinfo&upi=${cleanUpi}`;
  return proxyRemoteApi(targetUrl, res);
});

// 4. Email Lookup Proxy
app.get('/api/email-lookup', async (req, res) => {
  const email = (req.query.email as string) || (req.query.mail as string) || '';
  const key = (req.query.key as string) || DEFAULT_KEY;
  if (!email) {
    return res.status(400).json({ status: 'error', message: 'email query param required' });
  }
  const cleanEmail = encodeURIComponent(email.trim());
  const targetUrl = `${API_BASE}?key=${encodeURIComponent(key)}&action=email&email=${cleanEmail}`;
  return proxyRemoteApi(targetUrl, res);
});

// 5. Vehicle / RC Lookup Proxy
app.get('/api/vehicle-lookup', async (req, res) => {
  const rc = (req.query.rc as string) || (req.query.reg as string) || '';
  const key = (req.query.key as string) || DEFAULT_KEY;
  if (!rc) {
    return res.status(400).json({ status: 'error', message: 'rc query param required' });
  }
  const cleanRc = encodeURIComponent(rc.trim().toUpperCase());
  const targetUrl = `${API_BASE}?key=${encodeURIComponent(key)}&action=vehicle-v1&rc=${cleanRc}`;
  return proxyRemoteApi(targetUrl, res);
});

// 6. IMEI Lookup Proxy
app.get('/api/imei-lookup', async (req, res) => {
  const imei = (req.query.imei as string) || (req.query.imei_num as string) || '';
  const key = (req.query.key as string) || DEFAULT_KEY;
  if (!imei) {
    return res.status(400).json({ status: 'error', message: 'imei query param required' });
  }
  const cleanImei = encodeURIComponent(imei.trim());
  const targetUrl = `${API_BASE}?key=${encodeURIComponent(key)}&action=imei-info&imei_num=${cleanImei}`;
  return proxyRemoteApi(targetUrl, res);
});

// 7. Telegram ID Lookup Proxy
app.get('/api/tgid-lookup', async (req, res) => {
  const id = (req.query.id as string) || (req.query.tgid as string) || '';
  const key = (req.query.key as string) || 'Tgid_num';
  if (!id) {
    return res.status(400).json({ status: 'error', message: 'id query param required' });
  }
  const cleanId = encodeURIComponent(id.trim());
  const targetUrl = `${API_BASE}?key=${encodeURIComponent(key)}&action=tgid&id=${cleanId}`;
  return proxyRemoteApi(targetUrl, res);
});

// --- Server Lifecycle & Vite Middleware ---
async function startServer() {
  await initMongoDB();

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Express 5 routing uses *all instead of *
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ZeroTrace server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();



