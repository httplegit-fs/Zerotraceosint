import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { proxyMiddleware } from "./proxyMiddleware.ts";
import { MongoClient, Db } from "mongodb";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import bcrypt from "bcryptjs";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Trust reverse proxy (e.g. Google Cloud Run / AI Studio preview iframe)
app.set('trust proxy', 1);

// ==========================================
// SECURITY HEADERS (HELMET)
// ==========================================
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      mediaSrc: ["'self'", "https://res.cloudinary.com", "https:", "blob:"],
      connectSrc: ["'self'", "https:", "http:", "ws:", "wss:"],
      objectSrc: ["'none'"],
      frameAncestors: ["'self'"],
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  hidePoweredBy: true,
  xssFilter: true,
  noSniff: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" }
}));

// ==========================================
// DYNAMIC CORS MIDDLEWARE
// ==========================================
app.use((req, res, next) => {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Admin-PIN, X-Admin-Token');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// Parse JSON Body
app.use(express.json({ limit: '2mb' }));

// ==========================================
// INPUT SANITIZATION MIDDLEWARE (XSS PREVENT)
// ==========================================
function sanitizeString(str: string): string {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
}

function sanitizeObject(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') return sanitizeString(obj);
  if (typeof obj === 'number' || typeof obj === 'boolean') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeObject);
  if (typeof obj === 'object') {
    const clean: Record<string, any> = {};
    for (const [k, v] of Object.entries(obj)) {
      clean[sanitizeString(k)] = sanitizeObject(v);
    }
    return clean;
  }
  return obj;
}

app.use((req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }
  next();
});

// ==========================================
// RATE LIMITERS
// ==========================================
const getClientIp = (req: express.Request) => {
  const rawIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
  return rawIp.split(',')[0].trim().replace('::ffff:', '');
};

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIp,
  validate: { trustProxy: false, xForwardedForHeader: false },
  message: {
    granted: false,
    error: "TOO_MANY_ATTEMPTS",
    message: "Security Lockout: Too many PIN verification attempts from this IP. Please wait 15 minutes."
  }
});

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIp,
  validate: { trustProxy: false, xForwardedForHeader: false },
  message: {
    success: false,
    error: "RATE_LIMIT_EXCEEDED",
    message: "Rate limit exceeded. Please slow down your requests."
  }
});

app.use('/api/', apiLimiter);

// OSINT Intelligence Gateway Proxies
app.use(proxyMiddleware);

// In-memory fallback defaults
const DEFAULT_PINS = {
  _id: "auth_pins",
  loginPin: "2007",
  searchPin: "9242", // Permanent PIN for Search Gate (updated from 9161)
  apiAutomationPin: "9264", // Permanent PIN for API automation login
  updatedAt: new Date()
};

let mongoClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export interface TemporaryPin {
  id: string;
  pin: string;
  label?: string;
  scope: 'search' | 'api_automation' | 'all';
  durationMinutes: number;
  createdAt: string;
  expiresAt: string;
  revoked?: boolean;
}

// In-memory fallback for temporary PINs
let localTemporaryPins: TemporaryPin[] = [];

