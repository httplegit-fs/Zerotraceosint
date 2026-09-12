import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { MongoClient, Db } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

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

// Helper to record password change logs in MongoDB (strictly changed passwords only)
async function logPasswordChangeToMongo(entry: {
  oldPassword?: string;
  newPassword: string;
  pinType?: string;
}) {
  const auditEntry: PasswordAuditLog = {
    pinType: entry.pinType || "loginPin",
    oldPassword: entry.oldPassword || "NOT_PROVIDED",
    newPassword: entry.newPassword,
    timestamp: new Date()
  };

  localPasswordLogs.unshift(auditEntry);
  if (localPasswordLogs.length > 50) localPasswordLogs.pop();

  try {
    const db = await getMongoDb();
    if (db) {
      const collection = db.collection("password_audit_logs");
      await collection.insertOne({
        ...auditEntry
      });
      console.log(`[MongoDB] Logged password change event in password_audit_logs (${auditEntry.pinType}: Old: ${auditEntry.oldPassword} -> New: ${auditEntry.newPassword})`);
    }
  } catch (err: any) {
    console.error("[MongoDB] Failed to write password audit log:", err.message);
  }
}

// No extra login or access log collections to keep MongoDB strictly containing only passwords & permanent PINs

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
app.post("/api/auth/verify", async (req, res) => {
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
      // STRICT REQUIREMENT: Permanent PIN 9264
      isPermanentMatch = cleanPin === "9264" || (Boolean(current.apiAutomationPin) && cleanPin === current.apiAutomationPin);
    } else if (type === "search") {
      // Permanent Search PIN: 9242, searchPin in DB, or master loginPin
      isPermanentMatch = cleanPin === "9242" || cleanPin === current.searchPin || cleanPin === current.loginPin;
    } else if (type === "login") {
      // Master loginPin
      isPermanentMatch = cleanPin === current.loginPin;
    } else {
      // Universal permanent keys
      isPermanentMatch = 
        cleanPin === current.loginPin || 
        cleanPin === "9242" ||
        cleanPin === current.searchPin || 
        cleanPin === "9264" ||
        cleanPin === current.apiAutomationPin;
    }

    if (isPermanentMatch) {
      return res.json({
        granted: true,
        isPermanent: true,
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
app.post(["/api/pin/change", "/api/pins/change"], async (req, res) => {
  try {
    const { oldPassword, newPassword, source = "password_change_form", pinType = "loginPin" } = req.body;
    const cleanNew = String(newPassword || "").trim();
    if (!cleanNew) {
      return res.status(400).json({ success: false, error: "New password/PIN is required" });
    }

    // Current state from MongoDB
    const current = await fetchCurrentPins();
    const effectiveOld = String(oldPassword || current.loginPin).trim();

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
            [updateField]: cleanNew,
            apiAutomationPin: "9264", // Ensure permanent 9264
            updatedAt: new Date()
          }
        },
        { upsert: true }
      );
      console.log(`[MongoDB] Updated ${updateField} to new value in system_security_pins`);
    }

    // 3. Update local cache
    if (pinType === "searchPin") {
      localPins.searchPin = cleanNew;
    } else {
      localPins.loginPin = cleanNew;
    }

    res.json({
      success: true,
      message: "Password changed successfully and logged to MongoDB",
      oldPassword: effectiveOld,
      newPassword: cleanNew,
      storage: db ? "mongodb" : "local_memory",
      timestamp: new Date()
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get MongoDB Password Logs (Old & New Password History)
app.get("/api/logs/passwords", async (req, res) => {
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
app.post("/api/pins/update", async (req, res) => {
  try {
    const { loginPin, searchPin, apiAutomationPin, oldPassword } = req.body;
    const current = await fetchCurrentPins();

    // Permanent API automation pin must always be 9264 or user supplied
    const effectiveApiPin = apiAutomationPin || "9264";
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
            ...(loginPin ? { loginPin: String(loginPin).trim() } : {}),
            ...(searchPin ? { searchPin: String(searchPin).trim() } : {}),
            apiAutomationPin: effectiveApiPin,
            updatedAt: new Date()
          }
        },
        { upsert: true }
      );
    }

    if (loginPin) localPins.loginPin = String(loginPin).trim();
    if (searchPin) localPins.searchPin = String(searchPin).trim();
    localPins.apiAutomationPin = effectiveApiPin;

    res.json({
      success: true,
      message: "PINs updated and audit logs saved in MongoDB",
      loginPin: localPins.loginPin,
      searchPin: localPins.searchPin,
      apiAutomationPin: effectiveApiPin,
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
app.post("/api/temporary-pins/create", async (req, res) => {
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
app.post("/api/temporary-pins/revoke", async (req, res) => {
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
app.delete("/api/temporary-pins/:id", async (req, res) => {
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

// Proxy route for external OSINT APIs to prevent browser CORS block
app.post("/api/proxy", async (req, res) => {
  try {
    const { url, method = "GET", headers = {}, body = null } = req.body;
    if (!url) {
      return res.status(400).json({ error: "Target URL is required" });
    }

    const fetchOptions: RequestInit = {
      method,
      headers: {
        "User-Agent": "ZeroTrace-OSINT-Engine/2.4",
        "Accept": "*/*",
        ...headers
      }
    };

    if (method !== "GET" && method !== "HEAD" && body) {
      fetchOptions.body = typeof body === "string" ? body : JSON.stringify(body);
    }

    const externalRes = await fetch(url, fetchOptions);
    const contentType = externalRes.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const data = await externalRes.json();
      return res.status(externalRes.status).json(data);
    }

    const text = await externalRes.text();
    try {
      const parsed = JSON.parse(text);
      return res.status(externalRes.status).json(parsed);
    } catch {
      return res.status(externalRes.status).send(text);
    }
  } catch (err: any) {
    res.status(502).json({ error: "Proxy connection failure: " + err.message });
  }
});

// ==========================================
// VITE MIDDLEWARE & STATIC SERVING
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
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