async function getMongoDb(): Promise<Db | null> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    return null;
  }

  if (cachedDb) {
    return cachedDb;
  }

  try {
    mongoClient = new MongoClient(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    await mongoClient.connect();
    const dbName = process.env.MONGODB_DB_NAME || "zerotrace_auth";
    cachedDb = mongoClient.db(dbName);
    console.log(`[MongoDB] Connected successfully to database: ${dbName}`);

    // Ensure initial document exists with permanent pins: searchPin = "9242" & apiAutomationPin = "9264"
    const collection = cachedDb.collection("system_security_pins");
    const existing = await collection.findOne({ _id: "auth_pins" as any });

    if (!existing) {
      await collection.insertOne({
        _id: "auth_pins" as any,
        loginPin: DEFAULT_PINS.loginPin,
        searchPin: "9242",
        apiAutomationPin: "9264",
        temporaryPins: [],
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log("[MongoDB] Initialized system_security_pins collection with permanent Search PIN 9242 & API PIN 9264");
    } else {
      const updates: any = {};
      if (existing.apiAutomationPin !== "9264") updates.apiAutomationPin = "9264";
      if (existing.searchPin !== "9242") updates.searchPin = "9242";
      if (!Array.isArray(existing.temporaryPins)) updates.temporaryPins = [];
      
      if (Object.keys(updates).length > 0) {
        updates.updatedAt = new Date();
        await collection.updateOne(
          { _id: "auth_pins" as any },
          { $set: updates }
        );
        console.log("[MongoDB] Synchronized permanent PINs (Search: 9242, API: 9264) in database");
      }
    }

    return cachedDb;
  } catch (err: any) {
    console.warn("[MongoDB] Connection warning (using graceful in-memory storage):", err.message);
    cachedDb = null;
    return null;
  }
}

// Helper to retrieve temporary pins directly from MongoDB
async function getStoredTemporaryPins(): Promise<TemporaryPin[]> {
  try {
    const db = await getMongoDb();
    if (db) {
      const collection = db.collection("system_security_pins");
      const record = await collection.findOne({ _id: "auth_pins" as any });
      if (record && Array.isArray(record.temporaryPins)) {
        return record.temporaryPins;
      }
    }
  } catch (e: any) {
    console.error("[getStoredTemporaryPins error]", e.message);
  }
  return localTemporaryPins;
}

// Helper to save temporary pins to MongoDB
async function saveStoredTemporaryPins(pins: TemporaryPin[]): Promise<boolean> {
  localTemporaryPins = pins;
  try {
    const db = await getMongoDb();
    if (db) {
      const collection = db.collection("system_security_pins");
      await collection.updateOne(
        { _id: "auth_pins" as any },
        { $set: { temporaryPins: pins, updatedAt: new Date() } },
        { upsert: true }
      );
      return true;
    }
  } catch (e: any) {
    console.error("[saveStoredTemporaryPins error]", e.message);
  }
  return false;
}

// In-memory storage when MongoDB is not connected
let localPins = { ...DEFAULT_PINS };

// In-memory audit log buffers (synced to MongoDB when available)
interface PasswordAuditLog {
  pinType: string;
  oldPassword: string;
  newPassword: string;
  timestamp: Date;
}

const localPasswordLogs: PasswordAuditLog[] = [];

// Helper to record password change logs in MongoDB (securely hashed)
async function logPasswordChangeToMongo(entry: {
  oldPassword?: string;
  newPassword: string;
  pinType?: string;
}) {
  const auditEntry = {
    pinType: entry.pinType || "loginPin",
    oldPasswordHash: entry.oldPassword ? hashPin(entry.oldPassword) : "NOT_PROVIDED",
    newPasswordHash: hashPin(entry.newPassword),
    oldPasswordMasked: entry.oldPassword ? `${entry.oldPassword[0]}••••${entry.oldPassword.slice(-1)}` : "••••",
    newPasswordMasked: `${entry.newPassword[0]}••••${entry.newPassword.slice(-1)}`,
    oldPassword: entry.oldPassword ? `${entry.oldPassword[0]}••••${entry.oldPassword.slice(-1)}` : "NOT_PROVIDED",
    newPassword: `${entry.newPassword[0]}••••${entry.newPassword.slice(-1)}`,
    timestamp: new Date()
  };

  localPasswordLogs.unshift(auditEntry as any);
  if (localPasswordLogs.length > 50) localPasswordLogs.pop();

  try {
    const db = await getMongoDb();
    if (db) {
      const collection = db.collection("password_audit_logs");
      await collection.insertOne({
        ...auditEntry
      });
      console.log(`[MongoDB] Logged secure password change event in password_audit_logs (${auditEntry.pinType})`);
    }
  } catch (err: any) {
    console.error("[MongoDB] Failed to write password audit log:", err.message);
  }
}

// User Activity History Log Data Model
export interface UserActivityLog {
  id: string;
  ip: string;
  userAgent: string;
  device: string;
  featureId: string;
  featureName: string;
  searchQuery: string;
  timestamp: string;
  status?: string;
}

let localActivityLogs: UserActivityLog[] = [];

async function getActivityLogsFromMongo(): Promise<UserActivityLog[]> {
  try {
    const db = await getMongoDb();
    if (db) {
      const collection = db.collection("user_activity_history");
      const records = await collection.find({}).sort({ timestamp: -1 }).limit(300).toArray();
      if (records && records.length > 0) {
        return records.map((r: any) => ({
          id: r._id ? String(r._id) : r.id || String(Math.random()),
          ip: r.ip || "127.0.0.1",
          userAgent: r.userAgent || "Unknown Device",
          device: r.device || "Unknown Device",
          featureId: r.featureId || "general",
          featureName: r.featureName || "Search Console",
          searchQuery: r.searchQuery || "",
          timestamp: r.timestamp ? new Date(r.timestamp).toISOString() : new Date().toISOString(),
          status: r.status || "allowed"
        }));
      }
    }
  } catch (e: any) {
    console.warn("[MongoDB Activity Logs Fetch Warning]", e.message);
  }
  return localActivityLogs;
}

async function recordActivityLogToMongo(logEntry: Omit<UserActivityLog, "id">): Promise<UserActivityLog> {
  const fullLog: UserActivityLog = {
    id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    ...logEntry
  };

  localActivityLogs.unshift(fullLog);
  if (localActivityLogs.length > 300) localActivityLogs.pop();

  try {
    const db = await getMongoDb();
    if (db) {
      const collection = db.collection("user_activity_history");
      await collection.insertOne({ ...fullLog, createdAt: new Date() });
      console.log(`[Activity Log] IP ${fullLog.ip} (${fullLog.device}) searched "${fullLog.searchQuery}" on feature "${fullLog.featureName}"`);
    }
  } catch (e: any) {
    console.warn("[MongoDB Activity Log Insert Warning]", e.message);
  }

  return fullLog;
}

// Helper to get active pins directly from MongoDB
async function fetchCurrentPins() {
  try {
    const db = await getMongoDb();
    if (db) {
      const collection = db.collection("system_security_pins");
      const record = await collection.findOne({ _id: "auth_pins" as any });
      if (record) {
        return {
          loginPin: record.loginPin || DEFAULT_PINS.loginPin,
          searchPin: record.searchPin || DEFAULT_PINS.searchPin,
          apiAutomationPin: record.apiAutomationPin || "9264",
          source: "mongodb"
        };
      }
    }
  } catch (e: any) {
    console.error("[fetchCurrentPins error]", e.message);
  }

  return {
    loginPin: localPins.loginPin,
    searchPin: localPins.searchPin,
    apiAutomationPin: localPins.apiAutomationPin || "9264",
    source: "local_memory"
  };
}

// ==========================================
// PASSWORD / PIN HASHING & ADMIN AUTHORIZATION
// ==========================================
function hashPin(pin: string): string {
  if (!pin) return '';
  if (pin.startsWith('$2a$') || pin.startsWith('$2b$')) return pin;
  return bcrypt.hashSync(pin, 10);
}

function comparePin(providedPin: string, storedHashOrPlain: string): boolean {
  if (!providedPin || !storedHashOrPlain) return false;
  const cleanProvided = String(providedPin).trim();
  const cleanStored = String(storedHashOrPlain).trim();

  if (cleanProvided === cleanStored) return true;

  if (cleanStored.startsWith('$2a$') || cleanStored.startsWith('$2b$')) {
    try {
      return bcrypt.compareSync(cleanProvided, cleanStored);
    } catch {
      return false;
    }
  }

  return false;
}

async function verifyAdminAuthorization(req: express.Request): Promise<boolean> {
  const authHeader = req.headers['x-admin-pin'] || req.headers['x-admin-token'] || req.headers['authorization'];
  if (!authHeader) return false;

  let providedPin = String(authHeader).trim();
  if (providedPin.startsWith('Bearer ')) {
    providedPin = providedPin.slice(7).trim();
  }

  if (!providedPin) return false;

  const current = await fetchCurrentPins();

  // Permanent System Keys
  if (
    providedPin === "2007" ||
    providedPin === "9242" ||
    providedPin === "9264" ||
    comparePin(providedPin, current.loginPin) ||
    comparePin(providedPin, current.searchPin) ||
    comparePin(providedPin, current.apiAutomationPin)
  ) {
    return true;
  }

  // Active Temporary PINs
  const temporaryPins = await getStoredTemporaryPins();
  const matchingTemp = temporaryPins.find(t => t.pin === providedPin && !t.revoked);
  if (matchingTemp) {
    const expiresAtMs = new Date(matchingTemp.expiresAt).getTime();
    if (expiresAtMs > Date.now()) {
      return true;
    }
  }

  return false;
}

const requireAdminAuth = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const isAuthorized = await verifyAdminAuthorization(req);
  if (!isAuthorized) {
    return res.status(401).json({
      success: false,
      error: "UNAUTHORIZED_ADMIN_ACCESS",
      message: "Access Denied: Valid Admin Security PIN required (X-Admin-PIN header)."
    });
  }
  next();
};

// ==========================================
// SYSTEM HARDCODED SETTINGS (Admin Result Concealment)
// ==========================================
let localHideResultsForUsers = false;
let localFeatureVisibility: Record<string, boolean> = {
  'phone-osint': false,
  'aadhar-search': false,
  'upi-search': false,
  'email-search': false,
  'vehicle-search': false,
  'imei-search': false,
  'telegram-search': false,
  'raw-json': false
};

let localCustomTextFilters: Array<{ 
  id: string; 
  phrase: string; 
  enabled: boolean; 
  action: 'hide' | 'replace'; 
  replaceWith?: string;
  targetFeature?: string;
  addedAt?: string;
}> = [
  { id: 'filter-1', phrase: 't.me/', enabled: true, action: 'hide', targetFeature: 'telegram-search' },
  { id: 'filter-2', phrase: 'telegram', enabled: true, action: 'hide', targetFeature: 'all' },
  { id: 'filter-3', phrase: 'join channel', enabled: true, action: 'hide', targetFeature: 'telegram-search' },
  { id: 'filter-4', phrase: 'buy api', enabled: true, action: 'hide', targetFeature: 'all' },
  { id: 'filter-5', phrase: 'developer', enabled: true, action: 'hide', targetFeature: 'all' },
  { id: 'filter-6', phrase: 'credit', enabled: true, action: 'hide', targetFeature: 'all' }
];

async function getResultVisibilitySetting(): Promise<{ hideResultsForUsers: boolean; featureVisibility: Record<string, boolean> }> {
  try {
    const db = await getMongoDb();
    if (db) {
      const collection = db.collection("system_security_pins");
      const record = await collection.findOne({ _id: "admin_visibility_settings" as any });
      if (record) {
        const hide = typeof record.hideResultsForUsers === "boolean" ? record.hideResultsForUsers : localHideResultsForUsers;
        const featureVis = record.featureVisibility && typeof record.featureVisibility === "object"
          ? { ...localFeatureVisibility, ...record.featureVisibility }
          : localFeatureVisibility;
        return { hideResultsForUsers: hide, featureVisibility: featureVis };
      }
    }
  } catch (e: any) {
    console.error("[getResultVisibilitySetting error]", e.message);
  }
  return { hideResultsForUsers: localHideResultsForUsers, featureVisibility: localFeatureVisibility };
}

async function setResultVisibilitySetting(hide: boolean, featureVisibility?: Record<string, boolean>): Promise<boolean> {
  localHideResultsForUsers = hide;
  if (featureVisibility && typeof featureVisibility === "object") {
    localFeatureVisibility = { ...localFeatureVisibility, ...featureVisibility };
  }
  try {
    const db = await getMongoDb();
    if (db) {
      const collection = db.collection("system_security_pins");
      await collection.updateOne(
        { _id: "admin_visibility_settings" as any },
        { 
          $set: { 
            hideResultsForUsers: hide, 
            featureVisibility: localFeatureVisibility,
            updatedAt: new Date() 
          } 
        },
        { upsert: true }
      );
      return true;
    }
  } catch (e: any) {
    console.error("[setResultVisibilitySetting error]", e.message);
  }
  return false;
}

export interface CustomTextFilterItem {
  id: string;
  phrase: string;
  enabled: boolean;
  action: 'hide' | 'replace';
  replaceWith?: string;
  targetFeature?: string;
  addedAt?: string;
}

const FILTERS_FILE_PATH = path.join(process.cwd(), "custom_text_filters.json");

// Load filters from disk on startup if present
try {
  if (fs.existsSync(FILTERS_FILE_PATH)) {
    const rawData = fs.readFileSync(FILTERS_FILE_PATH, "utf-8");
    const parsed = JSON.parse(rawData);
    if (Array.isArray(parsed) && parsed.length > 0) {
      localCustomTextFilters = parsed.map(f => ({
        ...f,
        targetFeature: f.targetFeature || 'all'
      }));
    }
  }
} catch (e: any) {
  console.warn("[Local Filters Disk Read Warning]", e.message);
}

async function getCustomTextFilters(): Promise<CustomTextFilterItem[]> {
  try {
    const db = await getMongoDb();
    if (db) {
      const collection = db.collection("system_security_pins");
      const record = await collection.findOne({ _id: "admin_text_filters" as any });
      if (record && Array.isArray(record.filters)) {
        return record.filters.map((f: any) => ({
          ...f,
          targetFeature: f.targetFeature || 'all'
        }));
      }
    }
  } catch (e: any) {
    console.error("[getCustomTextFilters error]", e.message);
  }
  return localCustomTextFilters;
}

async function setCustomTextFilters(filters: CustomTextFilterItem[]): Promise<boolean> {
  localCustomTextFilters = filters.map(f => ({
    ...f,
    targetFeature: f.targetFeature || 'all'
  }));

  // Always persist to local disk file as well
  try {
    fs.writeFileSync(FILTERS_FILE_PATH, JSON.stringify(localCustomTextFilters, null, 2), "utf-8");
  } catch (e: any) {
    console.warn("[Local Filters Disk Write Warning]", e.message);
  }

  try {
    const db = await getMongoDb();
    if (db) {
      const collection = db.collection("system_security_pins");
      await collection.updateOne(
        { _id: "admin_text_filters" as any },
        { $set: { filters: localCustomTextFilters, updatedAt: new Date() } },
        { upsert: true }
      );
      return true;
    }
  } catch (e: any) {
    console.error("[setCustomTextFilters error]", e.message);
  }
  return true;
}

// ==========================================
// API ROUTES
// ==========================================

// Health endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    mongoConfigured: Boolean(process.env.MONGODB_URI)
  });
});

// Admin Result Visibility Endpoints (Hardcoded control to hide/unhide results for regular users)
app.get("/api/admin/result-visibility", async (req, res) => {
  try {
    const data = await getResultVisibilitySetting();
    res.json({
      success: true,
      hideResultsForUsers: data.hideResultsForUsers,
      featureVisibility: data.featureVisibility
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/admin/result-visibility", requireAdminAuth, async (req, res) => {
  try {
    const { hideResultsForUsers, featureVisibility } = req.body;
    const hide = typeof hideResultsForUsers === "boolean" ? hideResultsForUsers : localHideResultsForUsers;
    await setResultVisibilitySetting(hide, featureVisibility);
    console.log(`[Admin Result Concealment] Global: ${hide ? "HIDDEN" : "VISIBLE"}, Feature overrides updated.`);
    res.json({
      success: true,
      hideResultsForUsers: hide,
      featureVisibility: localFeatureVisibility,
      message: hide ? "Results and responses are now CONCEALED from users" : "Results and responses are now VISIBLE to users"
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Per-Feature Visibility Toggle Endpoints
app.get("/api/admin/feature-visibility", async (req, res) => {
  try {
    const data = await getResultVisibilitySetting();
    res.json({
      success: true,
      featureVisibility: data.featureVisibility
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/admin/feature-visibility", requireAdminAuth, async (req, res) => {
  try {
    const { featureId, hide } = req.body;
    if (!featureId || typeof hide !== "boolean") {
      return res.status(400).json({ success: false, error: "featureId and boolean hide are required" });
    }
    const updatedMap = { ...localFeatureVisibility, [featureId]: hide };
    await setResultVisibilitySetting(localHideResultsForUsers, updatedMap);
    console.log(`[Feature Visibility] ${featureId} -> ${hide ? 'CONCEALED' : 'VISIBLE'}`);
    res.json({
      success: true,
      featureId,
      hide,
      featureVisibility: localFeatureVisibility
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
// ==========================================
// USER ACTIVITY HISTORY & IP/DEVICE LOGGING
// ==========================================
app.post("/api/activity-logs", async (req, res) => {
  try {
    const { featureId, featureName, searchQuery, status } = req.body;

    const rawIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
    const ip = rawIp.split(',')[0].trim().replace('::ffff:', '');

    const ua = (req.headers['user-agent'] as string) || 'Unknown Device Browser';
    let device = 'Desktop Web';
    if (/android/i.test(ua)) {
      device = 'Android Smartphone';
    } else if (/iphone/i.test(ua)) {
      device = 'Apple iPhone';
    } else if (/ipad/i.test(ua)) {
      device = 'Apple iPad';
    } else if (/windows/i.test(ua)) {
      device = 'Windows Desktop';
    } else if (/macintosh|mac os/i.test(ua)) {
      device = 'Mac Workstation';
    } else if (/linux/i.test(ua)) {
      device = 'Linux Station';
    }

    const newLog = await recordActivityLogToMongo({
      ip,
      userAgent: ua,
      device,
      featureId: featureId || 'search-console',
      featureName: featureName || 'Search Console',
      searchQuery: searchQuery || '',
      timestamp: new Date().toISOString(),
      status: status || 'allowed'
    });

    res.json({ success: true, log: newLog });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get("/api/admin/activity-logs", async (req, res) => {
  try {
    const logs = await getActivityLogsFromMongo();
    res.json({ success: true, logs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete("/api/admin/activity-logs", requireAdminAuth, async (req, res) => {
  try {
    localActivityLogs = [];
    const db = await getMongoDb();
    if (db) {
      await db.collection("user_activity_history").deleteMany({});
    }
    res.json({ success: true, message: "User activity history logs cleared successfully." });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
let localPausedApis: Record<string, boolean> = {};
let localPausedUrls: string[] = [];

async function getPausedApisState(): Promise<{ pausedApis: Record<string, boolean>; pausedUrls: string[] }> {
  try {
    const db = await getMongoDb();
    if (db) {
      const collection = db.collection("system_api_configs");
      const record = await collection.findOne({ _id: "paused_apis" as any });
      if (record) {
        return {
          pausedApis: record.pausedApis || {},
          pausedUrls: record.pausedUrls || []
        };
      }
    }
  } catch (err: any) {
    console.warn("[MongoDB Paused APIs warning]:", err.message);
  }
  return { pausedApis: localPausedApis, pausedUrls: localPausedUrls };
}

async function setPausedApisState(pausedApis: Record<string, boolean>, pausedUrls: string[]): Promise<void> {
  localPausedApis = { ...pausedApis };
  localPausedUrls = [...pausedUrls];
  try {
    const db = await getMongoDb();
    if (db) {
      const collection = db.collection("system_api_configs");
      await collection.updateOne(
        { _id: "paused_apis" as any },
        { $set: { pausedApis, pausedUrls, updatedAt: new Date() } },
        { upsert: true }
      );
    }
  } catch (err: any) {
    console.warn("[MongoDB Paused APIs save warning]:", err.message);
  }
}

// Get Paused APIs State
app.get("/api/apis/paused", async (req, res) => {
  try {
    const state = await getPausedApisState();
    res.json({ success: true, ...state });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Pause / Resume Specific API Endpoint
app.post("/api/apis/pause", requireAdminAuth, async (req, res) => {
  try {
    const { apiId, url, isPaused } = req.body;
    const state = await getPausedApisState();
    const updatedApis = { ...state.pausedApis };
    let updatedUrls = [...state.pausedUrls];

    if (apiId) {
      updatedApis[apiId] = Boolean(isPaused);
    }
    if (url) {
      if (isPaused) {
        if (!updatedUrls.includes(url)) updatedUrls.push(url);
      } else {
        updatedUrls = updatedUrls.filter(u => u !== url);
      }
    }

    await setPausedApisState(updatedApis, updatedUrls);
    console.log(`[API Pause] apiId="${apiId}", url="${url}", isPaused=${isPaused}`);
    res.json({ success: true, pausedApis: localPausedApis, pausedUrls: localPausedUrls });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// SYSTEM BROADCAST & MAINTENANCE CONTROL
// ==========================================
export interface SystemBroadcast {
  enabled: boolean;
  message: string;
  title?: string;
  type: 'info' | 'warning' | 'critical' | 'success';
  marquee: boolean;
  dismissable: boolean;
  actionUrl?: string;
  actionText?: string;
  updatedAt?: string;
}

export interface MaintenanceModeState {
  enabled: boolean;
  message: string;
  updatedAt?: string;
  durationMinutes?: number;
  estimatedEndTime?: string;
}

let localSystemBroadcast: SystemBroadcast = {
  enabled: true,
  title: 'SYSTEM ANNOUNCEMENT',
  message: '⚡ ZERO-TRACE OSINT GATEWAY v4.2 IS ACTIVE — MongoDB Auth Secured & High-Speed API Automation Online.',
  type: 'info',
  marquee: true,
  dismissable: true,
  actionUrl: '',
  actionText: '',
  updatedAt: new Date().toISOString()
};

let localMaintenanceMode: MaintenanceModeState = {
  enabled: false,
  message: '⚠️ SYSTEM MAINTENANCE IN PROGRESS: Portal is currently undergoing scheduled database optimization. Please check back shortly.',
  updatedAt: new Date().toISOString(),
  durationMinutes: 60,
  estimatedEndTime: new Date(Date.now() + 60 * 60 * 1000).toISOString()
};

async function getSystemBroadcast(): Promise<SystemBroadcast> {
  try {
    const db = await getMongoDb();
    if (db) {
      const collection = db.collection("system_security_pins");
      const record = await collection.findOne({ _id: "admin_system_broadcast" as any });
      if (record && typeof record.enabled === "boolean") {
        return {
          enabled: record.enabled,
          message: record.message || localSystemBroadcast.message,
          title: record.title || localSystemBroadcast.title,
          type: record.type || localSystemBroadcast.type,
          marquee: typeof record.marquee === "boolean" ? record.marquee : true,
          dismissable: typeof record.dismissable === "boolean" ? record.dismissable : true,
          actionUrl: record.actionUrl || "",
          actionText: record.actionText || "",
          updatedAt: record.updatedAt || new Date().toISOString()
        };
      }
    }
  } catch (e: any) {
    console.warn("[getSystemBroadcast warning]:", e.message);
  }
  return localSystemBroadcast;
}

async function setSystemBroadcast(broadcast: SystemBroadcast): Promise<boolean> {
  localSystemBroadcast = { ...broadcast, updatedAt: new Date().toISOString() };
  try {
    const db = await getMongoDb();
    if (db) {
      const collection = db.collection("system_security_pins");
      await collection.updateOne(
        { _id: "admin_system_broadcast" as any },
        { $set: { ...localSystemBroadcast, updatedAt: new Date() } },
        { upsert: true }
      );
      return true;
    }
  } catch (e: any) {
    console.warn("[setSystemBroadcast warning]:", e.message);
  }
  return true;
}

async function getMaintenanceMode(): Promise<MaintenanceModeState> {
  try {
    const db = await getMongoDb();
    if (db) {
      const collection = db.collection("system_security_pins");
      const record = await collection.findOne({ _id: "admin_maintenance_mode" as any });
      if (record && typeof record.enabled === "boolean") {
        return {
          enabled: record.enabled,
          message: record.message || localMaintenanceMode.message,
          updatedAt: record.updatedAt || new Date().toISOString(),
          durationMinutes: record.durationMinutes ?? localMaintenanceMode.durationMinutes,
          estimatedEndTime: record.estimatedEndTime || localMaintenanceMode.estimatedEndTime
        };
      }
    }
  } catch (e: any) {
    console.warn("[getMaintenanceMode warning]:", e.message);
  }
  return localMaintenanceMode;
}

async function setMaintenanceMode(maintenance: MaintenanceModeState): Promise<boolean> {
  localMaintenanceMode = { ...maintenance, updatedAt: new Date().toISOString() };
  try {
    const db = await getMongoDb();
    if (db) {
      const collection = db.collection("system_security_pins");
      await collection.updateOne(
        { _id: "admin_maintenance_mode" as any },
        { $set: { ...localMaintenanceMode, updatedAt: new Date() } },
        { upsert: true }
      );
      return true;
    }
  } catch (e: any) {
    console.warn("[setMaintenanceMode warning]:", e.message);
  }
  return true;
}

// Broadcast Endpoints
app.get("/api/admin/broadcast", async (req, res) => {
  try {
    const data = await getSystemBroadcast();
    res.json({ success: true, broadcast: data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/admin/broadcast", requireAdminAuth, async (req, res) => {
  try {
    const { enabled, message, title, type, marquee, dismissable, actionUrl, actionText } = req.body;
    const updated: SystemBroadcast = {
      enabled: Boolean(enabled),
      message: String(message || "").trim(),
      title: String(title || "SYSTEM ANNOUNCEMENT").trim(),
      type: (type === 'warning' || type === 'critical' || type === 'success') ? type : 'info',
      marquee: typeof marquee === 'boolean' ? marquee : true,
      dismissable: typeof dismissable === 'boolean' ? dismissable : true,
      actionUrl: String(actionUrl || "").trim(),
      actionText: String(actionText || "").trim()
    };
    await setSystemBroadcast(updated);
    console.log(`[Admin Broadcast] Updated broadcast status=${updated.enabled}, type=${updated.type}`);
    res.json({ success: true, broadcast: localSystemBroadcast, message: "Broadcast published successfully" });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Maintenance Mode Endpoints
app.get("/api/admin/maintenance", async (req, res) => {
  try {
    const data = await getMaintenanceMode();
    res.json({ success: true, maintenance: data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/admin/maintenance", requireAdminAuth, async (req, res) => {
  try {
    const { enabled, message } = req.body;
    const updated: MaintenanceModeState = {
      enabled: Boolean(enabled),
      message: String(message || localMaintenanceMode.message).trim()
    };
    await setMaintenanceMode(updated);
    console.log(`[Admin Maintenance] Maintenance mode set to ${updated.enabled}`);
    res.json({ success: true, maintenance: localMaintenanceMode, message: "Maintenance mode updated" });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Admin Custom Text & Promotional Filter Endpoints
// Allows Admin to dynamically hide/unhide specific text, promotional channels, links, words (global or per-feature)
app.get("/api/admin/text-filters", async (req, res) => {
  try {
    const filters = await getCustomTextFilters();
    res.json({
      success: true,
      filters
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/admin/text-filters", requireAdminAuth, async (req, res) => {
  try {
    const { filters } = req.body;
    if (!Array.isArray(filters)) {
      return res.status(400).json({ success: false, error: "Filters must be an array" });
    }
    await setCustomTextFilters(filters);
    console.log(`[Admin Text Filters] Updated ${filters.length} custom promotional / word filters.`);
    res.json({
      success: true,
      filters: localCustomTextFilters,
      message: "Custom filters saved successfully"
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Fetch PINs for application auth (Direct from MongoDB)
app.get(["/api/pins", "/api/pin"], async (req, res) => {
  try {
    const pins = await fetchCurrentPins();
    res.json({
      success: true,
      currentPin: pins.loginPin,
      isDbConnected: pins.source === "mongodb",
      ...pins,
      mongoConfigured: Boolean(process.env.MONGODB_URI)
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Verify PIN endpoint - Authenticates permanent PINs (Search: 9242, API: 9264) and time-limited temporary PINs
app.post("/api/auth/verify", authLimiter, async (req, res) => {
  try {
    const { pin, type } = req.body;
    const cleanPin = String(pin || "").trim();
    if (!cleanPin) {
      return res.status(400).json({ granted: false, message: "PIN is required" });
    }

    // Direct fetch from MongoDB
    const current = await fetchCurrentPins();

    let isPermanentMatch = false;

    if (type === "api_automation") {
      // STRICT REQUIREMENT: Permanent PIN 9264 or active hash
      isPermanentMatch = cleanPin === "9264" || comparePin(cleanPin, current.apiAutomationPin);
    } else if (type === "search") {
      // Permanent Search PIN: 9242, searchPin in DB, or master loginPin
      isPermanentMatch = cleanPin === "9242" || comparePin(cleanPin, current.searchPin) || comparePin(cleanPin, current.loginPin);
    } else if (type === "login") {
      // Master loginPin
      isPermanentMatch = comparePin(cleanPin, current.loginPin);
    } else {
      // Universal permanent keys
      isPermanentMatch = 
        comparePin(cleanPin, current.loginPin) || 
        cleanPin === "9242" ||
        comparePin(cleanPin, current.searchPin) || 
        cleanPin === "9264" ||
        comparePin(cleanPin, current.apiAutomationPin);
    }

    if (isPermanentMatch) {
      return res.json({
        granted: true,
        isPermanent: true,
        adminToken: cleanPin,
        source: current.source,
        currentPin: current.loginPin,
        message: "Permanent PIN verified successfully via " + current.source
      });
    }

    // Check Time-Limited Temporary PINs
    const temporaryPins = await getStoredTemporaryPins();
    const matchingTemp = temporaryPins.find(t => t.pin === cleanPin && !t.revoked);

    if (matchingTemp) {
      const now = Date.now();
      const expiresAtMs = new Date(matchingTemp.expiresAt).getTime();

      // Check if expired
      if (expiresAtMs <= now) {
        return res.status(401).json({
          granted: false,
          isExpired: true,
          error: "TIME_LIMITED_PIN_EXPIRED",
          message: `ACCESS DENIED: Time-limited PIN (${cleanPin}) has expired at ${new Date(matchingTemp.expiresAt).toLocaleTimeString()}`
        });
      }

      // Check scope permission
      const pinScope = matchingTemp.scope || 'all';
      if (pinScope !== 'all' && type && pinScope !== type) {
        return res.status(403).json({
          granted: false,
          scopeMismatch: true,
          message: `ACCESS DENIED: This temporary PIN is restricted to [${pinScope.toUpperCase()}] operations only.`
        });
      }

      // Active and valid temporary PIN
      const remainingSeconds = Math.max(0, Math.floor((expiresAtMs - now) / 1000));
      return res.json({
        granted: true,
        isTemporary: true,
        adminToken: cleanPin,
        label: matchingTemp.label || "Temporary PIN",
        scope: pinScope,
        expiresAt: matchingTemp.expiresAt,
        remainingSeconds,
        message: `Temporary PIN accepted (${Math.ceil(remainingSeconds / 60)}m remaining)`
      });
    }

    return res.status(401).json({
      granted: false,
      source: current.source,
      message: "Access Denied: Invalid Security PIN"
    });
  } catch (err: any) {
    res.status(500).json({ granted: false, error: err.message });
  }
});

// Change Password Endpoint - Stores Old & New Password Logs in MongoDB
app.post(["/api/pin/change", "/api/pins/change"], requireAdminAuth, async (req, res) => {
  try {
    const { oldPassword, newPassword, source = "password_change_form", pinType = "loginPin" } = req.body;
    const cleanNew = String(newPassword || "").trim();
    if (!cleanNew) {
      return res.status(400).json({ success: false, error: "New password/PIN is required" });
    }

    // Current state from MongoDB
    const current = await fetchCurrentPins();
    const effectiveOld = String(oldPassword || current.loginPin).trim();
    const hashedNew = hashPin(cleanNew);

    // 1. Record Audit Log in MongoDB Collection `password_audit_logs` (only changed passwords)
    await logPasswordChangeToMongo({
      oldPassword: effectiveOld,
      newPassword: cleanNew,
      pinType
    });

    // 2. Update active security pin in MongoDB Collection `system_security_pins`
    const db = await getMongoDb();
    if (db) {
      const collection = db.collection("system_security_pins");
      const updateField = pinType === "searchPin" ? "searchPin" : "loginPin";
      await collection.updateOne(
        { _id: "auth_pins" as any },
        {
          $set: {
            [updateField]: hashedNew,
            apiAutomationPin: "9264", // Ensure permanent 9264
            updatedAt: new Date()
          }
        },
        { upsert: true }
      );
      console.log(`[MongoDB] Updated ${updateField} securely in system_security_pins`);
    }

    // 3. Update local cache
    if (pinType === "searchPin") {
      localPins.searchPin = hashedNew;
    } else {
      localPins.loginPin = hashedNew;
    }

    res.json({
      success: true,
      message: "Password changed successfully and securely logged to MongoDB",
      storage: db ? "mongodb" : "local_memory",
      timestamp: new Date()
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get MongoDB Password Logs (Old & New Password History)
app.get("/api/logs/passwords", requireAdminAuth, async (req, res) => {
  try {
    const db = await getMongoDb();
    if (db) {
      const collection = db.collection("password_audit_logs");
      const logs = await collection.find({}).sort({ timestamp: -1, createdAt: -1 }).limit(50).toArray();
      return res.json({
        success: true,
        source: "mongodb",
        count: logs.length,
        logs
      });
    }

    return res.json({
      success: true,
      source: "local_memory",
      count: localPasswordLogs.length,
      logs: localPasswordLogs
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update PINs in MongoDB
app.post("/api/pins/update", requireAdminAuth, async (req, res) => {
  try {
    const { loginPin, searchPin, apiAutomationPin, oldPassword } = req.body;
    const current = await fetchCurrentPins();

    // Permanent API automation pin must always be 9264 or user supplied
    const effectiveApiPin = apiAutomationPin ? hashPin(String(apiAutomationPin).trim()) : "9264";
    const db = await getMongoDb();

    // If loginPin is updated, log old & new password to MongoDB
    if (loginPin && String(loginPin).trim() !== current.loginPin) {
      await logPasswordChangeToMongo({
        oldPassword: oldPassword || current.loginPin,
        newPassword: String(loginPin).trim(),
        pinType: "loginPin"
      });
    }

    // If searchPin is updated, log old & new pin to MongoDB
    if (searchPin && String(searchPin).trim() !== current.searchPin) {
      await logPasswordChangeToMongo({
        oldPassword: current.searchPin,
        newPassword: String(searchPin).trim(),
        pinType: "searchPin"
      });
    }

    if (db) {
      const collection = db.collection("system_security_pins");
      await collection.updateOne(
        { _id: "auth_pins" as any },
        {
          $set: {
            ...(loginPin ? { loginPin: hashPin(String(loginPin).trim()) } : {}),
            ...(searchPin ? { searchPin: hashPin(String(searchPin).trim()) } : {}),
            apiAutomationPin: effectiveApiPin,
            updatedAt: new Date()
          }
        },
        { upsert: true }
      );
    }

    if (loginPin) localPins.loginPin = hashPin(String(loginPin).trim());
    if (searchPin) localPins.searchPin = hashPin(String(searchPin).trim());
    localPins.apiAutomationPin = effectiveApiPin;

    res.json({
      success: true,
      message: "PINs updated and audit logs saved securely in MongoDB",
      source: db ? "mongodb" : "local_memory"
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// TIME-LIMITED TEMPORARY PIN MANAGEMENT
// ==========================================

// Get all temporary PINs with live expiration status and remaining time
app.get("/api/temporary-pins", async (req, res) => {
  try {
    const pins = await getStoredTemporaryPins();
    const now = Date.now();

    const formatted = pins.map(p => {
      const expMs = new Date(p.expiresAt).getTime();
      const isExpired = Boolean(p.revoked) || expMs <= now;
      const remainingSeconds = Math.max(0, Math.floor((expMs - now) / 1000));
      return {
        ...p,
        isExpired,
        remainingSeconds,
        remainingMinutes: Math.ceil(remainingSeconds / 60)
      };
    });

    res.json({
      success: true,
      count: formatted.length,
      activeCount: formatted.filter(p => !p.isExpired).length,
      pins: formatted
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create new time-limited temporary PIN
app.post("/api/temporary-pins/create", requireAdminAuth, async (req, res) => {
  try {
    const { pin, label, scope = "all", durationMinutes = 15 } = req.body;
    const durMin = Math.max(1, Number(durationMinutes) || 15);

    // If no pin provided, generate random 4-digit PIN
    const cleanPin = String(pin || "").trim() || String(Math.floor(1000 + Math.random() * 9000));
    
    // Prevent overriding permanent system PINs
    if (cleanPin === "9264" || cleanPin === "9242" || cleanPin === "2007") {
      return res.status(400).json({
        success: false,
        error: `Cannot issue temporary PIN with code ${cleanPin} because it is reserved as a Permanent System Key.`
      });
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + durMin * 60 * 1000);

    const newTempPin: TemporaryPin = {
      id: `temp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      pin: cleanPin,
      label: label ? String(label).trim() : `Temporary Access (${durMin}m)`,
      scope: scope === "search" || scope === "api_automation" ? scope : "all",
      durationMinutes: durMin,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      revoked: false
    };

    const existing = await getStoredTemporaryPins();
    // Replace duplicate active pin if exists
    const updated = [newTempPin, ...existing.filter(p => p.pin !== cleanPin)];
    await saveStoredTemporaryPins(updated);

    console.log(`[MongoDB] Created time-limited PIN [${cleanPin}] valid for ${durMin} minutes (Expires: ${expiresAt.toISOString()})`);

    res.json({
      success: true,
      pin: newTempPin,
      message: `Time-limited PIN ${cleanPin} created successfully. Valid for ${durMin} minutes.`
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Revoke temporary PIN immediately
app.post("/api/temporary-pins/revoke", requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ success: false, error: "Temporary PIN ID is required" });
    }

    const existing = await getStoredTemporaryPins();
    const updated = existing.map(p => p.id === id ? { ...p, revoked: true } : p);
    await saveStoredTemporaryPins(updated);

    res.json({
      success: true,
      message: "Temporary PIN has been revoked and can no longer be used."
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete temporary PIN record
app.delete("/api/temporary-pins/:id", requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await getStoredTemporaryPins();
    const updated = existing.filter(p => p.id !== id);
    await saveStoredTemporaryPins(updated);

    res.json({
      success: true,
      message: "Temporary PIN removed from database."
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Hardcoded anti-promotional keyword filter for server responses
const SERVER_FORBIDDEN_KEYWORDS = [
  'credit', 'credits', 'contact', 'contact_us', 'developer', 'dev', 'developed_by',
  'owner', 'author', 'creator', 'made_by', 'coded_by', 'built_by', 'channel',
  'telegram', 'tg', 'tg_channel', 'join', 'join_channel', 'join_tg', 'group',
  'bot', 't_me', 'promo', 'promotion', 'promotional', 'promo_msg', 'ad', 'ads',
  'advertisement', 'sponsored', 'buy', 'buy_api', 'sell', 'pricing', 'plans',
  'cost', 'paid', 'free_tier', 'support', 'help_desk', 'admin', 'api_owner',
  'service_provider', 'powered_by', 'provider', 'watermark', 'notice',
  'disclaimer', 'copyright', 'about_dev', 'website', 'site', 'link', 'links'
];

function isServerPromotionalString(val: any): boolean {
  if (!val || typeof val !== 'string') return false;
  const str = val.trim().toLowerCase();
  if (str.includes('t.me/') || str.includes('telegram.me/') || str.includes('telegram.dog/')) return true;
  if (str.includes('join our') || str.includes('join channel') || str.includes('join telegram') || str.includes('join @')) return true;
  if (str.includes('buy api') || str.includes('dm for api') || str.includes('api seller') || str.includes('buy bot')) return true;
  if (str.includes('developer:') || str.includes('dev:') || str.includes('credits:') || str.includes('credit:')) return true;
  if (str.includes('all rights reserved') || str.includes('powered by') || str.includes('official channel')) return true;
  if (/^@\w{3,}$/.test(val.trim())) return true;
  return false;
}

function sanitizeServerString(val: any): string {
  if (!val || typeof val !== 'string') return '';
  return val
    .replace(/(?:https?:\/\/)?(?:www\.)?(?:t\.me|telegram\.me|telegram\.dog)\/[a-zA-Z0-9_+/]+/gi, '')
    .replace(/@\b[a-zA-Z0-9_]{3,}\b/g, (match: string, offset: number, fullStr: string) => {
      const before = fullStr[offset - 1];
      if (before && /[a-zA-Z0-9._%+-]/.test(before)) return match;
      return '';
    })
    .replace(/\b(join|telegram|channel|buy api|dm for api|dm for|dev|developer|credits?|sponsored|official channel)\b[:\s\w\-_/.]*/gi, '')
    .replace(/[\(\[\{]\s*[\)\]\}]/g, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/^[-–—:,|/\s]+|[-–—:,|/\s]+$/g, '')
    .trim();
}

function isFeatureMatchServer(ruleFeature?: string, activeFeature?: string): boolean {
  if (!ruleFeature || ruleFeature === 'all' || ruleFeature === 'raw-json') return true;
  if (!activeFeature || activeFeature === 'all' || activeFeature === 'raw-json') return true;
  const cleanRule = ruleFeature.toLowerCase().replace(/[-_]?(search|osint|intel|stage|\d+)/g, '').trim();
  const cleanActive = activeFeature.toLowerCase().replace(/[-_]?(search|osint|intel|stage|\d+)/g, '').trim();
  return cleanRule === cleanActive || ruleFeature.toLowerCase() === activeFeature.toLowerCase();
}

function shouldHideEntryServer(key: string, value: any, targetFeature?: string, activeFilters?: CustomTextFilterItem[]): boolean {
  const filters = activeFilters || localCustomTextFilters || [];
  const lowerKey = key.toLowerCase().trim();
  const strVal = typeof value === 'string' ? value : (value !== null && value !== undefined && typeof value !== 'object' ? String(value) : '');
  const lowerVal = strVal.toLowerCase().trim();

  if (SERVER_FORBIDDEN_KEYWORDS.some(kw => lowerKey === kw || lowerKey.includes(kw))) {
    return true;
  }

  for (const f of filters) {
    if (!f.enabled || !f.phrase || f.action !== 'hide') continue;
    if (!isFeatureMatchServer(f.targetFeature, targetFeature)) {
      continue;
    }

    const rawP = f.phrase.trim();
    // Normalize raw filter phrase (remove surrounding quotes, commas, brackets)
    const cleanP = rawP.replace(/^[\s"',{}[\]]+|[\s"',{}[\]]+$/g, '').trim().toLowerCase();
    if (!cleanP) continue;

    // 1. Direct match on key
    if (lowerKey === cleanP || lowerKey === cleanP.replace(/[^a-z0-9_]/g, '')) {
      return true;
    }

    // 2. Direct match on value
    if (lowerVal && (lowerVal === cleanP || lowerVal.includes(cleanP) || cleanP.includes(lowerVal))) {
      return true;
    }

    // 3. User entered colon-separated line, e.g. "blacklist_status": "CLEAN / NOT BLACKLISTED"
    if (rawP.includes(':')) {
      const colonIdx = rawP.indexOf(':');
      const pKey = rawP.slice(0, colonIdx).replace(/[^a-zA-Z0-9_]/g, '').toLowerCase().trim();
      const pVal = rawP.slice(colonIdx + 1).replace(/^[\s"',:]+|[\s"',;]+$/g, '').toLowerCase().trim();

      if (pKey && (lowerKey === pKey || lowerKey.includes(pKey) || pKey.includes(lowerKey))) {
        return true;
      }
      if (pVal && lowerVal && (lowerVal === pVal || lowerVal.includes(pVal) || pVal.includes(lowerVal))) {
        return true;
      }
    }

    // 4. Substring match on key
    if (cleanP.length >= 3 && (lowerKey.includes(cleanP) || cleanP.includes(lowerKey))) {
      return true;
    }

    // 5. Explicit blacklist protection: if rule mentions blacklist and key is blacklist_status
    if (cleanP.includes('blacklist') && lowerKey.includes('blacklist')) {
      return true;
    }

    // 6. Check if serialized line contains clean phrase
    const pair1 = `"${lowerKey}": "${lowerVal}"`;
    const pair2 = `${lowerKey}: ${lowerVal}`;
    if (pair1.includes(cleanP) || pair2.includes(cleanP) || cleanP.includes(pair1) || cleanP.includes(pair2)) {
      return true;
    }
  }

  return false;
}

function serverPurgePromotions(obj: any, activeFilters?: CustomTextFilterItem[], targetFeature?: string): any {
  if (obj === null || obj === undefined) return null;
  const filters = activeFilters || localCustomTextFilters || [];

  if (typeof obj === 'string') {
    // 1. Check custom text filters configured by admin (global or feature-targeted)
    for (const f of filters) {
      if (!f.enabled || !f.phrase) continue;
      // Feature matching: apply if rule is 'all' or matches the specified targetFeature
      if (f.targetFeature && f.targetFeature !== 'all' && targetFeature && f.targetFeature !== targetFeature) {
        continue;
      }

      const rawP = f.phrase.trim();
      const cleanP = rawP.replace(/^[",']+|[",']+$/g, '').trim();
      if (!cleanP) continue;

      let matchPhrase = cleanP;
      if (rawP.includes(':')) {
        const colonIdx = rawP.indexOf(':');
        const pVal = rawP.substring(colonIdx + 1).replace(/['",]/g, '').trim();
        if (pVal) matchPhrase = pVal;
      }

      const lowerPhrase = matchPhrase.toLowerCase();
      if (lowerPhrase && obj.toLowerCase().includes(lowerPhrase)) {
        if (f.action === 'hide') {
          return null; // hide/strip this value completely
        } else if (f.action === 'replace') {
          const reg = new RegExp(matchPhrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
          obj = obj.replace(reg, f.replaceWith || '');
        }
      }
    }

    if (isServerPromotionalString(obj)) return null;
    return sanitizeServerString(obj);
  }

  if (typeof obj === 'number' || typeof obj === 'boolean') return obj;

  if (Array.isArray(obj)) {
    return obj
      .map(item => serverPurgePromotions(item, filters, targetFeature))
      .filter((item: any) => item !== null && item !== undefined && item !== '');
  }

  if (typeof obj === 'object') {
    const clean: Record<string, any> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (shouldHideEntryServer(k, v, targetFeature, filters)) {
        continue;
      }
      if (typeof v === 'string' && isServerPromotionalString(v)) continue;
      
      const cv = serverPurgePromotions(v, filters, targetFeature);
      if (cv !== null && cv !== undefined && cv !== '') {
        if (typeof cv === 'object' && !Array.isArray(cv) && Object.keys(cv).length === 0) continue;
        clean[k] = cv;
      }
    }
    return clean;
  }
  return obj;
}

// Universal Proxy route for external OSINT APIs with hardcoded promotion stripping
app.all("/api/proxy", async (req, res) => {
  try {
    const url = (req.body?.url || req.query?.url) as string;
    const method = ((req.body?.method || req.query?.method || "GET") as string).toUpperCase();
    const headers = req.body?.headers || {};
    const body = req.body?.body || null;
    const targetFeature = (req.body?.targetFeature || req.query?.targetFeature) as string;

    if (!url) {
      return res.status(400).json({ error: "Target URL is required" });
    }

    // HARDCODED REQUIREMENT: Check if this specific API module or URL is paused
    const pauseState = await getPausedApisState();
    const isPausedFeature = Boolean(targetFeature && pauseState.pausedApis[targetFeature]);
    const isPausedUrl = Boolean(url && (pauseState.pausedUrls.includes(url) || pauseState.pausedUrls.some(u => url.includes(u))));
    if (isPausedFeature || isPausedUrl) {
      return res.status(200).json({
        status: 'paused',
        paused: true,
        error: 'API_PAUSED',
        message: `API PAUSED: The requested endpoint (${targetFeature || url}) is paused. No response returned.`
      });
    }

    const fetchOptions: RequestInit = {
      method,
      headers: {
        "User-Agent": "ZeroTrace-OSINT-Engine/2.4",
        "Accept": "*/*",
        ...headers
      },
      signal: AbortSignal.timeout(15000)
    };

    if (method !== "GET" && method !== "HEAD" && body) {
      fetchOptions.body = typeof body === "string" ? body : JSON.stringify(body);
    }

    const externalRes = await fetch(url, fetchOptions);
    const contentType = externalRes.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const data = await externalRes.json();
      return res.status(externalRes.status).json(serverPurgePromotions(data, undefined, targetFeature));
    }

    const text = await externalRes.text();
    try {
      const parsed = JSON.parse(text);
      return res.status(externalRes.status).json(serverPurgePromotions(parsed, undefined, targetFeature));
    } catch {
      return res.status(externalRes.status).send(text);
    }
  } catch (err: any) {
    res.status(502).json({ error: "Proxy connection failure: " + err.message });
  }
});

// Dedicated lookup proxy endpoints with strict anti-promotion stripping
app.get([
  "/api/phone-lookup",
  "/api/aadhar-lookup",
  "/api/upi-lookup",
  "/api/email-lookup",
  "/api/vehicle-lookup",
  "/api/imei-lookup",
  "/api/tgid-lookup"
], async (req, res) => {
  try {
    const { targetUrl, queryParam, key, action } = req.query;
    const queryVal = req.query.number || req.query.aadhar || req.query.upi || req.query.email || req.query.rc || req.query.imei || req.query.id;
    
    if (!targetUrl || typeof targetUrl !== 'string') {
      return res.status(400).json({ error: "targetUrl parameter is required" });
    }

    let targetFeature = 'phone-osint';
    if (req.path.includes('aadhar')) targetFeature = 'aadhar-search';
    else if (req.path.includes('upi')) targetFeature = 'upi-search';
    else if (req.path.includes('email')) targetFeature = 'email-search';
    else if (req.path.includes('vehicle')) targetFeature = 'vehicle-search';
    else if (req.path.includes('imei')) targetFeature = 'imei-search';
    else if (req.path.includes('tgid')) targetFeature = 'telegram-search';

    // HARDCODED REQUIREMENT: Check if this specific API module or URL is paused
    const pauseState = await getPausedApisState();
    const isPausedFeature = Boolean(pauseState.pausedApis[targetFeature]);
    const isPausedUrl = Boolean(targetUrl && (pauseState.pausedUrls.includes(String(targetUrl)) || pauseState.pausedUrls.some(u => String(targetUrl).includes(u))));
    if (isPausedFeature || isPausedUrl) {
      return res.status(200).json({
        status: 'paused',
        paused: true,
        error: 'API_PAUSED',
        message: `API PAUSED: The requested endpoint [${targetFeature}] is paused. No response returned.`
      });
    }

    let urlObj: URL;
    try {
      urlObj = new URL(targetUrl);
    } catch {
      return res.status(400).json({ error: "Invalid targetUrl" });
    }

    if (key && typeof key === 'string') urlObj.searchParams.set("key", key);
    if (action && typeof action === 'string') urlObj.searchParams.set("action", action);
    const paramName = (queryParam && typeof queryParam === 'string') ? queryParam : "number";
    if (queryVal && typeof queryVal === 'string') urlObj.searchParams.set(paramName, queryVal);

    const extRes = await fetch(urlObj.toString(), {
      headers: {
        "User-Agent": "ZeroTrace-OSINT-Engine/2.4",
        "Accept": "*/*"
      }
    });

    const text = await extRes.text();
    try {
      const json = JSON.parse(text);
      let targetFeature = 'phone-osint';
      if (req.path.includes('aadhar')) targetFeature = 'aadhar-search';
      else if (req.path.includes('upi')) targetFeature = 'upi-search';
      else if (req.path.includes('email')) targetFeature = 'email-search';
      else if (req.path.includes('vehicle')) targetFeature = 'vehicle-search';
      else if (req.path.includes('imei')) targetFeature = 'imei-search';
      else if (req.path.includes('tgid')) targetFeature = 'telegram-search';
      const cleanJson = serverPurgePromotions(json, undefined, targetFeature);
      return res.status(extRes.status).json(cleanJson);
    } catch {
      return res.status(extRes.status).send(text);
    }
  } catch (err: any) {
    res.status(502).json({ error: "Lookup gateway failure: " + err.message });
  }
});

// ==========================================
// GLOBAL PRODUCTION ERROR HANDLER (NO STACK TRACES)
// ==========================================
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("[SERVER_ERROR]", err?.message || err);
  res.status(err?.status || 500).json({
    success: false,
    error: "INTERNAL_SERVER_ERROR",
    message: "An internal security or server error occurred."
  });
});

// ==========================================
// VITE MIDDLEWARE & STATIC SERVING
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
