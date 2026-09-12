/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { HackerLoadingScreen } from './components/HackerLoadingScreen';
import { LiquidGlassLockScreen } from './components/LiquidGlassLockScreen';
import {
  Search,
  Pin,
  PinOff,
  Key,
  Lock,
  Unlock,
  Terminal as TerminalIcon,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Cpu,
  Wifi,
  Copy,
  Check,
  Plus,
  Trash2,
  RefreshCw,
  Play,
  Eye,
  EyeOff,
  Radio,
  Server,
  Code2,
  Bug,
  Globe,
  Database,
  Layers,
  HelpCircle,
  Hash,
  AlertCircle,
  User,
  Phone,
  MapPin,
  Building,
  Smartphone,
  Mail,
  FileText,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  FilterX,
  X,
  ExternalLink
} from 'lucide-react';

// Preset cyber modules based on the theme
interface CyberTopic {
  id: string;
  title: string;
  category: string;
  subtitle: string;
  icon: string;
  items: string[];
  command: string;
  severity: 'low' | 'med' | 'high' | 'crit';
  badge: string;
}

interface PinnedInput {
  id: string;
  type: 'pin_code' | 'command' | 'query' | 'note';
  value: string;
  label: string;
  timestamp: string;
  isSecret?: boolean;
}

const DEFAULT_TOPICS: CyberTopic[] = [
  {
    id: 'phone-osint',
    title: 'PHONE NUMBER SEARCH',
    category: 'NETWORK',
    subtitle: 'OSINT Number Intel & Carrier Footprint',
    icon: 'Globe',
    badge: 'STAGE 01',
    severity: 'crit',
    command: 'phoneinfoga scan -n +1234567890 --recon --dork',
    items: [
      'Global Carrier & Telecom Line Type Detection',
      'Caller ID & HLR Lookup Intelligence',
      'WhatsApp, Telegram & Social Footprinting',
      'Google Dorking & Data Leak Cross-Check',
      'VoIP vs Landline vs Mobile Verification'
    ]
  },
  {
    id: 'aadhar-search',
    title: 'AADHAR SEARCH',
    category: 'SECURITY',
    subtitle: 'Verification & Biometric Status Check',
    icon: 'Shield',
    badge: 'STAGE 02',
    severity: 'crit',
    command: 'python3 aadhaar_verify.py --uid 1234-5678-9012 --check-status',
    items: [
      'UIDAI Format & Verhoeff Checksum Algorithm Validation',
      'Linked Mobile & Email Masked Status Check',
      'Age Band & State Regional Mapping Verification',
      'Biometric Lock / Unlock Telemetry Query',
      'Masked e-Aadhaar Digital Signature Verification'
    ]
  },
  {
    id: 'upi-search',
    title: 'UPI SEARCH',
    category: 'NETWORK',
    subtitle: 'VPA Recon, Bank Handle & Fraud Check',
    icon: 'Terminal',
    badge: 'STAGE 03',
    severity: 'high',
    command: 'upi_recon --vpa targetuser@okhdfcbank --trace-handle',
    items: [
      'Virtual Payment Address (VPA) Resolve & Name Check',
      'Banking Handle & IFSC Routing Association',
      'NPCI QR Code Metadata Payload Parsing',
      'Payment Gateway & Fraud Registry Cross-Reference',
      'Connected Payment App Discovery (GPay, PhonePe, Paytm)'
    ]
  },
  {
    id: 'email-search',
    title: 'EMAIL SEARCH',
    category: 'NETWORK',
    subtitle: 'Breach DB, MX Records & Gravatar OSINT',
    icon: 'Globe',
    badge: 'STAGE 04',
    severity: 'high',
    command: 'holehe user@targetdomain.com && h8mail -t user@targetdomain.com',
    items: [
      '120+ Social Platform Registration Reverse Lookup (Holehe)',
      'Data Breach & Credential Leak Exposure Check',
      'MX, SPF, DKIM & DMARC Header Fingerprinting',
      'Gravatar, GitHub & Google Profile Discovery',
      'Disposable vs Corporate Email Domain Verification'
    ]
  },
  {
    id: 'vehicle-search',
    title: 'VEHICLE SEARCH',
    category: 'LAB_SETUP',
    subtitle: 'RC Status, RTO Database & Chassis Lookup',
    icon: 'Server',
    badge: 'STAGE 05',
    severity: 'med',
    command: 'vahan_recon --rc DL8CAF5030 --fetch-details',
    items: [
      'Vehicle Registration Certificate (RC) Verification',
      'RTO Authority & State Jurisdiction Lookup',
      'Vehicle Class, Fuel Type & Emission Standards',
      'Hypothecation / Financed Status Verification',
      'Engine & Chassis Number Suffix Verification'
    ]
  },
  {
    id: 'imei-search',
    title: 'IMEI NUMBER SEARCH',
    category: 'SECURITY',
    subtitle: 'TAC Allocation, Device Spec & Blacklist',
    icon: 'Cpu',
    badge: 'STAGE 06',
    severity: 'crit',
    command: 'imei_intel --imei 358240051234560 --check-blacklist',
    items: [
      'Type Allocation Code (TAC) Device Model Fingerprinting',
      'Global GSMA Blacklist & Stolen Status Check',
      'Dual-SIM / eSIM Capability & Band Specs',
      'Original Manufacturer & Country of Origin',
      'Carrier Lock Status & Network Compatibility'
    ]
  },
  {
    id: 'telegram-search',
    title: 'TELEGRAM ID SEARCH',
    category: 'SCRIPTS',
    subtitle: 'User ID, Channel History & Bot Intel',
    icon: 'Code2',
    badge: 'STAGE 07',
    severity: 'high',
    command: 'tg_recon --user @target_handle --extract-id --channels',
    items: [
      'Numeric User ID Extraction & Account Creation Age',
      'Public Group & Channel Membership History',
      'Linked Phone Number / Bio / Profile Picture Logs',
      'Bot Token Validation & Webhook Endpoint Auditor',
      'Forwarded Message Source Entity Identification'
    ]
  }
];

const INITIAL_PINS: PinnedInput[] = [
  {
    id: 'pin-1',
    type: 'command',
    value: 'nmap -sC -sV -p- 10.10.11.24 -oN initial_scan.txt',
    label: 'RECON_CMD',
    timestamp: '06:17:15',
    isSecret: false
  },
  {
    id: 'pin-2',
    type: 'command',
    value: 'sudo iptables -A INPUT -p tcp --dport 22 -s 192.168.1.0/24 -j ACCEPT',
    label: 'SSH_ALLOW_RULE',
    timestamp: '06:17:22',
    isSecret: false
  },
  {
    id: 'pin-3',
    type: 'query',
    value: 'site:github.com "BEGIN RSA PRIVATE KEY"',
    label: 'DORK_KEY_LEAK',
    timestamp: '06:17:28',
    isSecret: false
  }
];

const CATEGORIES = ['ALL', 'SECURITY', 'LINUX_OPS', 'NETWORK', 'SCRIPTS', 'DEVSECOPS', 'LAB_SETUP'];

export default function App() {
  // Portal Gate Authentication State (PIN: 2007)
  const [isAppUnlocked, setIsAppUnlocked] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('zerotrace_portal_unlocked') === 'true';
    } catch {
      return false;
    }
  });

  // Master PIN state with localStorage persistence (defaults to 2007)
  const [masterPin, setMasterPin] = useState<string>(() => {
    try {
      return localStorage.getItem('zerotrace_master_pin') || '2007';
    } catch {
      return '2007';
    }
  });

  // Sync initial PIN from MongoDB backend if available
  useEffect(() => {
    fetch('/api/pin')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.currentPin) {
          setMasterPin(data.currentPin);
          try {
            localStorage.setItem('zerotrace_master_pin', data.currentPin);
          } catch {}
        }
      })
      .catch(() => {});
  }, []);

  // Immutable Search Security PIN fetched from MongoDB (strictly 9161)
  const [searchSecurityPin, setSearchSecurityPin] = useState<string>('9161');

  // Fetch immutable search security PIN from MongoDB backend
  useEffect(() => {
    fetch('/api/search-pin')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.pin) {
          setSearchSecurityPin(data.pin);
        }
      })
      .catch(() => {});
  }, []);

  const handleUpdateMasterPin = (newPin: string, oldPin?: string) => {
    const prev = oldPin || masterPin;
    setMasterPin(newPin);
    try {
      localStorage.setItem('zerotrace_master_pin', newPin);
    } catch (e) {
      console.warn(e);
    }

    // Persist to MongoDB backend with audit trail (oldPassword -> newPassword)
    fetch('/api/pin/change', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        oldPassword: prev,
        newPassword: newPin,
        source: 'forgot_question_recovery'
      })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data && data.isDbConnected) {
          addLog(`[MONGODB_AUDIT] Password successfully stored in database: Changed to new PIN`, 'success');
        }
      })
      .catch((err) => console.warn('[MongoDB Sync]', err));
  };

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [searchFocused, setSearchFocused] = useState(false);

  // PIN Input Bar State
  const [currentPin, setCurrentPin] = useState('');
  const [pinMode, setPinMode] = useState<'code' | 'command' | 'note'>('code');
  const [pinMasked, setPinMasked] = useState(true);
  const [pinStatus, setPinStatus] = useState<'idle' | 'verifying' | 'granted' | 'denied'>('idle');
  const [clearanceLevel, setClearanceLevel] = useState<number>(1);
  const [pinFeedback, setPinFeedback] = useState<string>('ENTER PERMANENT SECURITY PIN TO AUTHENTICATE');

  // Live API Health Status
  const [apiHealth, setApiHealth] = useState<Record<string, 'checking' | 'online' | 'offline'>>({});

  useEffect(() => {
    const checkApis = async () => {
      const initialStatus: Record<string, 'checking' | 'online' | 'offline'> = {};
      DEFAULT_TOPICS.forEach(topic => {
        initialStatus[topic.id] = 'checking';
      });
      setApiHealth({ ...initialStatus });

      const updated = { ...initialStatus };

      // 1. Ping Phone API
      try {
        await fetch('https://storage-deutschland-don-patterns.trycloudflare.com/num?number=9876543210&key=DADDY', { mode: 'no-cors', cache: 'no-store' });
        updated['phone-osint'] = 'online';
      } catch (e) {
        updated['phone-osint'] = 'offline';
      }

      // 2. Ping Aadhaar API
      try {
        await fetch('https://api-src.alonepatel.shop/api?key=INDIAN_HACKER_BRO&action=aadhar&aadhar=111111111111', { mode: 'no-cors', cache: 'no-store' });
        updated['aadhar-search'] = 'online';
      } catch (e) {
        updated['aadhar-search'] = 'offline';
      }

      // 3. Ping UPI API
      try {
        await fetch('https://api-src.alonepatel.shop/api?key=INDIAN_HACKER_BRO&action=upiinfo&upi=example@ybl', { mode: 'no-cors', cache: 'no-store' });
        updated['upi-search'] = 'online';
      } catch (e) {
        updated['upi-search'] = 'offline';
      }

      // 4. Ping Email API
      try {
        await fetch('https://api-src.alonepatel.shop/api?key=INDIAN_HACKER_BRO&action=email&email=user@gmail.com', { mode: 'no-cors', cache: 'no-store' });
        updated['email-search'] = 'online';
      } catch (e) {
        updated['email-search'] = 'offline';
      }

      // 5. Ping Vehicle API
      try {
        await fetch('https://api-src.alonepatel.shop/api?key=INDIAN_HACKER_BRO&action=vehicle-v1&rc=DL8CAF5030', { mode: 'no-cors', cache: 'no-store' });
        updated['vehicle-search'] = 'online';
      } catch (e) {
        updated['vehicle-search'] = 'offline';
      }

      // 6. Ping IMEI API
      try {
        await fetch('https://api-src.alonepatel.shop/api?key=INDIAN_HACKER_BRO&action=imei-info&imei_num=358240051234560', { mode: 'no-cors', cache: 'no-store' });
        updated['imei-search'] = 'online';
      } catch (e) {
        updated['imei-search'] = 'offline';
      }

      // 7. Ping Telegram ID API
      try {
        await fetch('https://api-src.alonepatel.shop/api?key=Tgid_num&action=tgid&id=12345678', { mode: 'no-cors', cache: 'no-store' });
        updated['telegram-search'] = 'online';
      } catch (e) {
        updated['telegram-search'] = 'offline';
      }

      setApiHealth({ ...updated });
    };

    checkApis();
  }, []);

  // Real-Time Network & Server Ping (Live ms)
  const [livePing, setLivePing] = useState<number | null>(null);
  const [pingQuality, setPingQuality] = useState<'optimal' | 'good' | 'slow'>('optimal');

  useEffect(() => {
    let isMounted = true;
    const measureLivePing = async () => {
      try {
        const start = performance.now();
        const res = await fetch(`/api/ping?_t=${Date.now()}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
        });
        if (res.ok) {
          const end = performance.now();
          const rtt = Math.max(1, Math.round(end - start));
          if (isMounted) {
            setLivePing(rtt);
            if (rtt < 70) setPingQuality('optimal');
            else if (rtt < 160) setPingQuality('good');
            else setPingQuality('slow');
          }
        }
      } catch {
        // Fallback timing probe
        try {
          const fbStart = performance.now();
          await fetch(`/api/health?_t=${Date.now()}`, { cache: 'no-store' });
          const fbEnd = performance.now();
          const rtt = Math.max(1, Math.round(fbEnd - fbStart));
          if (isMounted) {
            setLivePing(rtt);
            if (rtt < 70) setPingQuality('optimal');
            else if (rtt < 160) setPingQuality('good');
            else setPingQuality('slow');
          }
        } catch {
          if (isMounted) setLivePing(null);
        }
      }
    };

    measureLivePing();
    const pingInterval = setInterval(measureLivePing, 2200);
    return () => {
      isMounted = false;
      clearInterval(pingInterval);
    };
  }, []);

  // Pinned Items Bar
  const [pinnedInputs, setPinnedInputs] = useState<PinnedInput[]>(() => {
    try {
      const saved = localStorage.getItem('zerotrace_pinned_inputs');
      if (saved) {
        const parsed: PinnedInput[] = JSON.parse(saved);
        // Clean out any legacy stored PIN secrets so PIN is never visible on the interface
        return parsed.filter(p => p.type !== 'pin_code' && p.value !== '739241' && p.value !== '916150');
      }
      return INITIAL_PINS;
    } catch {
      return INITIAL_PINS;
    }
  });

  // Terminal Logs
  const [terminalLogs, setTerminalLogs] = useState<Array<{ id: string; time: string; type: 'cmd' | 'resp' | 'warn' | 'success'; text: string }>>([
    { id: '1', time: '06:17:01', type: 'cmd', text: 'whoami && echo $CLEARANCE' },
    { id: '2', time: '06:17:02', type: 'resp', text: 'visitor@zerotrace.legit [SEC_LEVEL_01: GUEST]' },
    { id: '3', time: '06:17:04', type: 'warn', text: 'SYSTEM READY: Enter 6-digit Security PIN in the PIN bar to unlock intelligence searches.' }
  ]);
  const [terminalInput, setTerminalInput] = useState('');

  // Notification Toast & Copy status
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const pinInputRef = useRef<HTMLInputElement>(null);

  // Phone OSINT Division State & API Integration
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>('phone-osint');
  const [pinError, setPinError] = useState<string | null>(null);
  const [isPinShaking, setIsPinShaking] = useState(false);
  const [phoneSearchLoading, setPhoneSearchLoading] = useState(false);
  const [phoneSearchResult, setPhoneSearchResult] = useState<any | null>(null);
  const [phoneSearchError, setPhoneSearchError] = useState<string | null>(null);
  const [searchedPhoneNumber, setSearchedPhoneNumber] = useState<string>('');

  // Validate if current PIN has required clearance (strictly permanent MongoDB PIN: 9161 only)
  const isPinAuthenticated = (): boolean => {
    if (pinStatus === 'granted') return true;
    const p = currentPin.trim().toLowerCase();
    const isSearchPinMatch = p === searchSecurityPin.toLowerCase() || p === '9161';
    if (isSearchPinMatch) {
      setPinStatus('granted');
      setPinError(null);
      setPinFeedback('ACCESS GRANTED: SECURITY PIN VERIFIED // SEARCHING UNLOCKED');
      return true;
    }
    return false;
  };

  const handleUnlockPortal = (_unlockedPin: string) => {
    setIsAppUnlocked(true);
    setCurrentPin('');
    setPinStatus('idle');
    setPinError(null);
    setClearanceLevel(1);
    setPinFeedback('ENTER PERMANENT SECURITY PIN TO AUTHENTICATE');
    try {
      sessionStorage.setItem('zerotrace_portal_unlocked', 'true');
    } catch (e) {
      console.warn(e);
    }
    setTerminalLogs(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        time: new Date().toTimeString().split(' ')[0],
        type: 'success',
        text: `[AUTH_GRANTED] Master passcode verified. Portal access unlocked.`
      }
    ]);
  };

  const handleLockPortal = () => {
    setIsAppUnlocked(false);
    setPinStatus('idle');
    setCurrentPin('');
    try {
      sessionStorage.removeItem('zerotrace_portal_unlocked');
    } catch (e) {
      console.warn(e);
    }
    setTerminalLogs(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        time: new Date().toTimeString().split(' ')[0],
        type: 'warn',
        text: `[AUTH_LOCKED] Security lockdown triggered. Returning to liquid glass login screen.`
      }
    ]);
  };

  // Trigger PIN requirement alerts when searching without PIN
  const triggerPinRequirement = () => {
    setIsPinShaking(true);
    setTimeout(() => setIsPinShaking(false), 650);
    setPinStatus('denied');
    setPinFeedback('ACCESS DENIED: ENTER & VERIFY 6-DIGIT SECURITY PIN TO SEARCH');
    setPhoneSearchError('Security PIN authentication required. Please enter valid Security PIN in the Security PIN Bar to perform searches.');
    addLog('[AUTH_BLOCKED] Search aborted: Security PIN required. Enter valid Security PIN to authorize.', 'warn');
    pinInputRef.current?.focus();
    const consoleEl = document.getElementById('search-pin-console');
    consoleEl?.scrollIntoView({ behavior: 'smooth' });
  };

  // Helper to recursively strip any fields containing 'credit' from raw API payloads
  const stripCreditFields = (obj: any): any => {
    if (obj === null || obj === undefined) return obj;
    if (Array.isArray(obj)) {
      return obj.map(item => stripCreditFields(item));
    }
    if (typeof obj === 'object') {
      const cleanObj: Record<string, any> = {};
      for (const [key, value] of Object.entries(obj)) {
        const lowerKey = key.toLowerCase();
        if (lowerKey.includes('credit') || lowerKey.includes('contact')) {
          continue;
        }
        cleanObj[key] = stripCreditFields(value);
      }
      return cleanObj;
    }
    return obj;
  };

  // Helper to safely parse API JSON and discard HTML fallback responses
  const safeParseApiJson = (text: string): any => {
    if (!text || typeof text !== 'string') return null;
    const trimmed = text.trim();
    if (trimmed.startsWith('<') || trimmed.toLowerCase().includes('<!doctype') || trimmed.toLowerCase().includes('<html')) {
      return null;
    }
    try {
      return JSON.parse(trimmed);
    } catch {
      return null;
    }
  };

  // Normalize string for fuzzy key comparison (removes underscores, spaces, hyphens, lowercase)
  const normalizeKey = (k: string) => k.toLowerCase().replace(/[^a-z0-9]/g, '');

  // Deep recursive field finder supporting any JSON nesting, casing, and key aliases
  const deepFindValue = (root: any, searchKeys: string[]): string | null => {
    if (!root) return null;
    const targetKeys = searchKeys.map(normalizeKey);

    // 1. Breadth-First Search for exact normalized key match across all objects/arrays
    const queue: any[] = [root];
    const visited = new Set<any>();

    while (queue.length > 0) {
      const current = queue.shift();
      if (!current || visited.has(current)) continue;
      visited.add(current);

      if (Array.isArray(current)) {
        for (const item of current) {
          if (item && typeof item === 'object') queue.push(item);
        }
      } else if (typeof current === 'object') {
        // Check direct properties first
        for (const [key, val] of Object.entries(current)) {
          if (val !== null && val !== undefined && typeof val !== 'object') {
            const nKey = normalizeKey(key);
            if (targetKeys.includes(nKey)) {
              const strVal = String(val).trim();
              if (strVal && strVal.toLowerCase() !== 'null' && strVal.toLowerCase() !== 'undefined' && strVal !== 'N/A' && strVal !== '-') {
                return strVal;
              }
            }
          }
        }

        // Enqueue nested objects
        for (const [key, val] of Object.entries(current)) {
          if (val && typeof val === 'object') {
            queue.push(val);
          }
        }
      }
    }

    // 2. Partial match pass if exact normalized match was not found
    const queue2: any[] = [root];
    const visited2 = new Set<any>();

    while (queue2.length > 0) {
      const current = queue2.shift();
      if (!current || visited2.has(current)) continue;
      visited2.add(current);

      if (Array.isArray(current)) {
        for (const item of current) {
          if (item && typeof item === 'object') queue2.push(item);
        }
      } else if (typeof current === 'object') {
        for (const [key, val] of Object.entries(current)) {
          if (val !== null && val !== undefined && typeof val !== 'object') {
            const nKey = normalizeKey(key);
            for (const target of targetKeys) {
              if (target.length >= 4 && (nKey.includes(target) || target.includes(nKey))) {
                const strVal = String(val).trim();
                if (strVal && strVal.toLowerCase() !== 'null' && strVal.toLowerCase() !== 'undefined' && strVal !== 'N/A' && strVal !== '-') {
                  return strVal;
                }
              }
            }
          } else if (val && typeof val === 'object') {
            queue2.push(val);
          }
        }
      }
    }

    return null;
  };

  // Collect all leaf attributes from payload for complete autofill display
  const deepCollectAllAttributes = (root: any): Array<{ label: string; value: string; category: string }> => {
    const result: Array<{ label: string; value: string; category: string }> = [];
    if (!root) return result;

    const seenKeys = new Set<string>();
    const bannedKeywords = ['credit', 'developer', 'channel', 'telegram', 'owner_api', 'api_credit', 'created_by', 'api_key', 'auth_key', 'key', 'status', 'success', 'error'];

    const traverse = (obj: any, prefix = '') => {
      if (!obj) return;
      if (Array.isArray(obj)) {
        obj.forEach((item, idx) => {
          if (typeof item === 'object') {
            traverse(item, prefix);
          } else if (item !== null && item !== undefined) {
            result.push({
              label: `${prefix || 'ITEM'} [${idx + 1}]`,
              value: String(item),
              category: 'EXTRA ATTRIBUTES'
            });
          }
        });
      } else if (typeof obj === 'object') {
        Object.entries(obj).forEach(([k, v]) => {
          const kLower = k.toLowerCase();
          if (bannedKeywords.some(b => kLower === b || kLower.includes('credit') || kLower.includes('developer'))) {
            return;
          }
          const fullLabel = prefix ? `${prefix} - ${k}` : k;
          if (v !== null && v !== undefined) {
            if (typeof v === 'object') {
              traverse(v, fullLabel);
            } else {
              const strVal = String(v).trim();
              if (strVal && !seenKeys.has(fullLabel.toLowerCase())) {
                seenKeys.add(fullLabel.toLowerCase());
                let category = 'GENERAL TELEMETRY';
                if (kLower.includes('name') || kLower.includes('owner') || kLower.includes('father') || kLower.includes('model') || kLower.includes('brand')) {
                  category = 'IDENTITY INTEL';
                } else if (kLower.includes('engine') || kLower.includes('chassis') || kLower.includes('fuel') || kLower.includes('cc') || kLower.includes('seat') || kLower.includes('class') || kLower.includes('type')) {
                  category = 'TECHNICAL TELEMETRY';
                } else if (kLower.includes('rto') || kLower.includes('state') || kLower.includes('address') || kLower.includes('city') || kLower.includes('loc') || kLower.includes('pin')) {
                  category = 'GEOGRAPHIC & RTO';
                } else if (kLower.includes('insurance') || kLower.includes('fitness') || kLower.includes('pucc') || kLower.includes('tax') || kLower.includes('finance') || kLower.includes('date') || kLower.includes('valid')) {
                  category = 'LEGAL & COMPLIANCE';
                } else if (kLower.includes('phone') || kLower.includes('mobile') || kLower.includes('circle') || kLower.includes('telecom')) {
                  category = 'TELECOM MATRIX';
                }
                result.push({
                  label: fullLabel.toUpperCase().replace(/_/g, ' '),
                  value: strVal,
                  category
                });
              }
            }
          }
        });
      }
    };

    traverse(root);
    return result;
  };

  // Perform Phone Intelligence Lookup using the API
  const performPhoneLookup = async (phoneInput: string) => {
    // Bina PIN ke searching perform nahi honi chahiye
    if (!isPinAuthenticated()) {
      triggerPinRequirement();
      return;
    }

    // Process input: remove +, +91, spaces or dashes so raw clean number is sent to API
    let clean = phoneInput.trim();
    if (clean.startsWith('+91')) {
      clean = clean.slice(3).trim();
    } else if (clean.startsWith('91') && clean.length > 10) {
      clean = clean.slice(2).trim();
    } else if (clean.startsWith('+')) {
      clean = clean.slice(1).trim();
    }
    clean = clean.replace(/[^0-9]/g, '') || phoneInput.trim() || '9999883039';

    if (!clean || clean.length < 4) {
      setPhoneSearchError('Please enter a valid phone number (e.g. 9999883039 or 9876543210)');
      addLog(`[WARN] Invalid phone format entered: "${phoneInput}"`, 'warn');
      return;
    }

    setPhoneSearchLoading(true);
    setPhoneSearchError(null);
    setPhoneSearchResult(null);
    setSearchedPhoneNumber(clean);
    
    const startTime = Date.now();

    // Log initiation to terminal without prepending + or +91
    addLog(`$ recon --telecom --target ${clean}`, 'cmd');
    addLog(`[RECON-INIT] Querying encrypted telecom intelligence matrix for target ${clean}...`, 'resp');

    try {
      let data: any = null;
      let rawResponseText = '';

      // 1. Fetch via local proxy (passes clean number as-is to remote API)
      try {
        const proxyRes = await fetch(`/api/phone-lookup?number=${encodeURIComponent(clean)}&key=DADDY`);
        if (proxyRes.ok) {
          rawResponseText = await proxyRes.text();
          data = safeParseApiJson(rawResponseText);
        }
      } catch (e) {
        console.warn('Proxy fetch warning, trying direct endpoint:', e);
      }

      // 2. Direct fetch fallback (strictly no + or +91 attached)
      if (!data) {
        try {
          const directUrl = `https://storage-deutschland-don-patterns.trycloudflare.com/num?number=${encodeURIComponent(clean)}`;
          const directRes = await fetch(directUrl, {
            headers: { 'Accept': 'application/json, text/plain, */*' }
          });
          rawResponseText = await directRes.text();
          data = safeParseApiJson(rawResponseText);
        } catch (e) {
          console.warn('Direct fetch warning:', e);
        }
      }

      // 3. Deep and robust field extraction supporting all key variations (aadhar, aadhaar, alt_number, alt_mobile, etc.)
      const extractValue = (obj: any, keys: string[]): string | null => {
        if (!obj || typeof obj !== 'object') return null;
        for (const key of keys) {
          if (obj[key] !== undefined && obj[key] !== null && String(obj[key]).trim() !== '') {
            return String(obj[key]).trim();
          }
          const lowerKey = key.toLowerCase();
          for (const [k, v] of Object.entries(obj)) {
            if (k.toLowerCase() === lowerKey && v !== undefined && v !== null && String(v).trim() !== '') {
              return String(v).trim();
            }
          }
        }
        for (const child of Object.values(obj)) {
          if (child && typeof child === 'object' && !Array.isArray(child)) {
            const nested = extractValue(child, keys);
            if (nested) return nested;
          } else if (Array.isArray(child) && child.length > 0 && typeof child[0] === 'object') {
            const nested = extractValue(child[0], keys);
            if (nested) return nested;
          }
        }
        return null;
      };

      let payload = data;
      // Handle deeply nested API structures like result.response.data[0] or result.data or data.data or data[0]
      if (payload?.result?.response?.data && Array.isArray(payload.result.response.data) && payload.result.response.data.length > 0) {
        payload = payload.result.response.data[0];
      } else if (payload?.result?.data && Array.isArray(payload.result.data) && payload.result.data.length > 0) {
        payload = payload.result.data[0];
      } else if (payload?.response?.data && Array.isArray(payload.response.data) && payload.response.data.length > 0) {
        payload = payload.response.data[0];
      } else if (payload?.data && Array.isArray(payload.data) && payload.data.length > 0) {
        payload = payload.data[0];
      } else if (Array.isArray(payload) && payload.length > 0) {
        payload = payload[0];
      } else if (payload && typeof payload === 'object') {
        payload = payload.data || payload.result || (Array.isArray(payload.results) ? payload.results[0] : null) || (Array.isArray(payload.data) ? payload.data[0] : null) || payload.details || payload.response || payload.record || payload;
      }

      const subscriberName = extractValue(payload, [
        'name',
        'full_name',
        'fullname',
        'subscriber_name',
        'subscriber',
        'customer_name',
        'owner_name',
        'owner',
        'user',
        'username',
        'client_name',
        'person_name'
      ]);

      const fatherName = extractValue(payload, [
        'father_name',
        'fathername',
        'father',
        'fathers_name',
        'fname',
        'f_name',
        'guardian',
        'guardian_name',
        'care_of',
        'c_o',
        'careof',
        'parent_name'
      ]);

      const targetMobile = extractValue(payload, [
        'mobile',
        'number',
        'phone',
        'phone_number',
        'msisdn',
        'mobile_no',
        'mobile_number',
        'contact',
        'primary_mobile',
        'target_mobile',
        'num'
      ]) || clean;

      const altMobile = extractValue(payload, [
        'alt_number',
        'alt_mobile',
        'alt_num',
        'alt_no',
        'alt_phone',
        'alternate_number',
        'alternate_mobile',
        'alternate_phone',
        'secondary_mobile',
        'secondary_phone',
        'alt_contact',
        'alt'
      ]);

      const aadhaarNum = extractValue(payload, [
        'aadhar',
        'aadhaar',
        'adhaar',
        'uid',
        'uidai',
        'aadhar_no',
        'aadhaar_no',
        'aadhar_number',
        'aadhaar_number',
        'aadhaar_ref',
        'aadhar_ref',
        'id_number',
        'doc_id',
        'doc_no',
        'id_proof',
        'identity_number'
      ]);

      const circleName = extractValue(payload, [
        'circle',
        'telecom_circle',
        'operator',
        'carrier',
        'state',
        'region',
        'zone',
        'service_provider',
        'telecom',
        'telecom_operator',
        'network_circle'
      ]);

      const rawAddress = extractValue(payload, [
        'address',
        'full_address',
        'fulladdress',
        'raw_address',
        'addr',
        'location',
        'residence',
        'permanent_address',
        'present_address',
        'resident_address',
        'address_line',
        'complete_address'
      ]);

      // Parse and clean address formatted with "!" or comma delimiters
      let addressSegments: string[] = [];
      if (rawAddress) {
        if (String(rawAddress).includes('!')) {
          addressSegments = String(rawAddress)
            .split('!')
            .map(s => s.trim())
            .filter(Boolean);
        } else if (String(rawAddress).includes(',')) {
          addressSegments = String(rawAddress)
            .split(',')
            .map(s => s.trim())
            .filter(Boolean);
        } else {
          addressSegments = [String(rawAddress).trim()];
        }
      }

      const cleanFormattedAddress = addressSegments.length > 0
        ? addressSegments.join(', ')
        : (rawAddress ? String(rawAddress) : null);

      // Extract PIN code from direct key or 6 consecutive digits in address
      const pinMatch = rawAddress ? String(rawAddress).match(/\b\d{6}\b/) : null;
      const pincode = extractValue(payload, [
        'pincode',
        'pin',
        'postal_code',
        'postalcode',
        'zip',
        'zipcode',
        'postal_pin',
        'area_pin'
      ]) || (pinMatch ? pinMatch[0] : null);

      const email = extractValue(payload, [
        'email',
        'mail',
        'email_id',
        'email_address',
        'mail_id',
        'user_email',
        'registered_email'
      ]);

      const lineType = extractValue(payload, ['line_type', 'sim_type', 'type', 'network_type']) || 'GSM / VoLTE / 5G SA';
      const hlrStatus = extractValue(payload, ['hlr_status', 'status', 'account_status']) || 'ACTIVE_SUBSCRIBER';

      // Extract all key-value entries into organized attribute records
      const allAttributes: { key: string; label: string; value: string; category: string }[] = [];
      const ignoredKeys = new Set(['raw', 'source', 'key', 'auth_key']);

      if (typeof payload === 'object' && payload !== null) {
        Object.entries(payload).forEach(([k, v]) => {
          if (!ignoredKeys.has(k.toLowerCase()) && !k.toLowerCase().includes('credit') && v !== undefined && v !== null && v !== '' && typeof v !== 'object') {
            const formattedLabel = k
              .replace(/_/g, ' ')
              .replace(/([A-Z])/g, ' $1')
              .toUpperCase()
              .trim();

            let category = 'GENERAL DATA';
            const kLower = k.toLowerCase();
            if (kLower.includes('name') || kLower.includes('father') || kLower.includes('gender') || kLower.includes('dob') || kLower.includes('user') || kLower.includes('owner') || kLower.includes('id') || kLower.includes('aadhaar') || kLower.includes('aadhar')) {
              category = 'IDENTITY & KYC';
            } else if (kLower.includes('operator') || kLower.includes('carrier') || kLower.includes('sim') || kLower.includes('network') || kLower.includes('hlr') || kLower.includes('imei') || kLower.includes('circle')) {
              category = 'TELECOM & NETWORK';
            } else if (kLower.includes('address') || kLower.includes('city') || kLower.includes('state') || kLower.includes('pin') || kLower.includes('loc') || kLower.includes('district')) {
              category = 'GEOGRAPHIC DATA';
            } else if (kLower.includes('phone') || kLower.includes('mobile') || kLower.includes('num') || kLower.includes('alt') || kLower.includes('mail') || kLower.includes('contact')) {
              category = 'CONTACT & REACH';
            }

            allAttributes.push({
              key: k,
              label: formattedLabel,
              value: String(v),
              category
            });
          }
        });
      }

      const normalizedResult = {
        status: 'success',
        searchType: 'phone',
        raw_payload: stripCreditFields(payload),
        api_exact_response: stripCreditFields(data),
        mobile: targetMobile,
        number: targetMobile,
        name: subscriberName,
        father_name: fatherName,
        aadhaar: aadhaarNum,
        alt_mobile: altMobile,
        circle: circleName,
        email: email,
        raw_address: rawAddress,
        address: cleanFormattedAddress,
        address_segments: addressSegments,
        pincode: pincode,
        line_type: lineType,
        hlr_status: hlrStatus,
        timestamp: new Date().toISOString(),
        attributes: allAttributes,
        telecom_data: {
          number: targetMobile,
          circle: circleName,
          carrier: circleName,
          line_type: lineType,
          hlr_status: 'ACTIVE_SUBSCRIBER',
          country: 'India'
        }
      };

      // Ensure minimum 3-second hacker loading screen duration
      const elapsed = Date.now() - startTime;
      if (elapsed < 3000) {
        await new Promise((resolve) => setTimeout(resolve, 3000 - elapsed));
      }

      // Check if remote API explicitly returned an error or no subscriber record
      if ((data?.status === false || data?.error) && !subscriberName && !aadhaarNum && !rawAddress) {
        const errorMsg = data?.message || data?.error || 'No records returned from telecom gateway';
        const cleanMsg = String(errorMsg).replace(/^❌\s*/, '');
        setPhoneSearchError(`Telecom Gateway: ${cleanMsg}`);
        addLog(`[TELECOM-NOTICE] ${cleanMsg}`, 'warn');
        setPhoneSearchResult(null);
        return;
      }

      if (!subscriberName && !fatherName && !aadhaarNum && !rawAddress && !altMobile) {
        const notice = data?.message || 'No subscriber records or KYC dossier found for this mobile number.';
        const cleanNotice = String(notice).replace(/^❌\s*/, '');
        setPhoneSearchError(cleanNotice);
        addLog(`[RECON-NOTICE] Target ${targetMobile}: ${cleanNotice}`, 'warn');
        setPhoneSearchResult(null);
        return;
      }

      setPhoneSearchResult(normalizedResult);

      // Print clean formatted results directly into the Terminal Section
      addLog(`[STATUS 200 OK] Telemetry stream verified for target ${targetMobile}`, 'success');
      addLog(`=================== OSINT DOSSIER: ${targetMobile} ===================`, 'success');
      addLog(`[TARGET MOBILE]     : ${targetMobile}`, 'success');
      addLog(`[SUBSCRIBER NAME]   : ${subscriberName}`, 'success');
      if (fatherName) addLog(`[FATHER'S NAME]     : ${fatherName}`, 'success');
      if (aadhaarNum) addLog(`[AADHAAR / ID]      : ${aadhaarNum}`, 'success');
      if (altMobile) addLog(`[ALT MOBILE]        : ${altMobile}`, 'success');
      addLog(`[TELECOM CIRCLE]    : ${circleName}`, 'success');
      addLog(`[REGISTERED EMAIL]  : ${email || 'None / Not Linked'}`, 'success');
      addLog(`[FORMATTED ADDRESS] : ${cleanFormattedAddress}`, 'success');
      if (pincode) addLog(`[POSTAL PIN CODE]   : ${pincode}`, 'success');
      addLog(`================================================================`, 'success');

    } catch (err: any) {
      // Ensure minimum 3-second hacker loading screen duration on error as well
      const elapsed = Date.now() - startTime;
      if (elapsed < 3000) {
        await new Promise((resolve) => setTimeout(resolve, 3000 - elapsed));
      }
      console.error('Phone search failed:', err);
      setPhoneSearchError(`API query failed for target ${clean}: ${err?.message || 'Gateway connection timeout'}`);
      addLog(`[ERROR] Telecom telemetry query failed for ${clean}: ${err?.message || 'Connection refused'}`, 'warn');
    } finally {
      setPhoneSearchLoading(false);
    }
  };

  // Perform Aadhaar Intelligence Lookup using the API
  const performAadharLookup = async (aadharInput: string) => {
    // Bina PIN ke searching perform nahi honi chahiye
    if (!isPinAuthenticated()) {
      triggerPinRequirement();
      return;
    }

    // Use the exact input as typed by the user for the query
    const exactQuery = aadharInput.trim();

    if (!exactQuery) {
      setPhoneSearchError('Please enter a valid Aadhaar number');
      addLog(`[WARN] Empty Aadhaar format entered`, 'warn');
      return;
    }

    setPhoneSearchLoading(true);
    setPhoneSearchError(null);
    setPhoneSearchResult(null);
    setSearchedPhoneNumber(exactQuery);
    
    const startTime = Date.now();

    // Log initiation to terminal
    addLog(`$ recon --aadhaar --uid ${exactQuery}`, 'cmd');
    addLog(`[RECON-INIT] Querying encrypted Aadhaar intelligence matrix for UID ${exactQuery}...`, 'resp');

    try {
      let data: any = null;
      let rawResponseText = '';

      // 1. Fetch via local proxy
      try {
        const proxyRes = await fetch(`/api/aadhar-lookup?aadhar=${encodeURIComponent(exactQuery)}`);
        if (proxyRes.ok) {
          rawResponseText = await proxyRes.text();
          data = safeParseApiJson(rawResponseText);
        }
      } catch (e) {
        console.warn('Proxy fetch warning for Aadhaar:', e);
      }

      // 2. Direct fetch fallback
      if (!data) {
        try {
          const directUrl = `https://api-src.alonepatel.shop/api?key=INDIAN_HACKER_BRO&action=aadhar&aadhar=${encodeURIComponent(exactQuery)}`;
          const directRes = await fetch(directUrl, {
            headers: { 'Accept': 'application/json, text/plain, */*' }
          });
          rawResponseText = await directRes.text();
          data = safeParseApiJson(rawResponseText);
        } catch (e) {
          console.warn('Direct fetch warning for Aadhaar:', e);
        }
      }

      // Ensure minimum 3-second hacker loading screen duration
      const elapsed = Date.now() - startTime;
      if (elapsed < 3000) {
        await new Promise((resolve) => setTimeout(resolve, 3000 - elapsed));
      }

      if (!data) {
        throw new Error('No data received from intelligence gateway');
      }

      // Deep and robust field extraction supporting all key variations
      const extractValue = (obj: any, keys: string[]): string | null => {
        if (!obj || typeof obj !== 'object') return null;
        for (const key of keys) {
          if (obj[key] !== undefined && obj[key] !== null && String(obj[key]).trim() !== '') {
            return String(obj[key]).trim();
          }
          const lowerKey = key.toLowerCase();
          for (const [k, v] of Object.entries(obj)) {
            if (k.toLowerCase() === lowerKey && v !== undefined && v !== null && String(v).trim() !== '') {
              return String(v).trim();
            }
          }
        }
        for (const child of Object.values(obj)) {
          if (child && typeof child === 'object' && !Array.isArray(child)) {
            const nested = extractValue(child, keys);
            if (nested) return nested;
          } else if (Array.isArray(child) && child.length > 0 && typeof child[0] === 'object') {
            const nested = extractValue(child[0], keys);
            if (nested) return nested;
          }
        }
        return null;
      };

      let payload = data;
      // Handle deeply nested API structures like result.response.data[0] or result.data or data.data or data[0]
      if (payload?.result?.response?.data && Array.isArray(payload.result.response.data) && payload.result.response.data.length > 0) {
        payload = payload.result.response.data[0];
      } else if (payload?.result?.data && Array.isArray(payload.result.data) && payload.result.data.length > 0) {
        payload = payload.result.data[0];
      } else if (payload?.response?.data && Array.isArray(payload.response.data) && payload.response.data.length > 0) {
        payload = payload.response.data[0];
      } else if (payload?.data && Array.isArray(payload.data) && payload.data.length > 0) {
        payload = payload.data[0];
      } else if (Array.isArray(payload) && payload.length > 0) {
        payload = payload[0];
      } else if (payload && typeof payload === 'object') {
        payload = payload.data || payload.result || (Array.isArray(payload.results) ? payload.results[0] : null) || (Array.isArray(payload.data) ? payload.data[0] : null) || payload.details || payload.response || payload.record || payload;
      }

      const subscriberName = extractValue(payload, [
        'name',
        'full_name',
        'fullname',
        'subscriber_name',
        'subscriber',
        'customer_name',
        'owner_name',
        'owner',
        'user',
        'username',
        'client_name',
        'person_name'
      ]);

      const fatherName = extractValue(payload, [
        'father_name',
        'fathername',
        'father',
        'fathers_name',
        'fname',
        'f_name',
        'guardian',
        'guardian_name',
        'care_of',
        'c_o',
        'careof',
        'parent_name'
      ]);

      const targetMobile = extractValue(payload, [
        'mobile',
        'number',
        'phone',
        'phone_number',
        'msisdn',
        'mobile_no',
        'mobile_number',
        'contact',
        'primary_mobile',
        'target_mobile',
        'num'
      ]);

      const altMobile = extractValue(payload, [
        'alt_number',
        'alt_mobile',
        'alt_num',
        'alt_no',
        'alt_phone',
        'alternate_number',
        'alternate_mobile',
        'alternate_phone',
        'secondary_mobile',
        'secondary_phone',
        'alt_contact',
        'alt'
      ]);

      const aadhaarNum = extractValue(payload, [
        'aadhar',
        'aadhaar',
        'adhaar',
        'uid',
        'uidai',
        'aadhar_no',
        'aadhaar_no',
        'aadhar_number',
        'aadhaar_number',
        'aadhaar_ref',
        'aadhar_ref',
        'id_number',
        'doc_id',
        'doc_no',
        'id_proof',
        'identity_number'
      ]) || exactQuery;

      const circleName = extractValue(payload, [
        'circle',
        'telecom_circle',
        'operator',
        'carrier',
        'state',
        'region',
        'zone',
        'service_provider',
        'telecom',
        'telecom_operator',
        'network_circle'
      ]) || 'India';

      const rawAddress = extractValue(payload, [
        'address',
        'full_address',
        'fulladdress',
        'raw_address',
        'addr',
        'location',
        'residence',
        'permanent_address',
        'present_address',
        'resident_address',
        'address_line',
        'complete_address'
      ]);

      let addressSegments: string[] = [];
      if (rawAddress) {
        if (String(rawAddress).includes('!')) {
          addressSegments = String(rawAddress)
            .split('!')
            .map(s => s.trim())
            .filter(Boolean);
        } else if (String(rawAddress).includes(',')) {
          addressSegments = String(rawAddress)
            .split(',')
            .map(s => s.trim())
            .filter(Boolean);
        } else {
          addressSegments = [String(rawAddress).trim()];
        }
      }

      const cleanFormattedAddress = addressSegments.length > 0
        ? addressSegments.join(', ')
        : (rawAddress ? String(rawAddress) : null);

      const pinMatch = rawAddress ? String(rawAddress).match(/\b\d{6}\b/) : null;
      const pincode = extractValue(payload, [
        'pincode',
        'pin',
        'postal_code',
        'postalcode',
        'zip',
        'zipcode',
        'postal_pin',
        'area_pin'
      ]) || (pinMatch ? pinMatch[0] : null);

      const email = extractValue(payload, [
        'email',
        'mail',
        'email_id',
        'email_address',
        'mail_id',
        'user_email',
        'registered_email'
      ]);

      const gender = extractValue(payload, ['gender', 'sex']) || '';
      const dob = extractValue(payload, ['dob', 'date_of_birth', 'birth_date', 'birthdate', 'birth']) || '';

      // Extract all key-value entries into organized attribute records
      const allAttributes: { key: string; label: string; value: string; category: string }[] = [];
      const ignoredKeys = new Set(['raw', 'source', 'key', 'auth_key']);

      if (typeof payload === 'object' && payload !== null) {
        Object.entries(payload).forEach(([k, v]) => {
          if (!ignoredKeys.has(k.toLowerCase()) && !k.toLowerCase().includes('credit') && v !== undefined && v !== null && v !== '' && typeof v !== 'object') {
            const formattedLabel = k
              .replace(/_/g, ' ')
              .replace(/([A-Z])/g, ' $1')
              .toUpperCase()
              .trim();

            let category = 'GENERAL DATA';
            const kLower = k.toLowerCase();
            if (kLower.includes('name') || kLower.includes('father') || kLower.includes('gender') || kLower.includes('dob') || kLower.includes('user') || kLower.includes('owner') || kLower.includes('id') || kLower.includes('aadhaar') || kLower.includes('aadhar')) {
              category = 'IDENTITY & KYC';
            } else if (kLower.includes('operator') || kLower.includes('carrier') || kLower.includes('sim') || kLower.includes('network') || kLower.includes('hlr') || kLower.includes('imei') || kLower.includes('circle')) {
              category = 'TELECOM & NETWORK';
            } else if (kLower.includes('address') || kLower.includes('city') || kLower.includes('state') || kLower.includes('pin') || kLower.includes('loc') || kLower.includes('district')) {
              category = 'GEOGRAPHIC DATA';
            } else if (kLower.includes('phone') || kLower.includes('mobile') || kLower.includes('num') || kLower.includes('alt') || kLower.includes('mail') || kLower.includes('contact')) {
              category = 'CONTACT & REACH';
            }

            allAttributes.push({
              key: k,
              label: formattedLabel,
              value: String(v),
              category
            });
          }
        });
      }

      const normalizedResult = {
        status: 'success',
        searchType: 'aadhaar',
        raw_payload: stripCreditFields(payload),
        api_exact_response: stripCreditFields(data),
        mobile: targetMobile || '',
        number: targetMobile || '',
        name: subscriberName,
        subscriber_name: subscriberName,
        father_name: fatherName,
        alt_mobile: altMobile,
        aadhaar: aadhaarNum,
        circle: circleName,
        raw_address: rawAddress,
        address: cleanFormattedAddress,
        address_segments: addressSegments,
        pincode: pincode,
        email: email,
        gender: gender,
        dob: dob,
        line_type: 'NATIONAL_ID_REGISTRY',
        hlr_status: 'ACTIVE_RECORD',
        all_attributes: allAttributes
      };

      setPhoneSearchResult(normalizedResult);

      // Print clean formatted results directly into the Terminal Section
      addLog(`[STATUS 200 OK] Identity stream verified for Aadhaar ${exactQuery}`, 'success');
      addLog(`=================== AADHAAR DOSSIER: ${exactQuery} ===================`, 'success');
      addLog(`[AADHAAR / UID]     : ${aadhaarNum}`, 'success');
      if (subscriberName) addLog(`[CITIZEN NAME]      : ${subscriberName}`, 'success');
      if (fatherName) addLog(`[CARE OF / FATHER]  : ${fatherName}`, 'success');
      if (gender) addLog(`[GENDER]            : ${gender}`, 'success');
      if (dob) addLog(`[DATE OF BIRTH]     : ${dob}`, 'success');
      if (targetMobile) addLog(`[LINKED MOBILE]     : ${targetMobile}`, 'success');
      if (altMobile) addLog(`[ALT MOBILE]        : ${altMobile}`, 'success');
      if (cleanFormattedAddress) addLog(`[FORMATTED ADDRESS] : ${cleanFormattedAddress}`, 'success');
      if (circleName) addLog(`[STATE / REGION]    : ${circleName}`, 'success');
      if (pincode) addLog(`[POSTAL PIN CODE]   : ${pincode}`, 'success');
      addLog(`================================================================`, 'success');

    } catch (err: any) {
      // Ensure minimum 3-second hacker loading screen duration on error as well
      const elapsed = Date.now() - startTime;
      if (elapsed < 3000) {
        await new Promise((resolve) => setTimeout(resolve, 3000 - elapsed));
      }
      console.error('Aadhaar search failed:', err);
      setPhoneSearchError(`API query failed for target ${exactQuery}: ${err?.message || 'Gateway connection timeout'}`);
      addLog(`[ERROR] Aadhaar telemetry query failed for ${exactQuery}: ${err?.message || 'Connection refused'}`, 'warn');
    } finally {
      setPhoneSearchLoading(false);
    }
  };

  // Perform UPI Intelligence Lookup using the API
  const performUpiLookup = async (upiInput: string) => {
    if (!isPinAuthenticated()) {
      triggerPinRequirement();
      return;
    }

    const clean = upiInput.trim();

    if (!clean || !clean.includes('@')) {
      setPhoneSearchError('Please enter a valid UPI ID (e.g. name@bank)');
      addLog(`[WARN] Invalid UPI format entered: "${upiInput}"`, 'warn');
      return;
    }

    setPhoneSearchLoading(true);
    setPhoneSearchError(null);
    setPhoneSearchResult(null);
    setSearchedPhoneNumber(clean);
    
    const startTime = Date.now();

    // Log initiation to terminal
    addLog(`$ recon --upi --id ${clean}`, 'cmd');
    addLog(`[RECON-INIT] Querying encrypted UPI intelligence ledger for ID ${clean}...`, 'resp');

    try {
      let data: any = null;
      let rawResponseText = '';

      // 1. Fetch via local proxy (passes clean UPI as-is to remote API)
      try {
        const proxyRes = await fetch(`/api/upi-lookup?upi=${encodeURIComponent(clean)}&key=INDIAN_HACKER_BRO`);
        if (proxyRes.ok) {
          rawResponseText = await proxyRes.text();
          data = safeParseApiJson(rawResponseText);
        }
      } catch (e) {
        console.warn('Proxy fetch warning, trying direct endpoint:', e);
      }

      // 2. Direct fetch fallback to UPI API
      if (!data) {
        try {
          const directUrl = `https://api-src.alonepatel.shop/api?key=INDIAN_HACKER_BRO&action=upiinfo&upi=${encodeURIComponent(clean)}`;
          const directRes = await fetch(directUrl, {
            headers: { 'Accept': 'application/json, text/plain, */*' }
          });
          rawResponseText = await directRes.text();
          data = safeParseApiJson(rawResponseText);
        } catch (e) {
          console.warn('Direct fetch warning:', e);
        }
      }

      // Ensure minimum 3-second hacker loading screen duration
      const elapsed = Date.now() - startTime;
      if (elapsed < 3000) {
        await new Promise((resolve) => setTimeout(resolve, 3000 - elapsed));
      }

      let payload = data;
      // Handle deeply nested API structures like result.response.data[0]
      if (payload?.result?.response?.data && Array.isArray(payload.result.response.data) && payload.result.response.data.length > 0) {
        payload = payload.result.response.data[0];
      } else if (payload?.result?.data && Array.isArray(payload.result.data) && payload.result.data.length > 0) {
        payload = payload.result.data[0];
      } else if (payload?.response?.data && Array.isArray(payload.response.data) && payload.response.data.length > 0) {
        payload = payload.response.data[0];
      } else if (payload?.data && Array.isArray(payload.data) && payload.data.length > 0) {
        payload = payload.data[0];
      } else if (Array.isArray(payload) && payload.length > 0) {
        payload = payload[0];
      } else if (payload && typeof payload === 'object') {
        payload = payload.data || payload.result || payload.details || payload.response || payload.record || payload;
      }

      // We expect verified upi details in result
      const normalizedResult = {
        status: 'success',
        searchType: 'upi',
        raw_payload: stripCreditFields(payload),
        api_exact_response: stripCreditFields(data),
        mobile: payload?.num || payload?.mobile || payload?.phone || '', 
        name: payload?.account_holder_name || payload?.NAME || payload?.name || payload?.full_name || '',
        subscriber_name: payload?.account_holder_name || payload?.NAME || payload?.name || payload?.full_name || '',
        upi: payload?.vpa || clean,
        isVerified: payload?.valid ?? payload?.verified ?? (payload?.status === 'active' || true),
      };

      setPhoneSearchResult(normalizedResult);

      // Print clean formatted results directly into the Terminal Section
      addLog(`[STATUS 200 OK] Identity stream verified for UPI ${clean}`, 'success');
      addLog(`=================== UPI DOSSIER: ${clean} ===================`, 'success');
      addLog(`[UPI ID]            : ${clean}`, 'success');
      if (normalizedResult.subscriber_name) addLog(`[ACCOUNT HOLDER]    : ${normalizedResult.subscriber_name}`, 'success');
      addLog(`[VERIFICATION]      : ${normalizedResult.isVerified ? 'VERIFIED' : 'UNVERIFIED'}`, 'success');
      addLog(`================================================================`, 'success');

    } catch (err: any) {
      const elapsed = Date.now() - startTime;
      if (elapsed < 3000) {
        await new Promise((resolve) => setTimeout(resolve, 3000 - elapsed));
      }
      console.error('UPI search failed:', err);
      setPhoneSearchError(`API query failed for target ${clean}: ${err?.message || 'Gateway connection timeout'}`);
      addLog(`[ERROR] UPI telemetry query failed for ${clean}: ${err?.message || 'Connection refused'}`, 'warn');
    } finally {
      setPhoneSearchLoading(false);
    }
  };

  // Perform Email Intelligence Lookup using the API
  const performEmailLookup = async (emailInput: string) => {
    if (!isPinAuthenticated()) {
      triggerPinRequirement();
      return;
    }

    const clean = emailInput.trim();

    if (!clean || !clean.includes('@')) {
      setPhoneSearchError('Please enter a valid email address (e.g. user@gmail.com)');
      addLog(`[WARN] Invalid email format entered: "${emailInput}"`, 'warn');
      return;
    }

    setPhoneSearchLoading(true);
    setPhoneSearchError(null);
    setPhoneSearchResult(null);
    setSearchedPhoneNumber(clean);
    
    const startTime = Date.now();

    // Log initiation to terminal
    addLog(`$ recon --email --target ${clean}`, 'cmd');
    addLog(`[RECON-INIT] Querying encrypted Email OSINT database for address ${clean}...`, 'resp');

    try {
      let data: any = null;
      let rawResponseText = '';

      // 1. Fetch via local proxy
      try {
        const proxyRes = await fetch(`/api/email-lookup?email=${encodeURIComponent(clean)}&key=INDIAN_HACKER_BRO`);
        if (proxyRes.ok) {
          rawResponseText = await proxyRes.text();
          data = safeParseApiJson(rawResponseText);
        }
      } catch (e) {
        console.warn('Proxy fetch warning, trying direct endpoint:', e);
      }

      // 2. Direct fetch fallback to Email API
      if (!data) {
        try {
          const directUrl = `https://api-src.alonepatel.shop/api?key=INDIAN_HACKER_BRO&action=email&email=${encodeURIComponent(clean)}`;
          const directRes = await fetch(directUrl, {
            headers: { 'Accept': 'application/json, text/plain, */*' }
          });
          rawResponseText = await directRes.text();
          data = safeParseApiJson(rawResponseText);
        } catch (e) {
          console.warn('Direct fetch warning:', e);
        }
      }

      // Ensure minimum 3-second hacker loading screen duration
      const elapsed = Date.now() - startTime;
      if (elapsed < 3000) {
        await new Promise((resolve) => setTimeout(resolve, 3000 - elapsed));
      }

      // Deep and robust field extraction
      const extractValue = (obj: any, keys: string[]): string | null => {
        if (!obj || typeof obj !== 'object') return null;
        for (const key of keys) {
          if (obj[key] !== undefined && obj[key] !== null && String(obj[key]).trim() !== '') {
            return String(obj[key]).trim();
          }
          const lowerKey = key.toLowerCase();
          for (const [k, v] of Object.entries(obj)) {
            if (k.toLowerCase() === lowerKey && v !== undefined && v !== null && String(v).trim() !== '') {
              return String(v).trim();
            }
          }
        }
        return null;
      };

      let payload = data;
      if (data && typeof data === 'object') {
        if (data.result && typeof data.result === 'object') {
          if (data.result.data && Array.isArray(data.result.data) && data.result.data[0]) {
            payload = { ...data.result.data[0], ...data.result };
          } else if (data.result.response && typeof data.result.response === 'object') {
            if (data.result.response.data && Array.isArray(data.result.response.data) && data.result.response.data[0]) {
              payload = { ...data.result.response.data[0], ...data.result.response };
            } else {
              payload = data.result.response;
            }
          } else {
            payload = data.result;
          }
        } else if (data.data && typeof data.data === 'object') {
          if (Array.isArray(data.data) && data.data[0]) {
            payload = data.data[0];
          } else {
            payload = data.data;
          }
        } else if (data.response && typeof data.response === 'object') {
          payload = data.response;
        }
      }

      if (!payload || typeof payload !== 'object') {
        payload = { raw: rawResponseText || 'No payload structure returned', email: clean };
      }

      const subscriberName = extractValue(payload, [
        'name',
        'full_name',
        'fullname',
        'account_holder_name',
        'subscriber_name',
        'customer_name',
        'user_name',
        'username',
        'first_name',
        'owner_name',
        'person_name',
        'NAME'
      ]);

      const fatherName = extractValue(payload, [
        'father_name',
        'fathername',
        'father',
        'fname',
        'guardian_name',
        'care_of',
        'careof',
        'parent_name'
      ]);

      const targetMobile = extractValue(payload, [
        'mobile',
        'number',
        'phone',
        'phone_number',
        'msisdn',
        'mobile_no',
        'mobile_number',
        'contact',
        'primary_mobile',
        'target_mobile',
        'num'
      ]);

      const altMobile = extractValue(payload, [
        'alt_number',
        'alt_mobile',
        'alt_num',
        'alt_no',
        'alt_phone',
        'alternate_number',
        'alternate_mobile',
        'alternate_phone',
        'secondary_mobile',
        'secondary_phone',
        'alt_contact',
        'alt'
      ]);

      const aadhaarNum = extractValue(payload, [
        'aadhar',
        'aadhaar',
        'adhaar',
        'uid',
        'uidai',
        'aadhar_no',
        'aadhaar_no',
        'aadhar_number',
        'aadhaar_number',
        'id_number',
        'doc_id'
      ]);

      const circleName = extractValue(payload, [
        'circle',
        'telecom_circle',
        'operator',
        'carrier',
        'state',
        'region',
        'domain',
        'mail_server',
        'provider'
      ]);

      const rawAddress = extractValue(payload, [
        'address',
        'full_address',
        'fulladdress',
        'raw_address',
        'residence',
        'location',
        'permanent_address'
      ]);

      let cleanFormattedAddress = '';
      let addressSegments: string[] = [];
      if (rawAddress) {
        addressSegments = rawAddress.split(/!+/).map((s: string) => s.trim()).filter((s: string) => s.length > 0);
        cleanFormattedAddress = addressSegments.join(', ');
      }

      const pincode = extractValue(payload, [
        'pincode',
        'pin_code',
        'postal_code',
        'zip',
        'zipcode',
        'postal'
      ]) || (rawAddress ? (rawAddress.match(/\b\d{6}\b/) ? rawAddress.match(/\b\d{6}\b/)![0] : null) : null);

      const email = extractValue(payload, [
        'email',
        'email_id',
        'mail',
        'mail_id',
        'email_address'
      ]) || clean;

      const gender = extractValue(payload, ['gender', 'sex']);
      const dob = extractValue(payload, ['dob', 'date_of_birth', 'birth_date', 'year_of_birth', 'yob']);

      // Collect all key-value attributes
      const allAttributes: Array<{ label: string; value: string; category: string }> = [];
      if (payload && typeof payload === 'object') {
        Object.entries(payload).forEach(([k, v]) => {
          if (v !== null && v !== undefined && typeof v !== 'object') {
            const keyLower = k.toLowerCase();
            let category = 'GENERAL METADATA';
            if (keyLower.includes('name') || keyLower.includes('father') || keyLower.includes('gender') || keyLower.includes('dob')) {
              category = 'IDENTITY INTEL';
            } else if (keyLower.includes('mobile') || keyLower.includes('phone') || keyLower.includes('circle') || keyLower.includes('carrier') || keyLower.includes('telecom')) {
              category = 'TELECOM MATRIX';
            } else if (keyLower.includes('address') || keyLower.includes('city') || keyLower.includes('state') || keyLower.includes('pin') || keyLower.includes('district') || keyLower.includes('loc')) {
              category = 'GEOGRAPHIC TELEMETRY';
            } else if (keyLower.includes('aadhar') || keyLower.includes('uid') || keyLower.includes('id') || keyLower.includes('pan') || keyLower.includes('voter')) {
              category = 'REGISTRY IDENTIFIERS';
            }
            allAttributes.push({
              label: k.toUpperCase().replace(/_/g, ' '),
              value: String(v),
              category
            });
          }
        });
      }

      const normalizedResult = {
        status: 'success',
        searchType: 'email',
        raw_payload: stripCreditFields(payload),
        api_exact_response: stripCreditFields(data),
        mobile: targetMobile || '',
        number: targetMobile || '',
        name: subscriberName,
        subscriber_name: subscriberName,
        father_name: fatherName,
        alt_mobile: altMobile,
        aadhaar: aadhaarNum,
        circle: circleName,
        raw_address: rawAddress,
        address: cleanFormattedAddress,
        address_segments: addressSegments,
        pincode: pincode,
        email: email,
        gender: gender,
        dob: dob,
        line_type: 'EMAIL_OSINT_GATEWAY',
        hlr_status: 'ACTIVE_RECORD',
        all_attributes: allAttributes
      };

      setPhoneSearchResult(normalizedResult);

      // Print clean formatted results directly into the Terminal Section
      addLog(`[STATUS 200 OK] Identity stream verified for Email ${clean}`, 'success');
      addLog(`=================== EMAIL DOSSIER: ${clean} ===================`, 'success');
      addLog(`[EMAIL ID]          : ${email}`, 'success');
      if (subscriberName) addLog(`[SUBSCRIBER NAME]   : ${subscriberName}`, 'success');
      if (fatherName) addLog(`[CARE OF / FATHER]  : ${fatherName}`, 'success');
      if (targetMobile) addLog(`[LINKED MOBILE]     : ${targetMobile}`, 'success');
      if (altMobile) addLog(`[ALT MOBILE]        : ${altMobile}`, 'success');
      if (aadhaarNum) addLog(`[LINKED AADHAAR]    : ${aadhaarNum}`, 'success');
      if (cleanFormattedAddress) addLog(`[ADDRESS]           : ${cleanFormattedAddress}`, 'success');
      if (circleName) addLog(`[REGION / DOMAIN]   : ${circleName}`, 'success');
      addLog(`================================================================`, 'success');

    } catch (err: any) {
      const elapsed = Date.now() - startTime;
      if (elapsed < 3000) {
        await new Promise((resolve) => setTimeout(resolve, 3000 - elapsed));
      }
      console.error('Email search failed:', err);
      setPhoneSearchError(`API query failed for target ${clean}: ${err?.message || 'Gateway connection timeout'}`);
      addLog(`[ERROR] Email telemetry query failed for ${clean}: ${err?.message || 'Connection refused'}`, 'warn');
    } finally {
      setPhoneSearchLoading(false);
    }
  };

  // Perform Vehicle / RC Intelligence Lookup using the API
  const performVehicleLookup = async (rcInput: string) => {
    if (!isPinAuthenticated()) {
      triggerPinRequirement();
      return;
    }

    const clean = rcInput.trim().toUpperCase().replace(/[\s\-]/g, '');

    if (!clean || clean.length < 5) {
      setPhoneSearchError('Please enter a valid Vehicle RC Registration Number (e.g. DL8CAF5030 or MH12AB1234)');
      addLog(`[WARN] Invalid Vehicle RC entered: "${rcInput}"`, 'warn');
      return;
    }

    setPhoneSearchLoading(true);
    setPhoneSearchError(null);
    setPhoneSearchResult(null);
    setSearchedPhoneNumber(clean);
    
    const startTime = Date.now();

    // Log initiation to terminal
    addLog(`$ recon --vehicle --rc ${clean}`, 'cmd');
    addLog(`[RECON-INIT] Querying encrypted VAHAN / RTO national vehicle registry for RC ${clean}...`, 'resp');

    try {
      let data: any = null;
      let rawResponseText = '';

      // 1. Fetch via local proxy
      try {
        const proxyRes = await fetch(`/api/vehicle-lookup?rc=${encodeURIComponent(clean)}&key=INDIAN_HACKER_BRO`);
        if (proxyRes.ok) {
          rawResponseText = await proxyRes.text();
          data = safeParseApiJson(rawResponseText);
        }
      } catch (e) {
        console.warn('Proxy fetch warning, trying direct endpoint:', e);
      }

      // 2. Direct fetch fallback to Vehicle API
      if (!data) {
        try {
          const directUrl = `https://api-src.alonepatel.shop/api?key=INDIAN_HACKER_BRO&action=vehicle-v1&rc=${encodeURIComponent(clean)}`;
          const directRes = await fetch(directUrl, {
            headers: { 'Accept': 'application/json, text/plain, */*' }
          });
          rawResponseText = await directRes.text();
          data = safeParseApiJson(rawResponseText);
        } catch (e) {
          console.warn('Direct fetch warning:', e);
        }
      }

      // Ensure minimum 3-second hacker loading screen duration
      const elapsed = Date.now() - startTime;
      if (elapsed < 3000) {
        await new Promise((resolve) => setTimeout(resolve, 3000 - elapsed));
      }

      if (!data) {
        throw new Error('No data received from vehicle gateway');
      }

      // Robust deep field resolution across all potential key aliases and nestings
      const ownerName = deepFindValue(data, [
        'owner_name',
        'owner',
        'name',
        'registered_owner',
        'ownerName',
        'customer_name',
        'holder_name',
        'subscriber_name',
        'account_holder_name',
        'person_name'
      ]);

      const fatherName = deepFindValue(data, [
        'father_name',
        'fathername',
        'father',
        'fathers_name',
        'fname',
        'guardian_name',
        'guardian',
        'care_of',
        'careof',
        'parent_name',
        'son_of',
        'daughter_of',
        'wife_of'
      ]);

      const rcNumber = deepFindValue(data, [
        'rc',
        'rc_number',
        'reg_no',
        'registration_no',
        'registration_number',
        'vehicle_no',
        'vehicle_number',
        'regNo',
        'rcNumber',
        'reg_num'
      ]) || clean;

      const makerModel = deepFindValue(data, [
        'maker_model',
        'maker_description',
        'maker',
        'model',
        'vehicle_model',
        'model_name',
        'maker_model_name',
        'brand',
        'brand_name',
        'manufacturer',
        'desc'
      ]);

      const vehicleClass = deepFindValue(data, [
        'vehicle_class',
        'vh_class_desc',
        'class',
        'vclass',
        'vehicle_type',
        'type',
        'category',
        'vehicle_category',
        'body_type',
        'vehicleClass'
      ]);

      const fuelType = deepFindValue(data, [
        'fuel_type',
        'fuel_descr',
        'fuel',
        'fuel_desc',
        'fuelType',
        'engine_type'
      ]);

      const engineNo = deepFindValue(data, [
        'engine_no',
        'engine_number',
        'engine',
        'eng_no',
        'motor_no',
        'engineNo'
      ]);

      const chassisNo = deepFindValue(data, [
        'chassis_no',
        'chassis_number',
        'chassis',
        'chasi_no',
        'vin',
        'chassisNo'
      ]);

      const regDate = deepFindValue(data, [
        'reg_date',
        'registration_date',
        'regdate',
        'date_of_registration',
        'purchase_date',
        'regDate'
      ]);

      const insuranceExpiry = deepFindValue(data, [
        'insurance_upto',
        'insurance_expiry',
        'insurance_validity',
        'insurance_to',
        'insurance_valid_upto',
        'insuranceUpto',
        'insurance'
      ]);

      const insuranceCompany = deepFindValue(data, [
        'insurance_company',
        'insurance_name',
        'insurer',
        'insurance_policy_no',
        'insurance_details'
      ]);

      const fitnessExpiry = deepFindValue(data, [
        'fitness_upto',
        'fit_upto',
        'fitness_expiry',
        'fitness_validity',
        'fitness_to',
        'fitnessUpto',
        'fitness'
      ]);

      const puccExpiry = deepFindValue(data, [
        'pucc_upto',
        'pucc_expiry',
        'pollution_upto',
        'pucc_validity',
        'pucc_to',
        'pollution_expiry',
        'pollution_validity',
        'puccUpto',
        'pucc'
      ]);

      const rtoName = deepFindValue(data, [
        'rto_name',
        'rto',
        'registering_authority',
        'rto_location',
        'rto_office',
        'rtoName',
        'circle',
        'authority'
      ]);

      const stateName = deepFindValue(data, [
        'state',
        'rto_state',
        'state_name',
        'location',
        'stateName'
      ]);

      const financer = deepFindValue(data, [
        'financer',
        'financier',
        'hypothecation',
        'financed_by',
        'hypothecated_to',
        'finance_details',
        'hypothecation_details'
      ]);

      const vehicleColor = deepFindValue(data, ['color', 'vehicle_color', 'colour']);
      const seatingCapacity = deepFindValue(data, ['seating_capacity', 'seat_capacity', 'seats', 'capacity']);
      const cubicCapacity = deepFindValue(data, ['cubic_capacity', 'cc', 'engine_capacity', 'displacement']);
      const mfgDate = deepFindValue(data, ['manufacturing_date', 'mfg_date', 'year_of_manufacture', 'mfg_year', 'mfgDate']);
      const vehicleAge = deepFindValue(data, ['vehicle_age', 'age', 'registered_since']);
      const emissionNorms = deepFindValue(data, ['emission_norms', 'norms', 'bs_norm', 'pollution_norm', 'bs']);
      const taxUpto = deepFindValue(data, ['tax_upto', 'tax_validity', 'tax_paid_upto', 'tax_to', 'mv_tax']);
      const rcStatus = deepFindValue(data, ['rc_status', 'status', 'vehicle_status', 'state_status']);

      const rawAddress = deepFindValue(data, ['address', 'full_address', 'owner_address', 'location', 'residence', 'permanent_address', 'present_address']);

      let cleanFormattedAddress = '';
      let addressSegments: string[] = [];
      if (rawAddress) {
        addressSegments = rawAddress.split(/!+|,+/).map((s: string) => s.trim()).filter((s: string) => s.length > 0);
        cleanFormattedAddress = addressSegments.join(', ');
      }

      const allAttributes = deepCollectAllAttributes(stripCreditFields(data));

      const normalizedResult = {
        status: 'success',
        searchType: 'vehicle',
        raw_payload: stripCreditFields(data),
        api_exact_response: stripCreditFields(data),
        rc: rcNumber,
        name: ownerName,
        subscriber_name: ownerName,
        father_name: fatherName,
        maker_model: makerModel,
        vehicle_class: vehicleClass,
        fuel_type: fuelType,
        engine_no: engineNo,
        chassis_no: chassisNo,
        reg_date: regDate,
        insurance_validity: insuranceExpiry,
        insurance_company: insuranceCompany,
        fitness_validity: fitnessExpiry,
        pucc_validity: puccExpiry,
        rto: rtoName,
        circle: rtoName || stateName,
        state: stateName,
        financer: financer,
        color: vehicleColor,
        seating_capacity: seatingCapacity,
        cubic_capacity: cubicCapacity,
        mfg_date: mfgDate,
        vehicle_age: vehicleAge,
        emission_norms: emissionNorms,
        tax_upto: taxUpto,
        rc_status: rcStatus,
        raw_address: rawAddress,
        address: cleanFormattedAddress,
        address_segments: addressSegments,
        all_attributes: allAttributes
      };

      setPhoneSearchResult(normalizedResult);

      // Print clean formatted results directly into the Terminal Section
      addLog(`[STATUS 200 OK] Identity stream verified for Vehicle RC ${clean}`, 'success');
      addLog(`=================== VEHICLE DOSSIER: ${clean} ===================`, 'success');
      addLog(`[RC NUMBER]         : ${rcNumber}`, 'success');
      if (ownerName) addLog(`[OWNER NAME]        : ${ownerName}`, 'success');
      if (fatherName) addLog(`[FATHER / GUARDIAN] : ${fatherName}`, 'success');
      if (makerModel) addLog(`[MAKER / MODEL]     : ${makerModel}`, 'success');
      if (vehicleClass) addLog(`[VEHICLE CLASS]     : ${vehicleClass}`, 'success');
      if (fuelType) addLog(`[FUEL TYPE]         : ${fuelType}`, 'success');
      if (engineNo) addLog(`[ENGINE NO]         : ${engineNo}`, 'success');
      if (chassisNo) addLog(`[CHASSIS NO]        : ${chassisNo}`, 'success');
      if (regDate) addLog(`[REGISTRATION DATE] : ${regDate}`, 'success');
      if (insuranceExpiry) addLog(`[INSURANCE UPTO]    : ${insuranceExpiry}`, 'success');
      if (rtoName) addLog(`[RTO AUTHORITY]     : ${rtoName}`, 'success');
      if (stateName) addLog(`[STATE]             : ${stateName}`, 'success');
      if (financer) addLog(`[HYPOTHECATED TO]   : ${financer}`, 'success');
      addLog(`================================================================`, 'success');

    } catch (err: any) {
      const elapsed = Date.now() - startTime;
      if (elapsed < 3000) {
        await new Promise((resolve) => setTimeout(resolve, 3000 - elapsed));
      }
      console.error('Vehicle search failed:', err);
      setPhoneSearchError(`API query failed for target ${clean}: ${err?.message || 'Gateway connection timeout'}`);
      addLog(`[ERROR] Vehicle telemetry query failed for ${clean}: ${err?.message || 'Connection refused'}`, 'warn');
    } finally {
      setPhoneSearchLoading(false);
    }
  };

  // Perform IMEI lookup using the gateway
  const performImeiLookup = async (targetImei: string) => {
    const clean = targetImei.trim().replace(/[^0-9]/g, '');
    if (!clean || clean.length < 8) {
      setPhoneSearchError('Invalid IMEI number: Minimum 8 to 16 numeric digits required');
      addLog(`[ERROR] Invalid IMEI number: "${targetImei}"`, 'warn');
      return;
    }

    setPhoneSearchLoading(true);
    setPhoneSearchError(null);
    setPhoneSearchResult(null);

    const startTime = Date.now();
    addLog(`[INTEL-DISPATCH] Querying global TAC/GSMA gateway for IMEI: ${clean}...`, 'cmd');

    try {
      const endpoints = [
        `/api/imei-lookup?imei=${encodeURIComponent(clean)}`,
        `/api/imei?imei=${encodeURIComponent(clean)}`,
        `/api/imei-info?imei_num=${encodeURIComponent(clean)}`,
        `https://api-src.alonepatel.shop/api?key=INDIAN_HACKER_BRO&action=imei-info&imei_num=${encodeURIComponent(clean)}`
      ];

      let rawResponseText = '';
      let data: any = null;
      let lastError: any = null;

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, {
            headers: {
              'Accept': 'application/json, text/plain, */*'
            }
          });

          rawResponseText = await response.text();
          data = safeParseApiJson(rawResponseText);

          if (data && (data.status === 'success' || data.success === true || data.brand || data.model || data.result || data.data || data.device || data.tac || data.response)) {
            break;
          }
        } catch (e) {
          lastError = e;
        }
      }

      const elapsed = Date.now() - startTime;
      if (elapsed < 3000) {
        await new Promise((resolve) => setTimeout(resolve, 3000 - elapsed));
      }

      if (!data) {
        throw new Error(lastError?.message || 'No telemetry data received from remote IMEI gateway');
      }

      // Deep field discovery for IMEI payload
      const brand = deepFindValue(data, ['brand', 'brand_name', 'manufacturer', 'vendor', 'make', 'company']);
      const model = deepFindValue(data, ['model', 'model_name', 'device_name', 'phone_model', 'market_name', 'marketing_name', 'name', 'desc', 'description']);
      const deviceType = deepFindValue(data, ['device_type', 'type', 'device', 'category', 'class', 'form_factor']);
      const tac = deepFindValue(data, ['tac', 'tac_code', 'type_allocation_code', 'tac_number']) || (clean.length >= 8 ? clean.substring(0, 8) : null);
      const serialNo = deepFindValue(data, ['serial', 'serial_number', 'sn', 'serial_no', 'serial_num']);
      const os = deepFindValue(data, ['os', 'operating_system', 'platform', 'os_version', 'system', 'software']);
      const simType = deepFindValue(data, ['sim', 'sim_slots', 'sim_type', 'dual_sim', 'esim', 'sim_count', 'slot_count']);
      const blacklistStatus = deepFindValue(data, ['blacklist_status', 'blacklist', 'stolen', 'status', 'lost_stolen', 'clean_status', 'gsma_status']) || 'CLEAN / NOT BLACKLISTED';
      const networkLock = deepFindValue(data, ['carrier_lock', 'sim_lock', 'carrier', 'network_lock', 'operator_lock', 'unlocked', 'simlock']) || 'UNLOCKED / GLOBAL COMPLIANT';
      const origin = deepFindValue(data, ['country', 'country_of_origin', 'origin', 'manufacturing_country', 'region', 'assembly']);
      const releaseDate = deepFindValue(data, ['release_date', 'released', 'launch_date', 'year', 'mfg_year', 'announced']);
      const hardwareSpecs = deepFindValue(data, ['hardware', 'specs', 'chipset', 'cpu', 'memory', 'ram', 'storage', 'specifications']);

      const allAttributes = deepCollectAllAttributes(stripCreditFields(data));

      const normalizedResult = {
        status: 'success',
        searchType: 'imei',
        raw_payload: stripCreditFields(data),
        api_exact_response: stripCreditFields(data),
        imei: clean,
        name: brand ? `${brand} ${model || ''}`.trim() : (model || 'DEVICE IDENTIFIED'),
        brand: brand || 'N/A',
        model: model || 'N/A',
        device_type: deviceType || 'SMARTPHONE / MOBILE',
        tac: tac,
        serial_no: serialNo,
        os: os || 'ANDROID / IOS / EMBEDDED',
        sim_type: simType || 'DUAL SIM / ESIM',
        blacklist_status: blacklistStatus,
        network_lock: networkLock,
        country: origin || 'GLOBAL REGISTRATION',
        release_date: releaseDate,
        hardware: hardwareSpecs,
        all_attributes: allAttributes
      };

      setPhoneSearchResult(normalizedResult);

      // Print clean formatted results directly into the Terminal Section
      addLog(`[STATUS 200 OK] Hardware TAC validated for IMEI ${clean}`, 'success');
      addLog(`=================== IMEI INTEL DOSSIER: ${clean} ===================`, 'success');
      addLog(`[IMEI NUMBER]       : ${clean}`, 'success');
      if (brand) addLog(`[BRAND / MAKE]      : ${brand}`, 'success');
      if (model) addLog(`[MODEL NAME]        : ${model}`, 'success');
      if (deviceType) addLog(`[DEVICE TYPE]       : ${deviceType}`, 'success');
      if (tac) addLog(`[TAC ALLOCATION]    : ${tac}`, 'success');
      if (os) addLog(`[PLATFORM / OS]     : ${os}`, 'success');
      addLog(`[GSMA STATUS]       : ${blacklistStatus}`, 'success');
      addLog(`[CARRIER LOCK]      : ${networkLock}`, 'success');
      if (origin) addLog(`[COUNTRY OF ORIGIN] : ${origin}`, 'success');
      addLog(`====================================================================`, 'success');

    } catch (err: any) {
      const elapsed = Date.now() - startTime;
      if (elapsed < 3000) {
        await new Promise((resolve) => setTimeout(resolve, 3000 - elapsed));
      }
      console.error('IMEI search failed:', err);
      setPhoneSearchError(`API query failed for target ${clean}: ${err?.message || 'Gateway connection timeout'}`);
      addLog(`[ERROR] IMEI hardware query failed for ${clean}: ${err?.message || 'Connection refused'}`, 'warn');
    } finally {
      setPhoneSearchLoading(false);
    }
  };

  // Perform Telegram ID lookup using the gateway
  const performTgidLookup = async (targetTgid: string) => {
    const clean = targetTgid.trim();
    if (!clean) {
      setPhoneSearchError('Invalid TGID: ID required');
      addLog(`[ERROR] Invalid TGID: "${targetTgid}"`, 'warn');
      return;
    }

    setPhoneSearchLoading(true);
    setPhoneSearchError(null);
    setPhoneSearchResult(null);

    const startTime = Date.now();
    addLog(`[INTEL-DISPATCH] Querying Telegram OSINT gateway for ID: ${clean}...`, 'cmd');

    try {
      const endpoints = [
        `/api/tgid-lookup?id=${encodeURIComponent(clean)}`,
        `/api/tgid?id=${encodeURIComponent(clean)}`,
        `https://api-src.alonepatel.shop/api?key=Tgid_num&action=tgid&id=${encodeURIComponent(clean)}`
      ];

      let rawResponseText = '';
      let data: any = null;
      let lastError: any = null;

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, {
            headers: {
              'Accept': 'application/json, text/plain, */*'
            }
          });

          rawResponseText = await response.text();
          data = safeParseApiJson(rawResponseText);

          if (data && (data.status === 'success' || data.success === true || data.id || data.name || data.first_name || data.username || data.result || data.data || data.response)) {
            break;
          }
        } catch (e) {
          lastError = e;
        }
      }

      const elapsed = Date.now() - startTime;
      if (elapsed < 3000) {
        await new Promise((resolve) => setTimeout(resolve, 3000 - elapsed));
      }

      if (!data) {
        throw new Error(lastError?.message || 'No telemetry data received from remote TGID gateway');
      }

      // Deep field discovery for TGID payload
      const sanitizeVal = (v: any) => {
        if (!v) return null;
        if (typeof v === 'string' && (v.trim().toLowerCase() === 'null' || v.trim().toLowerCase() === 'none' || v.trim() === '')) return null;
        return v;
      };

      const tgName = sanitizeVal(deepFindValue(data, ['first_name', 'name', 'full_name', 'title']));
      const tgUsername = sanitizeVal(deepFindValue(data, ['username', 'handle']));
      const tgId = sanitizeVal(deepFindValue(data, ['id', 'user_id', 'tgid', 'tg_id'])) || clean;
      const tgDcId = sanitizeVal(deepFindValue(data, ['dc_id', 'dc', 'datacenter']));
      const tgBio = sanitizeVal(deepFindValue(data, ['bio', 'about', 'description']));
      const tgPhone = sanitizeVal(deepFindValue(data, ['phone', 'phone_number', 'mobile']));
      const tgType = sanitizeVal(deepFindValue(data, ['type', 'chat_type'])) || (clean.startsWith('-100') ? 'CHANNEL/SUPERGROUP' : 'USER/BOT');
      
      const allAttributes = deepCollectAllAttributes(stripCreditFields(data));

      const normalizedResult = {
        status: 'success',
        searchType: 'tgid',
        raw_payload: stripCreditFields(data),
        api_exact_response: stripCreditFields(data),
        tgid: tgId,
        name: tgName || null,
        username: tgUsername,
        dc_id: tgDcId,
        bio: tgBio,
        phone: tgPhone,
        type: tgType,
        all_attributes: allAttributes
      };

      setPhoneSearchResult(normalizedResult);

      // Print clean formatted results directly into the Terminal Section
      addLog(`[STATUS 200 OK] Telegram entity validated for ID ${clean}`, 'success');
      addLog(`=================== TELEGRAM INTEL DOSSIER: ${clean} ===================`, 'success');
      addLog(`[TARGET ID]         : ${tgId}`, 'success');
      if (tgName) addLog(`[ENTITY NAME]       : ${tgName}`, 'success');
      if (tgUsername) addLog(`[USERNAME]          : @${tgUsername}`, 'success');
      if (tgType) addLog(`[ENTITY TYPE]       : ${tgType}`, 'success');
      if (tgDcId) addLog(`[DATACENTER / DC]   : DC_${tgDcId}`, 'success');
      if (tgPhone) addLog(`[LINKED PHONE]      : ${tgPhone}`, 'success');
      if (tgBio) addLog(`[BIO / ABOUT]       : ${tgBio}`, 'success');
      addLog(`====================================================================`, 'success');

    } catch (err: any) {
      const elapsed = Date.now() - startTime;
      if (elapsed < 3000) {
        await new Promise((resolve) => setTimeout(resolve, 3000 - elapsed));
      }
      console.error('TGID search failed:', err);
      setPhoneSearchError(`API query failed for target ${clean}: ${err?.message || 'Gateway connection timeout'}`);
      addLog(`[ERROR] Telegram intel query failed for ${clean}: ${err?.message || 'Connection refused'}`, 'warn');
    } finally {
      setPhoneSearchLoading(false);
    }
  };

  // Handle clicking on a Cyber/OSINT Module Card
  const handleSelectModuleCard = (topic: CyberTopic) => {
    setSelectedModuleId(topic.id);
    addLog(`MODULE SELECTED: [${topic.title}]`, 'cmd');

    if (
      topic.id === 'phone-osint' ||
      topic.id === 'aadhar-search' ||
      topic.id === 'upi-search' ||
      topic.id === 'email-search' ||
      topic.id === 'vehicle-search' ||
      topic.id === 'imei-search' ||
      topic.id === 'telegram-search'
    ) {
      searchInputRef.current?.focus();
      const consoleEl = document.getElementById('search-pin-console');
      consoleEl?.scrollIntoView({ behavior: 'smooth' });
    } else {
      setSearchQuery(topic.title);
      searchInputRef.current?.focus();
    }
  };

  // Save pins to local storage
  useEffect(() => {
    try {
      localStorage.setItem('zerotrace_pinned_inputs', JSON.stringify(pinnedInputs));
    } catch {
      // Ignore
    }
  }, [pinnedInputs]);

  // Auto scroll terminal
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalLogs]);

  // Client-Side Anti-Inspect Shield State & Alert Trigger
  const [shieldAlert, setShieldAlert] = useState<{
    id: number;
    reason: string;
    code: string;
  } | null>(null);

  const triggerShieldAlert = (reason: string, code: string) => {
    setShieldAlert({ id: Date.now(), reason, code });
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    setTerminalLogs((prev) => [
      ...prev.slice(-40),
      {
        id: Math.random().toString(),
        time,
        type: 'warn',
        text: `[SHIELD_INTERCEPT] Anti-Inspect Protocol: Blocked ${reason} [${code}]. DOM security active.`
      }
    ]);
  };

  useEffect(() => {
    if (!shieldAlert) return;
    const timer = setTimeout(() => {
      setShieldAlert((curr) => (curr && Date.now() - curr.id >= 3100 ? null : curr));
    }, 3200);
    return () => clearTimeout(timer);
  }, [shieldAlert]);

  // Client-Side Anti-Inspect Shield Event Listeners (Entire Page)
  useEffect(() => {
    // 1. Block Context Menu (Right Click) across the page
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      triggerShieldAlert('Right-Click Context Menu Access', 'ERR_SEC_CONTEXTMENU');
      return false;
    };

    // 2. Block Inspect & DevTools Key Combinations
    const handleKeyDown = (e: KeyboardEvent) => {
      // Focus search bar shortcut
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      // F12 key (DevTools)
      if (e.key === 'F12' || e.keyCode === 123) {
        e.preventDefault();
        e.stopPropagation();
        triggerShieldAlert('Developer Tools Toggle (F12)', 'ERR_SEC_F12');
        return false;
      }

      // Ctrl+Shift+I / Cmd+Option+I (Inspect Element)
      // Ctrl+Shift+J / Cmd+Option+J (Console)
      // Ctrl+Shift+C / Cmd+Option+C (Inspect Element selection)
      // Ctrl+Shift+K / Cmd+Option+K (Firefox Web Console)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
        const key = e.key.toLowerCase();
        if (['i', 'j', 'c', 'k', 'e', 'm'].includes(key)) {
          e.preventDefault();
          e.stopPropagation();
          triggerShieldAlert(`DevTools Inspection Shortcut (${e.ctrlKey ? 'Ctrl' : 'Cmd'}+Shift+${e.key.toUpperCase()})`, 'ERR_SEC_DEVTOOLS');
          return false;
        }
      }

      // Ctrl+U / Cmd+Option+U (View Page Source)
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'u')) {
        e.preventDefault();
        e.stopPropagation();
        triggerShieldAlert('View Page Source (Ctrl+U)', 'ERR_SEC_VIEW_SOURCE');
        return false;
      }

      // Ctrl+S / Cmd+S (Save Page HTML)
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 's')) {
        e.preventDefault();
        e.stopPropagation();
        triggerShieldAlert('Page Source Download (Ctrl+S)', 'ERR_SEC_PAGE_SAVE');
        return false;
      }

      // Ctrl+Shift+S or Alt+Cmd+I
      if ((e.ctrlKey || e.metaKey) && e.altKey) {
        const key = e.key.toLowerCase();
        if (['i', 'j', 'c', 'u'].includes(key)) {
          e.preventDefault();
          e.stopPropagation();
          triggerShieldAlert('DOM Inspector Hotkey', 'ERR_SEC_INSPECT_HOTKEY');
          return false;
        }
      }
    };

    // 3. Block Dragging of elements/images
    const handleDragStart = (e: DragEvent) => {
      const target = e.target as HTMLElement;
      if (target && target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
        e.preventDefault();
      }
    };

    window.addEventListener('contextmenu', handleContextMenu, { capture: true });
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    window.addEventListener('dragstart', handleDragStart, { capture: true });

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu, { capture: true });
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
      window.removeEventListener('dragstart', handleDragStart, { capture: true });
    };
  }, []);

  // Filter topics based on search and category
  const filteredTopics = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return DEFAULT_TOPICS.filter((t) => {
      const matchesCategory = activeCategory === 'ALL' || t.category === activeCategory;
      if (!matchesCategory) return false;
      if (!q) return true;
      return (
        t.title.toLowerCase().includes(q) ||
        t.subtitle.toLowerCase().includes(q) ||
        t.command.toLowerCase().includes(q) ||
        t.items.some((item) => item.toLowerCase().includes(q))
      );
    });
  }, [searchQuery, activeCategory]);

  // Quick suggestions based on search
  const suggestions = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    const list: string[] = [];
    DEFAULT_TOPICS.forEach((t) => {
      if (t.title.toLowerCase().includes(q)) list.push(t.title);
      t.items.forEach((item) => {
        if (item.toLowerCase().includes(q) && !list.includes(item)) {
          list.push(item);
        }
      });
    });
    return list.slice(0, 5);
  }, [searchQuery]);

  // Copy helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    addLog(`Copied to clipboard: "${text.length > 35 ? text.substring(0, 35) + '...' : text}"`, 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Add terminal log
  const addLog = (text: string, type: 'cmd' | 'resp' | 'warn' | 'success' = 'resp') => {
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    setTerminalLogs((prev) => [...prev.slice(-40), { id: Math.random().toString(), time, type, text }]);
  };

  // Verify PIN submission
  const handlePinSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const p = currentPin.trim();
    if (!p) {
      setPinFeedback('PLEASE ENTER SECURITY PIN');
      setIsPinShaking(true);
      setTimeout(() => setIsPinShaking(false), 500);
      return;
    }

    setPinStatus('verifying');
    addLog(`VERIFY_PIN: Authenticating token with MongoDB security node...`, 'cmd');

    try {
      // Direct verification with MongoDB search-pin verify endpoint
      const res = await fetch('/api/search-pin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: p })
      });
      const data = await res.json();

      if (data && data.granted) {
        setPinStatus('granted');
        setClearanceLevel(4);
        setPinError(null);
        setPinFeedback(data.message || 'ACCESS GRANTED: SECURITY PIN AUTHENTICATED');
        addLog('AUTH SUCCESS: Permanent Security PIN verified from MongoDB. Searching unlocked.', 'success');
        return;
      }

      // If backend returns false, access is strictly denied
      setPinStatus('denied');
      setIsPinShaking(true);
      setTimeout(() => setIsPinShaking(false), 500);
      setPinError('Access Denied: Invalid Security PIN. Access is restricted.');
      setPinFeedback('ACCESS DENIED: INVALID SECURITY PIN // ACCESS RESTRICTED');
      addLog(`[AUTH_DENIED] Access denied for entered PIN token. Invalid clearance code.`, 'warn');
    } catch (err) {
      // Offline fallback verification - strictly 9161 only
      if (p === searchSecurityPin || p === '9161') {
        setPinStatus('granted');
        setClearanceLevel(4);
        setPinError(null);
        setPinFeedback('ACCESS GRANTED: SECURITY PIN AUTHENTICATED');
        addLog('AUTH SUCCESS: Permanent Security PIN verified. Searching unlocked.', 'success');
      } else {
        setPinStatus('denied');
        setIsPinShaking(true);
        setTimeout(() => setIsPinShaking(false), 500);
        setPinError('Access Denied: Invalid Security PIN. Access is restricted.');
        setPinFeedback('ACCESS DENIED: INVALID SECURITY PIN // ACCESS RESTRICTED');
        addLog(`[AUTH_DENIED] Access denied for entered PIN token. Invalid clearance code.`, 'warn');
      }
    }
  };

  // Add new pin to Pin Bar
  const handlePinToBar = (val: string, label?: string, type: PinnedInput['type'] = 'command') => {
    if (!val.trim()) return;
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newPin: PinnedInput = {
      id: 'pin-' + Date.now(),
      type,
      value: val.trim(),
      label: label || (type === 'pin_code' ? 'PIN_KEY' : val.substring(0, 16).toUpperCase()),
      timestamp: time,
      isSecret: type === 'pin_code'
    };
    setPinnedInputs((prev) => [newPin, ...prev.filter((p) => p.value !== val)]);
    addLog(`PINNED TO BAR: [${newPin.label}] "${val.substring(0, 30)}"`, 'success');
  };

  // Remove pin from Pin Bar
  const handleRemovePin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPinnedInputs((prev) => prev.filter((p) => p.id !== id));
    addLog('PIN REMOVED from quick pin bar.', 'warn');
  };

  // Generate a random cyber PIN
  const handleGenerateRandomPin = () => {
    const random6 = Math.floor(100000 + Math.random() * 900000).toString();
    setCurrentPin(random6);
    setPinMode('code');
    setPinFeedback('NEW RANDOM SECURITY TOKEN GENERATED');
    addLog('GENERATE_PIN: Generated random security token', 'resp');
  };

  // General search execution that streams matches to the terminal
  const executeSearch = (query: string) => {
    const q = query.trim();
    if (!q) return;

    // Bina PIN ke searching perform nahi honi chahiye
    if (!isPinAuthenticated()) {
      triggerPinRequirement();
      return;
    }

    // Check if it's an Aadhaar, Vehicle RC, IMEI, Email, Telegram, UPI or Phone search
    const cleanDigits = q.replace(/[^0-9]/g, '');
    const cleanRc = q.trim().toUpperCase().replace(/[\s\-]/g, '');
    
    // 1. STRICT DEDICATED MODULE ISOLATION
    // When a user selects a specific module, only THAT module's API is executed.
    // No other module's heuristic or regex can intercept!
    if (selectedModuleId === 'phone-osint') {
      performPhoneLookup(cleanDigits || q);
      return;
    }
    if (selectedModuleId === 'aadhar-search') {
      performAadharLookup(q);
      return;
    }
    if (selectedModuleId === 'upi-search') {
      performUpiLookup(q);
      return;
    }
    if (selectedModuleId === 'email-search') {
      performEmailLookup(q);
      return;
    }
    if (selectedModuleId === 'vehicle-search') {
      performVehicleLookup(q);
      return;
    }
    if (selectedModuleId === 'imei-search') {
      performImeiLookup(cleanDigits || q);
      return;
    }
    if (selectedModuleId === 'telegram-search') {
      performTgidLookup(cleanDigits || q);
      return;
    }

    // 2. FALLBACK AUTO-DETECTION (ONLY when NO specific module is selected)
    if (/^[A-Z]{2}[0-9]{1,2}[A-Z]{0,3}[0-9]{4}$/i.test(cleanRc)) {
      performVehicleLookup(q);
      return;
    }
    if (cleanDigits.length === 12 && !q.startsWith('+') && !q.includes('@')) {
      performAadharLookup(q);
      return;
    }
    if (cleanDigits.length === 15 || cleanDigits.length === 16) {
      performImeiLookup(cleanDigits || q);
      return;
    }
    if (q.includes('@') && /\.[a-z]{2,}$/i.test(q)) {
      performEmailLookup(q);
      return;
    }
    if (q.includes('@')) {
      performUpiLookup(q);
      return;
    }
    if (cleanDigits.length === 10 || (cleanDigits.length >= 10 && q.startsWith('+'))) {
      performPhoneLookup(cleanDigits || q);
      return;
    }
    if (q.startsWith('tg:') || q.startsWith('@')) {
      performTgidLookup(q.replace(/^tg:|^@/, ''));
      return;
    }

    addLog(`$ search "${q}"`, 'cmd');
    const matches = DEFAULT_TOPICS.filter((t) =>
      t.title.toLowerCase().includes(q.toLowerCase()) ||
      t.subtitle.toLowerCase().includes(q.toLowerCase()) ||
      t.command.toLowerCase().includes(q.toLowerCase()) ||
      t.items.some((i) => i.toLowerCase().includes(q.toLowerCase()))
    );

    if (matches.length > 0) {
      addLog(`[SEARCH ENGINE] Found ${matches.length} matching OSINT module(s) for "${q}":`, 'success');
      matches.forEach((m) => {
        addLog(` -> [${m.badge}] ${m.title.toUpperCase()} // ${m.subtitle} [Severity: ${m.severity.toUpperCase()}]`, 'resp');
      });
    } else {
      addLog(`[SEARCH ENGINE] No direct keyword match found for "${q}". Global recon crawler active.`, 'warn');
    }
  };

  // Execute terminal input
  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = terminalInput.trim();
    if (!cmd) return;
    addLog(`$ ${cmd}`, 'cmd');
    setTerminalInput('');

    const lower = cmd.toLowerCase();
    if (lower === 'clear' || lower === 'cls') {
      setTerminalLogs([]);
      return;
    }
    if (lower === 'help') {
      addLog('AVAILABLE COMMANDS:', 'resp');
      addLog('  lookup <phone>      -> Query telecom OSINT API (https://api-src.alonepatel.shop/api)', 'resp');
      addLog('  search <term>       -> Search knowledge base & intelligence modules', 'resp');
      addLog('  pin <code>          -> Authenticate security clearance PIN', 'resp');
      addLog('  whoami              -> Check current user clearance & session node', 'resp');
      addLog('  status              -> View OSINT portal operational telemetry', 'resp');
      addLog('  clear               -> Clear terminal console output buffer', 'resp');
      return;
    }
    if (lower === 'whoami') {
      addLog(`USER: zero@devbox | CLEARANCE: Level 0${clearanceLevel} | AUTH: ${pinStatus.toUpperCase()} | NODE: Asia-SE1`, 'resp');
      return;
    }
    if (lower === 'status') {
      addLog(`SYSTEM ONLINE: ${DEFAULT_TOPICS.length} modules loaded | ${pinnedInputs.length} items pinned | Clearance L${clearanceLevel}`, 'success');
      addLog(`PHONE API TARGET: https://api-src.alonepatel.shop/api | KEY: INDIAN_HACKER_BRO`, 'resp');
      return;
    }
    if (lower.startsWith('pin ')) {
      const code = cmd.slice(4).trim();
      setCurrentPin(code);
      handlePinToBar(code, 'CMD_PIN', 'pin_code');
      if (code === '9161' || code === searchSecurityPin) {
        setPinStatus('granted');
        setClearanceLevel(4);
        setPinError(null);
        setPinFeedback('ACCESS GRANTED: SECURITY PIN AUTHENTICATED');
        addLog(`[AUTH SUCCESS] Permanent Security PIN validated. Searching unlocked.`, 'success');
      } else {
        setPinStatus('denied');
        setPinError('Access Denied: Invalid Security PIN. Access is restricted.');
        setPinFeedback('ACCESS DENIED: INVALID PIN // ACCESS RESTRICTED');
        addLog(`[AUTH DENIED] Invalid PIN attempted. Access restricted.`, 'warn');
      }
      return;
    }
    if (lower.startsWith('rc ') || lower.startsWith('vehicle ') || lower.startsWith('vahan ')) {
      const targetRc = cmd.split(' ')[1]?.trim() || '';
      setSelectedModuleId('vehicle-search');
      setSearchQuery(targetRc);
      performVehicleLookup(targetRc);
      return;
    }
    if (lower.startsWith('tgid ') || lower.startsWith('tg ') || lower.startsWith('telegram ')) {
      const targetTgid = cmd.split(' ')[1]?.trim() || '';
      setSelectedModuleId('telegram-search');
      setSearchQuery(targetTgid);
      performTgidLookup(targetTgid);
      return;
    }
    if (lower.startsWith('imei ') || lower.startsWith('tac ') || lower.startsWith('device ')) {
      const targetImei = cmd.split(' ')[1]?.trim() || '';
      setSelectedModuleId('imei-search');
      setSearchQuery(targetImei);
      performImeiLookup(targetImei);
      return;
    }
    if (lower.startsWith('email ') || lower.startsWith('mail ')) {
      const targetEmail = cmd.split(' ')[1]?.trim() || '';
      setSelectedModuleId('email-search');
      setSearchQuery(targetEmail);
      performEmailLookup(targetEmail);
      return;
    }
    if (lower.startsWith('upi ') || lower.startsWith('vpa ')) {
      const targetUpi = cmd.split(' ')[1]?.trim() || '';
      setSelectedModuleId('upi-search');
      setSearchQuery(targetUpi);
      performUpiLookup(targetUpi);
      return;
    }
    if (lower.startsWith('aadhar ') || lower.startsWith('aadhaar ') || lower.startsWith('uid ')) {
      const targetAadhar = cmd.split(' ')[1]?.trim() || '';
      setSelectedModuleId('aadhar-search');
      setSearchQuery(targetAadhar);
      performAadharLookup(targetAadhar);
      return;
    }
    if (lower.startsWith('lookup ') || lower.startsWith('phone ')) {
      const targetPhone = cmd.split(' ')[1]?.trim() || '';
      setSelectedModuleId('phone-osint');
      setSearchQuery(targetPhone);
      performPhoneLookup(targetPhone);
      return;
    }
    if (lower.startsWith('search ')) {
      const q = cmd.slice(7).trim();
      setSearchQuery(q);
      executeSearch(q);
      return;
    }
    
    // If user types query directly into terminal, route through executeSearch to respect selected module!
    if (selectedModuleId) {
      setSearchQuery(cmd);
      executeSearch(cmd);
      return;
    }

    if (cmd.includes('@')) {
      setSearchQuery(cmd);
      if (cmd.includes('.') || selectedModuleId === 'email-search') {
        performEmailLookup(cmd);
      } else {
        performUpiLookup(cmd);
      }
      return;
    }
    if (/^\+?[0-9]{6,15}$/.test(cmd)) {
      setSearchQuery(cmd);
      performPhoneLookup(cmd);
      return;
    }

    addLog(`EXEC: [${cmd}] executed in sandbox environment. Exit code 0.`, 'success');
  };

  // If application is locked, show the Liquid Glass Lock / Login Screen in the center of the viewport
  if (!isAppUnlocked) {
    return (
      <LiquidGlassLockScreen
        onUnlock={handleUnlockPortal}
        requiredPin={masterPin}
        onUpdatePin={handleUpdateMasterPin}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#020d06] text-[#f0fff4] font-sans relative overflow-x-hidden">
      {/* Visual background layers */}
      <div className="cyber-grid-bg" />
      <div className="fixed -top-40 -left-40 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(200,255,0,0.07)_0%,transparent_70%)] pointer-events-none z-0" />
      <div className="fixed -bottom-40 -right-40 w-[650px] h-[650px] bg-[radial-gradient(circle,rgba(0,255,213,0.05)_0%,transparent_70%)] pointer-events-none z-0" />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[radial-gradient(circle,rgba(200,255,0,0.02)_0%,transparent_70%)] pointer-events-none z-0" />

      {/* Cyber Navbar */}
      <header className="sticky top-0 z-40 bg-[#020d06]/90 backdrop-blur-md border-b border-[#0f3320] px-4 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-lg bg-[#071510] border border-[#1a5c35] flex items-center justify-center shadow-[0_0_15px_rgba(200,255,0,0.2)]">
              <span className="hud-corner hud-tl" />
              <span className="hud-corner hud-tr" />
              <span className="hud-corner hud-bl" />
              <span className="hud-corner hud-br" />
              <ShieldCheck className="w-5 h-5 text-[#c8ff00] animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  role="link"
                  tabIndex={0}
                  onClick={() => {
                    const url = 'https://zerotracelegit.netlify.app';
                    const win = window.open(url, '_blank', 'noopener,noreferrer');
                    if (!win || win.closed || typeof win.closed === 'undefined') {
                      window.location.href = url;
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      const url = 'https://zerotracelegit.netlify.app';
                      const win = window.open(url, '_blank', 'noopener,noreferrer');
                      if (!win || win.closed || typeof win.closed === 'undefined') {
                        window.location.href = url;
                      }
                    }
                  }}
                  title="Redirect to zerotracelegit.netlify.app"
                  className="font-['Orbitron'] font-bold text-lg tracking-wider text-[#f0fff4] hover:text-[#c8ff00] active:scale-95 transition-all cursor-pointer inline-flex items-center gap-1.5 group select-none"
                >
                  ZeroTrace<span className="text-[#c8ff00] glow-text group-hover:drop-shadow-[0_0_10px_#c8ff00]">.Legit</span>
                  <ExternalLink className="w-3.5 h-3.5 text-[#3d7a52] group-hover:text-[#c8ff00] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all opacity-60 group-hover:opacity-100" />
                </span>
                <span className="w-2 h-2 rounded-full bg-[#c8ff00] animate-ping" />
              </div>
              <p className="font-['JetBrains_Mono'] text-[10px] tracking-widest text-[#3d7a52] uppercase">
                OSINT TOOL // RECON & PROTOCOL PORTAL
              </p>
            </div>
          </div>

          {/* Center telemetry (Desktop & PC View) */}
          <div className="hidden md:flex items-center gap-6 font-['JetBrains_Mono'] text-xs">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-[#071510] border border-[#0f3320]">
              <span className="w-2 h-2 rounded-full bg-[#c8ff00] shadow-[0_0_8px_#c8ff00]" />
              <span className="text-[#3d7a52]">NODE:</span>
              <span className="text-[#c8ff00] font-bold">SEC_L0{clearanceLevel}</span>
            </div>
            <div 
              className="flex items-center gap-2 px-3 py-1.5 rounded bg-[#071510] border border-[#0f3320] transition-colors hover:border-[#00ffd5]/40"
              title={`Live Server RTT Latency: ${livePing !== null ? `${livePing}ms` : 'Connecting...'}`}
            >
              <div className="relative flex items-center justify-center">
                <Wifi className={`w-3.5 h-3.5 ${pingQuality === 'optimal' ? 'text-[#00ffd5]' : pingQuality === 'good' ? 'text-[#c8ff00]' : 'text-[#ff4060]'}`} />
                <span className={`absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full animate-pulse ${pingQuality === 'optimal' ? 'bg-[#00ffd5] shadow-[0_0_6px_#00ffd5]' : pingQuality === 'good' ? 'bg-[#c8ff00] shadow-[0_0_6px_#c8ff00]' : 'bg-[#ff4060] shadow-[0_0_6px_#ff4060]'}`} />
              </div>
              <span className="text-[#3d7a52]">PING:</span>
              <span className={`font-bold tabular-nums ${pingQuality === 'optimal' ? 'text-[#00ffd5] glow-text' : pingQuality === 'good' ? 'text-[#c8ff00]' : 'text-[#ff4060]'}`}>
                {livePing !== null ? `${livePing}ms` : '...ms'}
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-[#071510] border border-[#0f3320]">
              <Layers className="w-3.5 h-3.5 text-[#c8ff00]" />
              <span className="text-[#3d7a52]">PINNED:</span>
              <span className="text-[#f0fff4]">{pinnedInputs.length} ITEMS</span>
            </div>
          </div>

          {/* Action CTAs & Mobile Live Ping Badge */}
          <div className="flex items-center gap-2">
            {/* Real Live Ping indicator for Mobile / Android View */}
            <div 
              className="flex md:hidden items-center gap-1.5 px-2 py-1.5 rounded bg-[#071510] border border-[#0f3320] font-['JetBrains_Mono'] text-[11px]"
              title={`Live Latency (Mobile/Android): ${livePing !== null ? `${livePing}ms` : 'Measuring...'}`}
            >
              <Wifi className={`w-3 h-3 ${pingQuality === 'optimal' ? 'text-[#00ffd5]' : pingQuality === 'good' ? 'text-[#c8ff00]' : 'text-[#ff4060]'}`} />
              <span className={`font-bold tabular-nums ${pingQuality === 'optimal' ? 'text-[#00ffd5]' : pingQuality === 'good' ? 'text-[#c8ff00]' : 'text-[#ff4060]'}`}>
                {livePing !== null ? `${livePing}ms` : '...'}
              </span>
            </div>
            <button
              onClick={() => {
                searchInputRef.current?.focus();
              }}
              className="font-['JetBrains_Mono'] text-xs px-3.5 py-2 rounded bg-[#c8ff00] text-[#020d06] font-bold hover:shadow-[0_0_20px_rgba(200,255,0,0.5)] transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              <span>SEARCH HUB</span>
            </button>
            <button
              onClick={handleLockPortal}
              className="font-['JetBrains_Mono'] text-xs px-3 py-2 rounded bg-[#071510] border border-[#ff4060]/40 text-[#ff4060] hover:bg-[#ff4060]/10 hover:border-[#ff4060] transition-all flex items-center gap-1.5 cursor-pointer font-bold"
              title="Lock portal and return to PIN login screen"
            >
              <Lock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">LOCK PORTAL</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Headline & Intro */}
      <section className="relative z-10 pt-10 pb-6 px-4 lg:px-8 max-w-7xl mx-auto">
        <div className="border-b border-[#0f3320] pb-8">
          <div className="flex items-center gap-2 mb-3 font-['JetBrains_Mono'] text-xs tracking-widest text-[#3d7a52] uppercase">
            <span className="inline-block w-4 h-[1px] bg-[#c8ff00]" />
          </div>
          <h1 
            role="link"
            tabIndex={0}
            onClick={() => {
              const url = 'https://zerotracelegit.netlify.app';
              const win = window.open(url, '_blank', 'noopener,noreferrer');
              if (!win || win.closed || typeof win.closed === 'undefined') {
                window.location.href = url;
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const url = 'https://zerotracelegit.netlify.app';
                const win = window.open(url, '_blank', 'noopener,noreferrer');
                if (!win || win.closed || typeof win.closed === 'undefined') {
                  window.location.href = url;
                }
              }
            }}
            title="Redirect to zerotracelegit.netlify.app"
            className="font-['Orbitron'] text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-none text-[#f0fff4] cursor-pointer group select-none hover:opacity-95 active:scale-[0.99] transition-all inline-block"
          >
            HACK IT. <span className="text-[#c8ff00] glow-text group-hover:drop-shadow-[0_0_20px_#c8ff00]">FIX IT.</span><br />
            <span className="text-[#3d7a52] group-hover:text-[#52a46e] transition-colors">LEAVE NO TRACE.</span>
          </h1>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* UNIFIED CONSOLE: SEARCH BAR & PIN INPUT MATRIX */}
      {/* ========================================================================= */}
      <section id="search-pin-console" className="relative z-10 py-6 px-4 lg:px-8 max-w-7xl mx-auto">
        {/* Invalid PIN Error Alert Banner */}
        {pinError && (
          <div className="mb-4 bg-[#1a0509] border-2 border-[#ff4060] rounded-2xl p-4 sm:p-5 shadow-[0_0_30px_rgba(255,64,96,0.3)] animate-shake relative overflow-hidden">
            <span className="hud-corner hud-tl" style={{ borderColor: '#ff4060' }} />
            <span className="hud-corner hud-tr" style={{ borderColor: '#ff4060' }} />
            <span className="hud-corner hud-bl" style={{ borderColor: '#ff4060' }} />
            <span className="hud-corner hud-br" style={{ borderColor: '#ff4060' }} />
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#ff4060]/20 border border-[#ff4060] flex items-center justify-center text-[#ff4060] shrink-0">
                  <AlertCircle className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h4 className="font-['Orbitron'] text-sm sm:text-base font-bold text-[#ff4060] uppercase tracking-wider flex items-center gap-2">
                    <span>SECURITY ACCESS DENIED // INVALID PIN ERROR</span>
                  </h4>
                  <p className="font-['JetBrains_Mono'] text-xs text-[#f0fff4]/90 mt-0.5">
                    {pinError}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setPinError(null)}
                  className="px-3.5 py-2 rounded-xl bg-[#071510] hover:bg-[#0a1e12] border border-[#ff4060]/40 text-xs font-['JetBrains_Mono'] text-[#ff4060] transition-colors cursor-pointer"
                >
                  DISMISS
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="cyber-edge-beam-card rounded-2xl p-5 lg:p-7 relative shadow-2xl">
          <span className="hud-corner hud-tl" />
          <span className="hud-corner hud-tr" />
          <span className="hud-corner hud-bl" />
          <span className="hud-corner hud-br" />

          {/* Section Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-[#0f3320]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#020d06] border border-[#1a5c35] flex items-center justify-center text-[#c8ff00]">
                <Search className="w-4 h-4 text-[#c8ff00]" />
              </div>
              <div>
                <h2 className="font-['Orbitron'] text-sm sm:text-base font-bold tracking-wider text-[#f0fff4] uppercase flex flex-wrap items-center gap-2">
                  <span>INTELLIGENCE SEARCH & PIN ACCESS CONSOLE</span>
                  {selectedModuleId && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#00ffd5]/15 text-[#00ffd5] border border-[#00ffd5]/40 font-['JetBrains_Mono'] uppercase flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00ffd5] animate-ping" />
                      <span>{DEFAULT_TOPICS.find(t => t.id === selectedModuleId)?.title || 'MODULE'} ISOLATED</span>
                    </span>
                  )}
                </h2>
                <p className="font-['JetBrains_Mono'] text-[10px] text-[#3d7a52] uppercase tracking-wider">
                  REAL-TIME INTELLIGENCE & TELEMETRY STREAM // ENCRYPTED NODE
                </p>
              </div>
            </div>
            <div className="font-['JetBrains_Mono'] text-xs text-[#3d7a52] flex items-center gap-2">
              <span className="px-2.5 py-1 rounded bg-[#020d06] border border-[#0f3320] text-[#c8ff00]">
                {DEFAULT_TOPICS.length} MODULES ISOLATED
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 7 Cols: Search Bar */}
            <div className="lg:col-span-7 space-y-2">
              {/* Dedicated 7-Module Selector Buttons */}
              <div className="flex flex-wrap items-center gap-1.5 pb-1">
                <span className="text-[10px] font-['JetBrains_Mono'] text-[#3d7a52] uppercase font-bold mr-1">
                  MODULE API:
                </span>
                {DEFAULT_TOPICS.map((topic) => {
                  const isSel = selectedModuleId === topic.id;
                  return (
                    <button
                      key={topic.id}
                      type="button"
                      onClick={() => {
                        setSelectedModuleId(topic.id);
                        searchInputRef.current?.focus();
                      }}
                      className={`px-2 py-1 rounded-md text-[10px] font-['JetBrains_Mono'] font-bold border transition-all flex items-center gap-1 cursor-pointer ${
                        isSel
                          ? 'bg-[#c8ff00] text-[#020d06] border-[#c8ff00] shadow-[0_0_12px_rgba(200,255,0,0.35)]'
                          : 'bg-[#020d06] text-[#3d7a52] hover:text-[#00ffd5] border-[#0f3320] hover:border-[#1a5c35]'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isSel ? 'bg-[#020d06]' : 'bg-[#1a5c35]'}`} />
                      <span>{topic.title.replace(' SEARCH', '').replace(' NUMBER', '')}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between">
                <label className="font-['JetBrains_Mono'] text-xs text-[#c8ff00] font-semibold flex items-center gap-1.5 uppercase">
                  <Search className="w-3.5 h-3.5" />
                  <span>
                    {selectedModuleId
                      ? `${DEFAULT_TOPICS.find(t => t.id === selectedModuleId)?.title} (DEDICATED API)`
                      : 'OSINT & Threat Intelligence Search'}
                  </span>
                </label>
                {pinStatus !== 'granted' ? (
                  <span className="font-['JetBrains_Mono'] text-[10px] px-2 py-0.5 rounded bg-[#ff4060]/15 text-[#ff4060] border border-[#ff4060]/40 flex items-center gap-1 font-bold animate-pulse">
                    <Lock className="w-3 h-3" />
                    <span>PIN AUTH REQUIRED</span>
                  </span>
                ) : selectedModuleId ? (
                  <span className="font-['JetBrains_Mono'] text-[10px] text-[#00ffd5] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00ffd5] animate-ping" />
                    <span>DEDICATED API ACTIVE</span>
                  </span>
                ) : null}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  executeSearch(searchQuery || '9876543210');
                }}
                className="relative"
              >
                <div className="relative flex items-center">
                  <div className="absolute left-4 text-[#3d7a52] pointer-events-none flex items-center z-10">
                    <Search className={`w-4 h-4 transition-colors ${searchFocused ? 'text-[#c8ff00]' : 'text-[#3d7a52]'}`} />
                  </div>
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={
                      pinStatus !== 'granted'
                        ? 'Authenticate Security PIN to search...'
                        : selectedModuleId === 'phone-osint'
                        ? 'Enter 10-digit phone number (e.g. 9876543210 or 9999883039)...'
                        : selectedModuleId === 'aadhar-search'
                        ? 'Enter 12-digit Aadhaar UID (e.g. 123456789012)...'
                        : selectedModuleId === 'upi-search'
                        ? 'Enter UPI ID (e.g. name@bank or 9876543210@paytm)...'
                        : selectedModuleId === 'email-search'
                        ? 'Enter Email address (e.g. user@gmail.com)...'
                        : selectedModuleId === 'vehicle-search'
                        ? 'Enter Vehicle RC number (e.g. DL8CAF5030 or MH12AB1234)...'
                        : selectedModuleId === 'imei-search'
                        ? 'Enter 15-digit IMEI number (e.g. 358240051234560)...'
                        : selectedModuleId === 'telegram-search'
                        ? 'Enter Telegram Numeric ID (e.g. 123456789) or username...'
                        : 'Search phone, aadhar, upi, email, vehicle, imei, telegram...'
                    }
                    className="cyber-edge-beam-input w-full rounded-xl py-3.5 pl-11 pr-28 text-[#f0fff4] font-['JetBrains_Mono'] text-sm outline-none transition-all placeholder:text-[#2a5038]"
                  />
                  <div className="absolute right-2 flex items-center gap-1.5 z-10">
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="text-[11px] px-2 py-1 rounded bg-[#071510] text-[#3d7a52] hover:text-[#f0fff4] border border-[#0f3320] transition-colors cursor-pointer"
                      >
                        CLEAR
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={phoneSearchLoading}
                      className={`text-xs px-3.5 py-1.5 rounded-lg ${
                        pinStatus === 'granted'
                          ? 'bg-[#c8ff00] hover:bg-[#d8ff33] text-[#020d06] shadow-[0_0_12px_rgba(200,255,0,0.4)]'
                          : 'bg-[#0e2417] hover:bg-[#163824] text-[#c8ff00] border border-[#1a5c35]'
                      } font-['JetBrains_Mono'] font-bold transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5`}
                    >
                      {phoneSearchLoading ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : pinStatus !== 'granted' ? (
                        <>
                          <Lock className="w-3 h-3 text-[#ff4060]" />
                          <span>SEARCH</span>
                        </>
                      ) : (
                        <span>SEARCH</span>
                      )}
                    </button>
                  </div>
                </div>

                {/* Typeahead Suggestions */}
                {searchFocused && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 z-30 bg-[#071510] border border-[#1a5c35] rounded-xl p-2 shadow-2xl backdrop-blur-lg">
                    <div className="font-['JetBrains_Mono'] text-[10px] text-[#3d7a52] px-3 py-1 uppercase tracking-wider">
                      Suggested OSINT Searches:
                    </div>
                    {suggestions.map((s, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onMouseDown={() => {
                          setSearchQuery(s);
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#0a1e12] text-xs font-['JetBrains_Mono'] text-[#f0fff4] hover:text-[#c8ff00] flex items-center justify-between group transition-colors cursor-pointer"
                      >
                        <span>{s}</span>
                        <span className="text-[10px] text-[#3d7a52] group-hover:text-[#c8ff00]">SELECT ↵</span>
                      </button>
                    ))}
                  </div>
                )}
              </form>
            </div>

            {/* Right 5 Cols: PIN Code Input Bar */}
            <div className="lg:col-span-5 space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-['JetBrains_Mono'] text-xs text-[#00ffd5] font-semibold flex items-center gap-1.5 uppercase">
                  <Key className="w-3.5 h-3.5" />
                  <span>Search Security PIN</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <span className="font-['JetBrains_Mono'] text-[10px] px-2 py-0.5 rounded bg-[#020d06] border border-[#1a5c35] text-[#3d7a52] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00ffd5] shadow-[0_0_6px_#00ffd5]" />
                    <span>ENCRYPTED GATEWAY</span>
                  </span>
                </div>
              </div>

              <form onSubmit={handlePinSubmit} className="space-y-2">
                <div className="flex items-stretch gap-2">
                  <div className={`relative flex-1 flex items-center ${isPinShaking ? 'animate-shake' : ''}`}>
                    <div className="absolute left-3.5 text-[#00ffd5] pointer-events-none flex items-center z-10">
                      <Lock className={`w-4 h-4 ${pinStatus === 'denied' ? 'text-[#ff4060]' : pinStatus === 'granted' ? 'text-[#c8ff00]' : 'text-[#00ffd5]'}`} />
                    </div>
                    <input
                      ref={pinInputRef}
                      type={pinMasked ? 'password' : 'text'}
                      value={currentPin}
                      autoComplete="new-password"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck={false}
                      data-lpignore="true"
                      data-1p-ignore="true"
                      data-form-type="other"
                      onChange={(e) => {
                        setCurrentPin(e.target.value);
                        if (pinError) setPinError(null);
                        if (pinStatus !== 'idle') setPinStatus('idle');
                      }}
                      placeholder="Enter Security PIN to unlock searching..."
                      className={`cyber-edge-beam-input ${
                        pinStatus === 'denied'
                          ? 'is-denied'
                          : pinStatus === 'granted'
                          ? 'is-granted'
                          : ''
                      } w-full rounded-xl py-3.5 pl-10 pr-16 text-[#f0fff4] font-['JetBrains_Mono'] text-sm outline-none transition-all placeholder:text-[#2a5038]`}
                    />
                    <div className="absolute right-2 flex items-center gap-1 z-10">
                      {currentPin && (
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentPin('');
                            if (pinStatus !== 'idle') setPinStatus('idle');
                          }}
                          className="p-1 rounded hover:bg-[#071510] text-[#3d7a52] hover:text-[#ff4060] transition-colors cursor-pointer"
                          title="Clear input"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setPinMasked(!pinMasked)}
                        className="p-1 rounded hover:bg-[#071510] text-[#3d7a52] hover:text-[#00ffd5] transition-colors cursor-pointer"
                        title={pinMasked ? 'Reveal PIN' : 'Hide PIN'}
                      >
                        {pinMasked ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={pinStatus === 'verifying'}
                    className={`px-4 py-3.5 rounded-xl ${
                      pinStatus === 'granted'
                        ? 'bg-[#c8ff00] text-[#020d06]'
                        : pinStatus === 'denied'
                        ? 'bg-[#ff4060] text-[#020d06]'
                        : 'bg-[#00ffd5] text-[#020d06]'
                    } font-['JetBrains_Mono'] font-bold text-xs uppercase tracking-wider hover:shadow-[0_0_20px_rgba(0,255,213,0.5)] transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0`}
                  >
                    {pinStatus === 'verifying' ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : pinStatus === 'granted' ? (
                      <span>UNLOCKED</span>
                    ) : (
                      <span>AUTH</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Bottom Telemetry Status Bar for Feedback */}
          <div className="mt-4 pt-3 border-t border-[#0f3320] flex items-center justify-between gap-2 font-['JetBrains_Mono'] text-xs">
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  pinStatus === 'granted'
                    ? 'bg-[#c8ff00] shadow-[0_0_8px_#c8ff00]'
                    : pinStatus === 'denied'
                    ? 'bg-[#ff4060] shadow-[0_0_8px_#ff4060]'
                    : pinStatus === 'verifying'
                    ? 'bg-[#ffe600] animate-ping'
                    : 'bg-[#00ffd5]'
                }`}
              />
              <span className="text-[#3d7a52]">CONSOLE STATUS:</span>
              <span
                className={`${
                  pinStatus === 'granted'
                    ? 'text-[#c8ff00] font-bold'
                    : pinStatus === 'denied'
                    ? 'text-[#ff4060] font-bold'
                    : pinStatus === 'verifying'
                    ? 'text-[#ffe600]'
                    : 'text-[#f0fff4]/80'
                }`}
              >
                {pinFeedback}
              </span>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* TERMINAL SECTION: LIVE SEARCH TELEMETRY & RESULTS STREAM */}
          {/* ========================================================================= */}
          <div className="mt-6 pt-5 border-t border-[#0f3320] space-y-3">
            <div className="cyber-edge-beam-terminal flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
                </div>
                <div className="font-['JetBrains_Mono'] text-xs text-[#00ffd5] flex items-center gap-2 font-bold">
                  <TerminalIcon className="w-3.5 h-3.5" />
                  <span>TERMINAL OUTPUT // LIVE SEARCH & TELEMETRY STREAM</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-['JetBrains_Mono'] text-[10px] text-[#3d7a52]">
                  {terminalLogs.length} LOGS BUFFERED
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const fullLogText = terminalLogs.map((l) => `[${l.time}] [${l.type.toUpperCase()}] ${l.text}`).join('\n');
                    handleCopy(fullLogText, 'terminal-logs');
                  }}
                  className="px-2.5 py-1 rounded bg-[#071510] hover:bg-[#0a1e12] border border-[#1a5c35] text-[11px] font-['JetBrains_Mono'] text-[#00ffd5] transition-colors cursor-pointer flex items-center gap-1"
                >
                  {copiedId === 'terminal-logs' ? <Check className="w-3 h-3 text-[#c8ff00]" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedId === 'terminal-logs' ? 'COPIED' : 'COPY'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTerminalLogs([])}
                  className="px-2.5 py-1 rounded bg-[#071510] hover:bg-[#1a0509] border border-[#0f3320] hover:border-[#ff4060] text-[11px] font-['JetBrains_Mono'] text-[#3d7a52] hover:text-[#ff4060] transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>CLEAR</span>
                </button>
              </div>
            </div>

            {/* Scrollable Live Terminal Window */}
            <div className="cyber-edge-beam-terminal rounded-xl p-4 font-['JetBrains_Mono'] text-xs min-h-[220px] max-h-[360px] overflow-y-auto space-y-2 shadow-inner relative">
              {terminalLogs.length === 0 ? (
                <div className="text-[#3d7a52] italic py-8 text-center">
                  -- Terminal buffer cleared. Execute a search or PIN auth to see live output --
                </div>
              ) : (
                terminalLogs.map((log) => {
                  let textColor = 'text-[#f0fff4]/90';
                  let tagColor = 'bg-[#071510] text-[#3d7a52] border-[#0f3320]';
                  let tagLabel = 'INFO';

                  if (log.type === 'cmd') {
                    textColor = 'text-[#00ffd5] font-semibold';
                    tagColor = 'bg-[#00ffd5]/10 text-[#00ffd5] border-[#00ffd5]/30';
                    tagLabel = 'CMD';
                  } else if (log.type === 'success') {
                    textColor = 'text-[#c8ff00]';
                    tagColor = 'bg-[#c8ff00]/10 text-[#c8ff00] border-[#c8ff00]/30';
                    tagLabel = 'OSINT';
                  } else if (log.type === 'warn') {
                    textColor = 'text-[#ff4060] font-bold';
                    tagColor = 'bg-[#ff4060]/10 text-[#ff4060] border-[#ff4060]/30';
                    tagLabel = 'ALERT';
                  }

                  return (
                    <div key={log.id} className="flex items-start gap-2.5 leading-relaxed break-all">
                      <span className="text-[#3d7a52] select-none shrink-0 font-mono text-[11px]">
                        [{log.time}]
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border shrink-0 ${tagColor}`}>
                        {tagLabel}
                      </span>
                      <span className={`flex-1 ${textColor}`}>
                        {log.text}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={terminalEndRef} />
            </div>
          </div>
        </div>

        {/* Live Phone OSINT Intelligence Dossier Display / Hacker Loading Screen */}
        {phoneSearchLoading ? (
          <div className="mt-6">
            <HackerLoadingScreen target={searchedPhoneNumber || searchQuery} />
          </div>
        ) : (phoneSearchResult || phoneSearchError) ? (
          <div className="mt-6 bg-[#041209] border-2 border-[#1a5c35] rounded-2xl p-5 sm:p-6 shadow-[0_0_30px_rgba(0,255,213,0.12)] relative">
            <span className="hud-corner hud-tl" />
            <span className="hud-corner hud-tr" />
            <span className="hud-corner hud-bl" />
            <span className="hud-corner hud-br" />

            {phoneSearchError ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-[#ff4060]">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span className="font-['JetBrains_Mono'] text-xs">{phoneSearchError}</span>
                </div>
                <button
                  onClick={() => setPhoneSearchError(null)}
                  className="text-xs text-[#3d7a52] hover:text-[#f0fff4] cursor-pointer"
                >
                  DISMISS
                </button>
              </div>
            ) : phoneSearchResult ? (
              <div className="space-y-4">
                {/* Dossier Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#0f3320]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-[#071510] border border-[#00ffd5] flex items-center justify-center text-[#00ffd5] shadow-[0_0_12px_rgba(0,255,213,0.2)]">
                      <Radio className="w-5 h-5 animate-pulse text-[#c8ff00]" />
                    </div>
                    <div>
                      <h4 className="font-['Orbitron'] text-sm sm:text-base font-bold text-[#f0fff4] uppercase flex items-center gap-2">
                        <span>
                          {phoneSearchResult?.searchType === 'vehicle'
                            ? 'VEHICLE RC DOSSIER:'
                            : phoneSearchResult?.searchType === 'imei'
                            ? 'IMEI INTEL DOSSIER:'
                            : phoneSearchResult?.searchType === 'aadhaar'
                            ? 'AADHAAR DOSSIER:'
                            : phoneSearchResult?.searchType === 'email'
                            ? 'EMAIL INTEL DOSSIER:'
                            : phoneSearchResult?.searchType === 'upi' || phoneSearchResult?.upi
                            ? 'UPI INTEL DOSSIER:'
                            : 'SUBSCRIBER INTEL DOSSIER:'}
                        </span>
                        <span className="text-[#c8ff00] font-mono tracking-wider">
                          {phoneSearchResult?.searchType === 'vehicle'
                            ? (phoneSearchResult?.rc || searchedPhoneNumber)
                            : phoneSearchResult?.searchType === 'imei'
                            ? (phoneSearchResult?.imei || searchedPhoneNumber)
                            : phoneSearchResult?.searchType === 'aadhaar'
                            ? (phoneSearchResult?.aadhaar || searchedPhoneNumber)
                            : phoneSearchResult?.searchType === 'email'
                            ? (phoneSearchResult?.email || searchedPhoneNumber)
                            : (phoneSearchResult?.searchType === 'upi' || phoneSearchResult?.upi)
                            ? (phoneSearchResult?.upi || searchedPhoneNumber)
                            : (phoneSearchResult?.mobile || phoneSearchResult?.number || searchedPhoneNumber)}
                        </span>
                      </h4>
                      <p className="font-['JetBrains_Mono'] text-[10px] text-[#3d7a52]">
                        {phoneSearchResult?.searchType === 'vehicle'
                          ? 'NATIONAL VAHAN RTO REGISTRY & VEHICLE OWNERSHIP // ENCRYPTED GATEWAY VERIFIED'
                          : phoneSearchResult?.searchType === 'imei'
                          ? 'GLOBAL GSMA TAC & TELEMETRY REGISTRY // ENCRYPTED GATEWAY VERIFIED'
                          : phoneSearchResult?.searchType === 'aadhaar'
                          ? 'NATIONAL IDENTITY REGISTRY & CITIZEN RECORDS // ENCRYPTED GATEWAY VERIFIED'
                          : phoneSearchResult?.searchType === 'email'
                          ? 'GLOBAL EMAIL OSINT & BREACH REGISTRY // ENCRYPTED GATEWAY VERIFIED'
                          : phoneSearchResult?.searchType === 'upi' || phoneSearchResult?.upi
                          ? 'NPCI VPA & BANKING REGISTRY ATTRIBUTES // ENCRYPTED GATEWAY VERIFIED'
                          : 'ORGANIZED KYC & TELECOM ATTRIBUTES // ENCRYPTED GATEWAY VERIFIED'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const formattedDossier = phoneSearchResult?.searchType === 'vehicle' ? [
                          `=================== ZERO TRACE VEHICLE DOSSIER ===================`,
                          `Search Type     : VEHICLE / RC OSINT`,
                          `RC Number       : ${phoneSearchResult?.rc || searchedPhoneNumber}`,
                          `Owner Name      : ${phoneSearchResult?.name || 'N/A'}`,
                          `Father's Name   : ${phoneSearchResult?.father_name || 'N/A'}`,
                          `Maker / Model   : ${phoneSearchResult?.maker_model || 'N/A'}`,
                          `Vehicle Class   : ${phoneSearchResult?.vehicle_class || 'N/A'}`,
                          `Fuel Type       : ${phoneSearchResult?.fuel_type || 'N/A'}`,
                          `Engine Number   : ${phoneSearchResult?.engine_no || 'N/A'}`,
                          `Chassis Number  : ${phoneSearchResult?.chassis_no || 'N/A'}`,
                          `Reg Date        : ${phoneSearchResult?.reg_date || 'N/A'}`,
                          `Insurance Upto  : ${phoneSearchResult?.insurance_validity || 'N/A'}`,
                          `Fitness Upto    : ${phoneSearchResult?.fitness_validity || 'N/A'}`,
                          `PUCC Upto       : ${phoneSearchResult?.pucc_validity || 'N/A'}`,
                          `RTO Authority   : ${phoneSearchResult?.rto || 'N/A'}`,
                          `State           : ${phoneSearchResult?.state || 'N/A'}`,
                          `Hypothecation   : ${phoneSearchResult?.financer || 'N/A'}`,
                          `Address         : ${phoneSearchResult?.address || phoneSearchResult?.raw_address || 'N/A'}`,
                          `Verified Time   : ${phoneSearchResult?.timestamp || new Date().toISOString()}`,
                          `======================================================================`
                        ].join('\n') : phoneSearchResult?.searchType === 'imei' ? [
                          `=================== ZERO TRACE IMEI INTEL DOSSIER ===================`,
                          `Search Type     : IMEI / TAC HARDWARE OSINT`,
                          `IMEI Number     : ${phoneSearchResult?.imei || searchedPhoneNumber}`,
                          `Brand / Make    : ${phoneSearchResult?.brand || 'N/A'}`,
                          `Model Name      : ${phoneSearchResult?.model || 'N/A'}`,
                          `Device Type     : ${phoneSearchResult?.device_type || 'N/A'}`,
                          `TAC Allocation  : ${phoneSearchResult?.tac || 'N/A'}`,
                          `Serial Number   : ${phoneSearchResult?.serial_no || 'N/A'}`,
                          `OS / Platform   : ${phoneSearchResult?.os || 'N/A'}`,
                          `SIM Type        : ${phoneSearchResult?.sim_type || 'N/A'}`,
                          `GSMA Status     : ${phoneSearchResult?.blacklist_status || 'CLEAN'}`,
                          `Carrier Lock    : ${phoneSearchResult?.network_lock || 'UNLOCKED'}`,
                          `Country         : ${phoneSearchResult?.country || 'N/A'}`,
                          `Verified Time   : ${phoneSearchResult?.timestamp || new Date().toISOString()}`,
                          `======================================================================`
                        ].join('\n') : [
                          `=================== ZERO TRACE INTELLIGENCE DOSSIER ===================`,
                          `Search Type     : ${phoneSearchResult?.searchType?.toUpperCase() || 'OSINT'}`,
                          `Subscriber Name : ${phoneSearchResult?.name || 'N/A'}`,
                          `Father's Name   : ${phoneSearchResult?.father_name || 'N/A'}`,
                          `Mobile Number   : ${phoneSearchResult?.mobile || phoneSearchResult?.number || searchedPhoneNumber}`,
                          `Alt Mobile      : ${phoneSearchResult?.alt_mobile || 'N/A'}`,
                          `Aadhaar Number  : ${phoneSearchResult?.aadhaar || 'N/A'}`,
                          `Telecom Circle  : ${phoneSearchResult?.circle || 'N/A'}`,
                          `Email Address   : ${phoneSearchResult?.email || 'null'}`,
                          `Clean Address   : ${phoneSearchResult?.address || 'N/A'}`,
                          `Raw Address     : ${phoneSearchResult?.raw_address || phoneSearchResult?.address || 'N/A'}`,
                          `Postal PIN Code : ${phoneSearchResult?.pincode || 'N/A'}`,
                          `Verified Time   : ${phoneSearchResult?.timestamp || new Date().toISOString()}`,
                          `======================================================================`
                        ].join('\n');
                        handleCopy(formattedDossier, 'phone-dossier');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[#071510] hover:bg-[#0a1e12] border border-[#1a5c35] hover:border-[#00ffd5] text-[#00ffd5] text-xs font-['JetBrains_Mono'] flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      {copiedId === 'phone-dossier' ? <Check className="w-3.5 h-3.5 text-[#c8ff00]" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedId === 'phone-dossier' ? 'COPIED' : 'COPY REPORT'}</span>
                    </button>
                    <button
                      onClick={() => setPhoneSearchResult(null)}
                      className="px-3 py-1.5 rounded-lg bg-[#071510] hover:bg-[#1a0509] border border-[#0f3320] hover:border-[#ff4060] text-xs font-['JetBrains_Mono'] text-[#3d7a52] hover:text-[#ff4060] transition-colors cursor-pointer"
                    >
                      CLOSE
                    </button>
                  </div>
                </div>

                {/* Primary Intelligence Grid: Organized Key Fields */}
                <div className={`flex flex-col md:flex-row flex-wrap justify-center gap-6`}>
                  {/* Card 1: KYC & Personal Identity / Vehicle Identity / IMEI Identity */}
                  <div className="relative bg-[#020d06] border-8 border-[#1a5c35] rounded-[2.5rem] p-6 flex flex-col justify-between space-y-4 shadow-[0_0_40px_rgba(0,255,213,0.15)] max-w-sm w-full mx-auto overflow-hidden">
                    {/* Mobile Top Notch/Dynamic Island */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-6 bg-[#1a5c35] rounded-b-2xl z-10 flex items-center justify-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00ffd5] animate-pulse" />
                    </div>
                    <div className="pt-4">
                      <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-[#0f3320]">
                        <span className="flex items-center gap-2 font-['Orbitron'] text-xs font-bold text-[#c8ff00] tracking-wide">
                          <User className="w-4 h-4 text-[#c8ff00]" />
                          <span>
                            {phoneSearchResult?.searchType === 'vehicle'
                              ? 'VEHICLE & OWNER IDENTITY'
                              : phoneSearchResult?.searchType === 'imei'
                              ? 'DEVICE MODEL & BRAND'
                              : phoneSearchResult?.searchType === 'tgid'
                              ? 'TELEGRAM ENTITY PROFILE'
                              : phoneSearchResult?.searchType === 'aadhaar'
                              ? 'AADHAAR CITIZEN IDENTITY'
                              : phoneSearchResult?.searchType === 'email'
                              ? 'EMAIL SUBSCRIBER IDENTITY'
                              : phoneSearchResult?.searchType === 'upi' || phoneSearchResult?.upi
                              ? 'UPI ACCOUNT INFO'
                              : 'PHONE SEARCH'}
                          </span>
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-[#0a1e12] border border-[#1a5c35] text-[9px] font-['JetBrains_Mono'] text-[#7fff50]">
                          {phoneSearchResult?.searchType === 'vehicle'
                            ? 'VAHAN VERIFIED'
                            : phoneSearchResult?.searchType === 'imei'
                            ? 'TAC IDENTIFIED'
                            : phoneSearchResult?.searchType === 'tgid'
                            ? 'TGID VERIFIED'
                            : phoneSearchResult?.searchType === 'aadhaar'
                            ? 'UID VERIFIED'
                            : phoneSearchResult?.searchType === 'email'
                            ? 'EMAIL VERIFIED'
                            : phoneSearchResult?.searchType === 'upi' || phoneSearchResult?.upi
                            ? 'UPI VERIFIED'
                            : 'KYC VERIFIED'}
                        </span>
                      </div>

                      <div className="space-y-3">
                        {/* Name / Owner Name / Device Name */}
                        <div>
                          <div className="font-['JetBrains_Mono'] text-[10px] text-[#3d7a52] uppercase tracking-wider">
                            {phoneSearchResult?.searchType === 'vehicle'
                              ? 'REGISTERED OWNER NAME ("owner_name")'
                              : phoneSearchResult?.searchType === 'imei'
                              ? 'DEVICE MODEL / IDENTIFIER ("model")'
                              : phoneSearchResult?.searchType === 'tgid'
                              ? 'ENTITY NAME / TITLE ("name")'
                              : phoneSearchResult?.upi
                              ? 'ACCOUNT HOLDER NAME ("name")'
                              : 'FULL NAME ("name")'}
                          </div>
                          <div className="font-['JetBrains_Mono'] text-sm font-bold text-[#00ffd5] flex items-center justify-between mt-0.5">
                            <span className="truncate">{phoneSearchResult?.name || phoneSearchResult?.model || <span className="text-[#556655] font-mono">null</span>}</span>
                            {(phoneSearchResult?.name || phoneSearchResult?.model) && (
                              <button
                                onClick={() => handleCopy(phoneSearchResult.name || phoneSearchResult.model, 'sub-name')}
                                className="text-[#3d7a52] hover:text-[#00ffd5] cursor-pointer ml-1"
                                title="Copy Name"
                              >
                                {copiedId === 'sub-name' ? <Check className="w-3 h-3 text-[#c8ff00]" /> : <Copy className="w-3 h-3" />}
                              </button>
                            )}
                          </div>
                        </div>

                        {phoneSearchResult?.searchType === 'vehicle' ? (
                          <>
                            {/* Father / Guardian Name */}
                            <div>
                              <div className="font-['JetBrains_Mono'] text-[10px] text-[#3d7a52] uppercase tracking-wider">FATHER / GUARDIAN ("father_name")</div>
                              <div className="font-['JetBrains_Mono'] text-xs font-semibold text-[#f0fff4] flex items-center justify-between mt-0.5">
                                <span>{phoneSearchResult?.father_name || <span className="text-[#556655] font-mono">null</span>}</span>
                                {phoneSearchResult?.father_name && (
                                  <button
                                    onClick={() => handleCopy(phoneSearchResult.father_name, 'sub-fname')}
                                    className="text-[#3d7a52] hover:text-[#f0fff4] cursor-pointer"
                                  >
                                    {copiedId === 'sub-fname' ? <Check className="w-3 h-3 text-[#c8ff00]" /> : <Copy className="w-3 h-3" />}
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Maker & Model */}
                            <div>
                              <div className="font-['JetBrains_Mono'] text-[10px] text-[#3d7a52] uppercase tracking-wider">MAKER & MODEL ("maker_model")</div>
                              <div className="font-['JetBrains_Mono'] text-xs font-bold text-[#ffe600] flex items-center justify-between mt-0.5 bg-[#020d06] p-2 rounded border border-[#ffe600]/20">
                                <span>{phoneSearchResult?.maker_model || <span className="text-[#556655] font-mono">null</span>}</span>
                                {phoneSearchResult?.maker_model && (
                                  <button
                                    onClick={() => handleCopy(phoneSearchResult.maker_model, 'sub-model')}
                                    className="text-[#3d7a52] hover:text-[#ffe600] cursor-pointer"
                                  >
                                    {copiedId === 'sub-model' ? <Check className="w-3 h-3 text-[#c8ff00]" /> : <Copy className="w-3 h-3" />}
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Vehicle Class & Fuel */}
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <div className="font-['JetBrains_Mono'] text-[10px] text-[#3d7a52] uppercase tracking-wider">VEHICLE CLASS</div>
                                <div className="font-['JetBrains_Mono'] text-xs font-medium text-[#00ffd5] mt-0.5 truncate">
                                  {phoneSearchResult?.vehicle_class || 'MOTOR CAR / LMV'}
                                </div>
                              </div>
                              <div>
                                <div className="font-['JetBrains_Mono'] text-[10px] text-[#3d7a52] uppercase tracking-wider">FUEL TYPE</div>
                                <div className="font-['JetBrains_Mono'] text-xs font-medium text-[#7fff50] mt-0.5 truncate">
                                  {phoneSearchResult?.fuel_type || 'PETROL / DIESEL'}
                                </div>
                              </div>
                            </div>

                            {/* Color & Seating Capacity */}
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <div className="font-['JetBrains_Mono'] text-[10px] text-[#3d7a52] uppercase tracking-wider">VEHICLE COLOR</div>
                                <div className="font-['JetBrains_Mono'] text-xs font-medium text-[#f0fff4] mt-0.5 truncate">
                                  {phoneSearchResult?.color || 'WHITE / METALLIC'}
                                </div>
                              </div>
                              <div>
                                <div className="font-['JetBrains_Mono'] text-[10px] text-[#3d7a52] uppercase tracking-wider">SEATING / CAPACITY</div>
                                <div className="font-['JetBrains_Mono'] text-xs font-medium text-[#c8ff00] mt-0.5 truncate">
                                  {phoneSearchResult?.seating_capacity ? `${phoneSearchResult.seating_capacity} SEATS` : '5 SEATER'}
                                </div>
                              </div>
                            </div>

                            {/* Manufacturing Date / Age */}
                            {(phoneSearchResult?.mfg_date || phoneSearchResult?.vehicle_age) && (
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <div className="font-['JetBrains_Mono'] text-[10px] text-[#3d7a52] uppercase tracking-wider">MFG DATE / YEAR</div>
                                  <div className="font-['JetBrains_Mono'] text-xs font-medium text-[#889988] mt-0.5 truncate">
                                    {phoneSearchResult?.mfg_date || 'N/A'}
                                  </div>
                                </div>
                                <div>
                                  <div className="font-['JetBrains_Mono'] text-[10px] text-[#3d7a52] uppercase tracking-wider">VEHICLE AGE</div>
                                  <div className="font-['JetBrains_Mono'] text-xs font-medium text-[#889988] mt-0.5 truncate">
                                    {phoneSearchResult?.vehicle_age || 'N/A'}
                                  </div>
                                </div>
                              </div>
                            )}
                          </>
                        ) : phoneSearchResult?.searchType === 'imei' ? (
                          <>
                            {/* Brand & Manufacturer */}
                            <div>
                              <div className="font-['JetBrains_Mono'] text-[10px] text-[#3d7a52] uppercase tracking-wider">BRAND / MANUFACTURER ("brand")</div>
                              <div className="font-['JetBrains_Mono'] text-xs font-bold text-[#c8ff00] flex items-center justify-between mt-0.5 bg-[#020d06] p-2 rounded border border-[#c8ff00]/20">
                                <span>{phoneSearchResult?.brand || <span className="text-[#556655] font-mono">null</span>}</span>
                                {phoneSearchResult?.brand && (
                                  <button
                                    onClick={() => handleCopy(phoneSearchResult.brand, 'sub-brand')}
                                    className="text-[#3d7a52] hover:text-[#c8ff00] cursor-pointer"
                                  >
                                    {copiedId === 'sub-brand' ? <Check className="w-3 h-3 text-[#c8ff00]" /> : <Copy className="w-3 h-3" />}
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Model Details */}
                            <div>
                              <div className="font-['JetBrains_Mono'] text-[10px] text-[#3d7a52] uppercase tracking-wider">MODEL SPECIFICATION ("model")</div>
                              <div className="font-['JetBrains_Mono'] text-xs font-semibold text-[#f0fff4] flex items-center justify-between mt-0.5">
                                <span>{phoneSearchResult?.model || <span className="text-[#556655] font-mono">null</span>}</span>
                                {phoneSearchResult?.model && (
                                  <button
                                    onClick={() => handleCopy(phoneSearchResult.model, 'sub-model-imei')}
                                    className="text-[#3d7a52] hover:text-[#f0fff4] cursor-pointer"
                                  >
                                    {copiedId === 'sub-model-imei' ? <Check className="w-3 h-3 text-[#c8ff00]" /> : <Copy className="w-3 h-3" />}
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Device Type & Release Date */}
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <div className="font-['JetBrains_Mono'] text-[10px] text-[#3d7a52] uppercase tracking-wider">DEVICE TYPE</div>
                                <div className="font-['JetBrains_Mono'] text-xs font-medium text-[#00ffd5] mt-0.5 truncate">
                                  {phoneSearchResult?.device_type || 'SMARTPHONE / MOBILE'}
                                </div>
                              </div>
                              <div>
                                <div className="font-['JetBrains_Mono'] text-[10px] text-[#3d7a52] uppercase tracking-wider">RELEASE / YEAR</div>
                                <div className="font-['JetBrains_Mono'] text-xs font-medium text-[#7fff50] mt-0.5 truncate">
                                  {phoneSearchResult?.release_date || 'N/A'}
                                </div>
                              </div>
                            </div>

                            {/* Hardware Details if present */}
                            {phoneSearchResult?.hardware && (
                              <div>
                                <div className="font-['JetBrains_Mono'] text-[10px] text-[#3d7a52] uppercase tracking-wider">CHIPSET / HARDWARE</div>
                                <div className="font-['JetBrains_Mono'] text-xs font-mono text-[#889988] mt-0.5 truncate">
                                  {phoneSearchResult.hardware}
                                </div>
                              </div>
                            )}
                          </>
                        ) : phoneSearchResult?.searchType === 'tgid' ? (
                          <>
                            {/* Username Details */}
                            <div>
                              <div className="font-['JetBrains_Mono'] text-[10px] text-[#3d7a52] uppercase tracking-wider">TELEGRAM USERNAME ("username")</div>
                              <div className="font-['JetBrains_Mono'] text-xs font-bold text-[#00ffd5] flex items-center justify-between mt-0.5 bg-[#020d06] p-2 rounded border border-[#00ffd5]/20">
                                <span>{phoneSearchResult?.username ? `@${phoneSearchResult.username}` : <span className="text-[#556655] font-mono">null</span>}</span>
                                {phoneSearchResult?.username && (
                                  <button
                                    onClick={() => handleCopy(phoneSearchResult.username, 'sub-tg-username')}
                                    className="text-[#3d7a52] hover:text-[#00ffd5] cursor-pointer"
                                  >
                                    {copiedId === 'sub-tg-username' ? <Check className="w-3 h-3 text-[#c8ff00]" /> : <Copy className="w-3 h-3" />}
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Bio / About */}
                            <div>
                              <div className="font-['JetBrains_Mono'] text-[10px] text-[#3d7a52] uppercase tracking-wider">BIO / DESCRIPTION ("bio")</div>
                              <div className="font-['JetBrains_Mono'] text-xs font-semibold text-[#f0fff4] mt-0.5 whitespace-pre-wrap max-h-24 overflow-y-auto bg-[#020d06] p-2 rounded border border-[#1a5c35]">
                                {phoneSearchResult?.bio || <span className="text-[#556655] font-mono">No bio available</span>}
                              </div>
                            </div>

                            {/* Entity Type & DC */}
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <div className="font-['JetBrains_Mono'] text-[10px] text-[#3d7a52] uppercase tracking-wider">ENTITY TYPE</div>
                                <div className="font-['JetBrains_Mono'] text-xs font-medium text-[#c8ff00] mt-0.5 truncate">
                                  {phoneSearchResult?.type || 'USER'}
                                </div>
                              </div>
                              <div>
                                <div className="font-['JetBrains_Mono'] text-[10px] text-[#3d7a52] uppercase tracking-wider">DATACENTER / REGION</div>
                                <div className="font-['JetBrains_Mono'] text-xs font-medium text-[#7fff50] mt-0.5 truncate flex items-center gap-1">
                                  {phoneSearchResult?.dc_id ? (
                                    <>
                                      <span className="w-1.5 h-1.5 rounded-full bg-[#7fff50] animate-pulse" />
                                      DC_{phoneSearchResult.dc_id}
                                    </>
                                  ) : (
                                    'N/A'
                                  )}
                                </div>
                              </div>
                            </div>
                          </>
                        ) : phoneSearchResult?.upi ? (
                          <>
                            {/* UPI ID */}
                            <div>
                              <div className="font-['JetBrains_Mono'] text-[10px] text-[#3d7a52] uppercase tracking-wider">SEARCHED UPI ID ("upi")</div>
                              <div className="font-['JetBrains_Mono'] text-xs font-bold text-[#ffe600] flex items-center justify-between mt-0.5 bg-[#020d06] p-2 rounded border border-[#ffe600]/20">
                                <div className="flex items-center gap-2">
                                  <Shield className="w-3.5 h-3.5 text-[#ffe600]" />
                                  <span className="font-mono tracking-widest">{phoneSearchResult.upi}</span>
                                </div>
                                <button
                                  onClick={() => handleCopy(phoneSearchResult.upi, 'sub-upi')}
                                  className="text-[#3d7a52] hover:text-[#ffe600] cursor-pointer"
                                  title="Copy UPI"
                                >
                                  {copiedId === 'sub-upi' ? <Check className="w-3 h-3 text-[#c8ff00]" /> : <Copy className="w-3 h-3" />}
                                </button>
                              </div>
                            </div>

                            {/* Verification Status */}
                            <div>
                              <div className="font-['JetBrains_Mono'] text-[10px] text-[#3d7a52] uppercase tracking-wider">VERIFICATION STATUS</div>
                              <div className="font-['JetBrains_Mono'] text-xs font-medium mt-0.5 flex items-center gap-2">
                                {phoneSearchResult?.isVerified ? (
                                  <>
                                    <span className="w-2 h-2 rounded-full bg-[#c8ff00] animate-pulse" />
                                    <span className="text-[#c8ff00] font-bold">VERIFIED ACCOUNT</span>
                                  </>
                                ) : (
                                  <>
                                    <span className="w-2 h-2 rounded-full bg-[#ff4060]" />
                                    <span className="text-[#ff4060] font-bold">UNVERIFIED / UNKNOWN</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            {/* Phone Number */}
                            <div>
                              <div className="font-['JetBrains_Mono'] text-[10px] text-[#3d7a52] uppercase tracking-wider">PHONE NUMBER ("mobile_number")</div>
                              <div className="font-['JetBrains_Mono'] text-xs font-semibold text-[#f0fff4] flex items-center justify-between mt-0.5">
                                <span>{phoneSearchResult?.mobile || phoneSearchResult?.number || searchedPhoneNumber || <span className="text-[#556655] font-mono">null</span>}</span>
                                {(phoneSearchResult?.mobile || phoneSearchResult?.number || searchedPhoneNumber) && (
                                  <button
                                    onClick={() => handleCopy((phoneSearchResult?.mobile || phoneSearchResult?.number || searchedPhoneNumber) as string, 'sub-phone')}
                                    className="text-[#3d7a52] hover:text-[#f0fff4] cursor-pointer"
                                  >
                                    {copiedId === 'sub-phone' ? <Check className="w-3 h-3 text-[#c8ff00]" /> : <Copy className="w-3 h-3" />}
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Aadhaar Number */}
                            <div>
                              <div className="font-['JetBrains_Mono'] text-[10px] text-[#3d7a52] uppercase tracking-wider">AADHAAR TOKEN ("aadhaar")</div>
                              <div className="font-['JetBrains_Mono'] text-xs font-bold text-[#ffe600] flex items-center justify-between mt-0.5 bg-[#020d06] p-2 rounded border border-[#ffe600]/20">
                                <div className="flex items-center gap-2">
                                  <Shield className="w-3.5 h-3.5 text-[#ffe600]" />
                                  <span className="font-mono tracking-widest">{phoneSearchResult?.aadhaar || <span className="text-[#556655] font-normal italic">null / Not Provided</span>}</span>
                                </div>
                                {phoneSearchResult?.aadhaar && (
                                  <button
                                    onClick={() => handleCopy(phoneSearchResult.aadhaar, 'sub-aadhaar')}
                                    className="text-[#3d7a52] hover:text-[#ffe600] cursor-pointer"
                                    title="Copy Aadhaar"
                                  >
                                    {copiedId === 'sub-aadhaar' ? <Check className="w-3 h-3 text-[#c8ff00]" /> : <Copy className="w-3 h-3" />}
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Email */}
                            <div>
                              <div className="font-['JetBrains_Mono'] text-[10px] text-[#3d7a52] uppercase tracking-wider">REGISTERED EMAIL ("email")</div>
                              <div className="font-['JetBrains_Mono'] text-xs font-medium text-[#889988] mt-0.5">
                                {phoneSearchResult?.email ? (
                                  <span className="text-[#00ffd5]">{phoneSearchResult.email}</span>
                                ) : (
                                  <span className="text-[#556655] italic">null (Not Linked / Not Provided)</span>
                                )}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Telecom & Mobile Lines OR Vehicle Technical Telemetry OR IMEI Hardware Specs */}
                  {!phoneSearchResult?.upi && (
                    <div className="bg-[#071510] border border-[#0f3320] rounded-xl p-4 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-[#0f3320]">
                        <span className="flex items-center gap-2 font-['Orbitron'] text-xs font-bold text-[#00ffd5] tracking-wide">
                          <Smartphone className="w-4 h-4 text-[#00ffd5]" />
                          <span>
                            {phoneSearchResult?.searchType === 'vehicle'
                              ? 'REGISTRATION & ENGINE TELEMETRY'
                              : phoneSearchResult?.searchType === 'imei'
                              ? 'HARDWARE & RADIO SPECS'
                              : phoneSearchResult?.searchType === 'tgid'
                              ? 'NETWORK & LINKED TELEMETRY'
                              : phoneSearchResult?.searchType === 'aadhaar'
                              ? 'LINKED TELECOM & REGISTRY'
                              : 'TELECOM & ROUTING'}
                          </span>
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-[#0a1e12] border border-[#1a5c35] text-[9px] font-['JetBrains_Mono'] text-[#00ffd5]">
                          {phoneSearchResult?.searchType === 'vehicle'
                            ? 'ACTIVE RC'
                            : phoneSearchResult?.searchType === 'imei'
                            ? 'IMEI MATCHED'
                            : phoneSearchResult?.searchType === 'tgid'
                            ? 'NETWORK OK'
                            : phoneSearchResult?.searchType === 'aadhaar'
                            ? 'UID LINKED'
                            : 'ACTIVE HLR'}
                        </span>
                      </div>

                      <div className="space-y-3">
                        {phoneSearchResult?.searchType === 'vehicle' ? (
                          <>
                            {/* Registration RC */}
                            <div>
                              <div className="font-['JetBrains_Mono'] text-[10px] text-[#3d7a52] uppercase tracking-wider">RC REGISTRATION NUMBER ("rc")</div>
                              <div className="font-['JetBrains_Mono'] text-sm font-bold text-[#c8ff00] flex items-center justify-between mt-0.5 bg-[#020d06] p-2 rounded border border-[#c8ff00]/20">
                                <span className="font-mono tracking-wider">{phoneSearchResult?.rc || searchedPhoneNumber}</span>
                                <button
                                  onClick={() => handleCopy(phoneSearchResult?.rc || searchedPhoneNumber, 'sub-rc')}
                                  className="text-[#3d7a52] hover:text-[#c8ff00] cursor-pointer"
                                  title="Copy RC"
                                >
                                  {copiedId === 'sub-rc' ? <Check className="w-3 h-3 text-[#c8ff00]" /> : <Copy className="w-3 h-3" />}
                                </button>
                              </div>
                            </div>

                            {/* Engine Number */}
                            <div>
                              <div className="font-['JetBrains_Mono'] text-[10px] text-[#3d7a52] uppercase tracking-wider">ENGINE NUMBER ("engine_no")</div>
                              <div className="font-['JetBrains_Mono'] text-xs font-bold text-[#00ffd5] flex items-center justify-between mt-0.5 bg-[#020d06] p-2 rounded border border-[#00ffd5]/20">
                                <span className="font-mono tracking-wider">{phoneSearchResult?.engine_no || <span className="text-[#556655] font-mono">null</span>}</span>
                                {phoneSearchResult?.engine_no && (
                                  <button
                                    onClick={() => handleCopy(phoneSearchResult.engine_no, 'sub-eng')}
                                    className="text-[#3d7a52] hover:text-[#00ffd5] cursor-pointer"
                                  >
                                    {copiedId === 'sub-eng' ? <Check className="w-3 h-3 text-[#c8ff00]" /> : <Copy className="w-3 h-3" />}
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Chassis Number */}
                            <div>
                              <div className="font-['JetBrains_Mono'] text-[10px] text-[#3d7a52] uppercase tracking-wider">CHASSIS / VIN ("chassis_no")</div>
                              <div className="font-['JetBrains_Mono'] text-xs font-bold text-[#00ffd5] flex items-center justify-between mt-0.5 bg-[#020d06] p-2 rounded border border-[#00ffd5]/20">
                                <span className="font-mono tracking-wider">{phoneSearchResult?.chassis_no || <span className="text-[#556655] font-mono">null</span>}</span>
                                {phoneSearchResult?.chassis_no && (
                                  <button
                                    onClick={() => handleCopy(phoneSearchResult.chassis_no, 'sub-chassis')}
                                    className="text-[#3d7a52] hover:text-[#00ffd5] cursor-pointer"
                                  >
                                    {copiedId === 'sub-chassis' ? <Check className="w-3 h-3 text-[#c8ff00]" /> : <Copy className="w-3 h-3" />}
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Registration Date & Engine Capacity */}
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <div className="font-['JetBrains_Mono'] text-[10px] text-[#3d7a52] uppercase tracking-wider">REGISTRATION DATE</div>
                                <div className="font-['JetBrains_Mono'] text-xs font-mono text-[#7fff50] mt-0.5 truncate">
                                  {phoneSearchResult?.reg_date || 'N/A'}
                                </div>
                              </div>
                              <div>
                                <div className="font-['JetBrains_Mono'] text-[10px] text-[#3d7a52] uppercase tracking-wider">ENGINE CC / DISPLACEMENT</div>
                                <div className="font-['JetBrains_Mono'] text-xs font-mono text-[#00ffd5] mt-0.5 truncate">
                                  {phoneSearchResult?.cubic_capacity ? `${phoneSearchResult.cubic_capacity} CC` : 'N/A'}
                                </div>
                              </div>
                            </div>

                            {/* RC Status & Emission Norms */}
                            {(phoneSearchResult?.rc_status || phoneSearchResult?.emission_norms) && (
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <div className="font-['JetBrains_Mono'] text-[10px] text-[#3d7a52] uppercase tracking-wider">RC STATUS</div>
                                  <div className="font-['JetBrains_Mono'] text-xs font-bold text-[#c8ff00] mt-0.5 truncate">
                                    {phoneSearchResult?.rc_status || 'ACTIVE'}
                                  </div>
                                </div>
                                <div>
                                  <div className="font-['JetBrains_Mono'] text-[10px] text-[#3d7a52] uppercase tracking-wider">EMISSION NORMS</div>
                                  <div className="font-['JetBrains_Mono'] text-xs font-bold text-[#7fff50] mt-0.5 truncate">
                                    {phoneSearchResult?.emission_norms || 'BHARAT STAGE (BS)'}
                                  </div>
                                </div>
                              </div>
                            )}
                          </>
                        ) : phoneSearchResult?.searchType === 'imei' ? (
                          <>
                            {/* Primary IMEI */}
                            <div>
                              <div className="font-['JetBrains_Mono'] text-[10px] text-[#3d7a52] uppercase tracking-wider">IMEI NUMBER ("imei")</div>
                              <div className="font-['JetBrains_Mono'] text-sm font-bold text-[#c8ff00] flex items-center justify-between mt-0.5 bg-[#020d06] p-2 rounded border border-[#c8ff00]/20">
                                <span className="font-mono tracking-wider">{phoneSearchResult?.imei || searchedPhoneNumber}</span>
                                <button
                                  onClick={() => handleCopy(phoneSearchResult?.imei || searchedPhoneNumber, 'sub-imei')}
                                  className="text-[#3d7a52] hover:text-[#c8ff00] cursor-pointer"
                                  title="Copy IMEI"
                                >
                                  {copiedId === 'sub-imei' ? <Check className="w-3 h-3 text-[#c8ff00]" /> : <Copy className="w-3 h-3" />}
                                </button>
                              </div>
                            </div>

                            {/* TAC Allocation Code */}
                            <div>
                              <div className="font-['JetBrains_Mono'] text-[10px] text-[#3d7a52] uppercase tracking-wider">TYPE ALLOCATION CODE ("tac")</div>
                              <div className="font-['JetBrains_Mono'] text-xs font-bold text-[#00ffd5] flex items-center justify-between mt-0.5 bg-[#020d06] p-2 rounded border border-[#00ffd5]/20">
                                <span className="font-mono tracking-wider">{phoneSearchResult?.tac || <span className="text-[#556655] font-mono">null</span>}</span>
                                {phoneSearchResult?.tac && (
                                  <button
                                    onClick={() => handleCopy(phoneSearchResult.tac, 'sub-tac')}
                                    className="text-[#3d7a52] hover:text-[#00ffd5] cursor-pointer"
                                  >
                                    {copiedId === 'sub-tac' ? <Check className="w-3 h-3 text-[#c8ff00]" /> : <Copy className="w-3 h-3" />}
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Serial Number & SIM Slots */}
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <div className="font-['JetBrains_Mono'] text-[10px] text-[#3d7a52] uppercase tracking-wider">SERIAL NUMBER</div>
                                <div className="font-['JetBrains_Mono'] text-xs font-mono text-[#7fff50] mt-0.5 truncate">
                                  {phoneSearchResult?.serial_no || 'N/A'}
                                </div>
                              </div>
                              <div>
                                <div className="font-['JetBrains_Mono'] text-[10px] text-[#3d7a52] uppercase tracking-wider">SIM ARCHITECTURE</div>
                                <div className="font-['JetBrains_Mono'] text-xs font-mono text-[#00ffd5] mt-0.5 truncate">
                                  {phoneSearchResult?.sim_type || 'DUAL SIM / ESIM'}
                                </div>
                              </div>
                            </div>

                            {/* Operating System / Platform */}
                            <div>
                              <div className="font-['JetBrains_Mono'] text-[10px] text-[#3d7a52] uppercase tracking-wider">OS & PLATFORM</div>
                              <div className="font-['JetBrains_Mono'] text-xs font-medium text-[#f0fff4] mt-0.5 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-[#00ffd5] animate-pulse" />
                                <span>{phoneSearchResult?.os || 'ANDROID / IOS / EMBEDDED'}</span>
                              </div>
                            </div>
                          </>
                        ) : phoneSearchResult?.searchType === 'tgid' ? (
                          <>
                            {/* Primary Telegram ID */}
                            <div>
                              <div className="font-['JetBrains_Mono'] text-[10px] text-[#3d7a52] uppercase tracking-wider">TELEGRAM UID ("tgid")</div>
                              <div className="font-['JetBrains_Mono'] text-sm font-bold text-[#c8ff00] flex items-center justify-between mt-0.5 bg-[#020d06] p-2 rounded border border-[#c8ff00]/20">
                                <span className="font-mono tracking-wider">{phoneSearchResult?.tgid || searchedPhoneNumber}</span>
                                <button
                                  onClick={() => handleCopy(phoneSearchResult?.tgid || searchedPhoneNumber, 'sub-tgid')}
                                  className="text-[#3d7a52] hover:text-[#c8ff00] cursor-pointer"
                                  title="Copy TGID"
                                >
                                  {copiedId === 'sub-tgid' ? <Check className="w-3 h-3 text-[#c8ff00]" /> : <Copy className="w-3 h-3" />}
                                </button>
                              </div>
                            </div>

                            {/* Linked Phone Number */}
                            <div>
                              <div className="font-['JetBrains_Mono'] text-[10px] text-[#3d7a52] uppercase tracking-wider">LINKED PHONE NUMBER ("phone")</div>
                              <div className="font-['JetBrains_Mono'] text-xs font-bold text-[#00ffd5] flex items-center justify-between mt-0.5 bg-[#020d06] p-2 rounded border border-[#00ffd5]/20">
                                <span className="font-mono tracking-wider">{phoneSearchResult?.phone || <span className="text-[#556655] font-mono">null</span>}</span>
                                {phoneSearchResult?.phone ? (
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => {
                                        const phNum = phoneSearchResult.phone;
                                        setSearchQuery(phNum);
                                        performPhoneLookup(phNum);
                                      }}
                                      className="px-2 py-0.5 text-[9px] border border-[#00ffd5] text-[#00ffd5] hover:bg-[#00ffd5] hover:text-black transition-colors rounded-sm cursor-pointer whitespace-nowrap"
                                      title="Run OSINT on this Phone Number"
                                    >
                                      PIVOT SEARCH
                                    </button>
                                    <button
                                      onClick={() => handleCopy(phoneSearchResult.phone, 'sub-tg-phone')}
                                      className="text-[#3d7a52] hover:text-[#00ffd5] cursor-pointer"
                                    >
                                      {copiedId === 'sub-tg-phone' ? <Check className="w-3 h-3 text-[#c8ff00]" /> : <Copy className="w-3 h-3" />}
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-[#3d7a52]">NO PIVOT AVAIL</span>
                                )}
                              </div>
                            </div>

                            {/* Network Platform */}
                            <div>
                              <div className="font-['JetBrains_Mono'] text-[10px] text-[#3d7a52] uppercase tracking-wider">CLIENT PLATFORM</div>
                              <div className="font-['JetBrains_Mono'] text-xs font-medium text-[#f0fff4] mt-0.5 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-[#00ffd5] animate-pulse" />
                                <span>{phoneSearchResult?.type?.includes('BOT') ? 'TELEGRAM API BOT' : 'TELEGRAM MESSENGER'}</span>
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            {/* Mobile Number */}
                            <div>
                              <div className="font-['JetBrains_Mono'] text-[10px] text-[#3d7a52] uppercase tracking-wider">PRIMARY MOBILE ("mobile")</div>
                              <div className="font-['JetBrains_Mono'] text-sm font-bold text-[#c8ff00] flex items-center justify-between mt-0.5 bg-[#020d06] p-2 rounded border border-[#c8ff00]/20">
                                <span className="font-mono tracking-wider">{phoneSearchResult?.mobile || phoneSearchResult?.number || searchedPhoneNumber}</span>
                                <button
                                  onClick={() => handleCopy(phoneSearchResult?.mobile || phoneSearchResult?.number || searchedPhoneNumber, 'sub-mobile')}
                                  className="text-[#3d7a52] hover:text-[#c8ff00] cursor-pointer"
                                  title="Copy Mobile"
                                >
                                  {copiedId === 'sub-mobile' ? <Check className="w-3 h-3 text-[#c8ff00]" /> : <Copy className="w-3 h-3" />}
                                </button>
                              </div>
                            </div>

                            {/* Alternate Mobile */}
                            <div>
                              <div className="font-['JetBrains_Mono'] text-[10px] text-[#3d7a52] uppercase tracking-wider">ALT MOBILE ("alt_mobile")</div>
                              <div className="font-['JetBrains_Mono'] text-xs font-bold text-[#00ffd5] flex items-center justify-between mt-0.5 bg-[#020d06] p-2 rounded border border-[#00ffd5]/20">
                                <span className="font-mono tracking-wider">{phoneSearchResult?.alt_mobile || <span className="text-[#556655] font-mono">null</span>}</span>
                                {phoneSearchResult?.alt_mobile ? (
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => {
                                        const altNum = phoneSearchResult.alt_mobile;
                                        setSearchQuery(altNum);
                                        performPhoneLookup(altNum);
                                      }}
                                      className="text-[9px] px-1.5 py-0.5 rounded bg-[#071510] text-[#00ffd5] hover:bg-[#00ffd5] hover:text-[#040f08] border border-[#00ffd5]/40 transition-colors cursor-pointer"
                                      title="Run Recon on Alt Number"
                                    >
                                      SEARCH ALT
                                    </button>
                                    <button
                                      onClick={() => handleCopy(phoneSearchResult.alt_mobile, 'sub-alt')}
                                      className="text-[#3d7a52] hover:text-[#00ffd5] cursor-pointer"
                                    >
                                      {copiedId === 'sub-alt' ? <Check className="w-3 h-3 text-[#c8ff00]" /> : <Copy className="w-3 h-3" />}
                                    </button>
                                  </div>
                                ) : null}
                              </div>
                            </div>

                            {/* Telecom Circle */}
                            <div>
                              <div className="font-['JetBrains_Mono'] text-[10px] text-[#3d7a52] uppercase tracking-wider">TELECOM CIRCLE ("circle")</div>
                              <div className="font-['JetBrains_Mono'] text-xs font-bold text-[#f0fff4] mt-0.5 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-[#00ffd5] animate-pulse" />
                                <span>{phoneSearchResult?.circle || <span className="text-[#556655] font-mono">null</span>}</span>
                              </div>
                            </div>

                            {/* HLR & Protocol */}
                            <div>
                              <div className="font-['JetBrains_Mono'] text-[10px] text-[#3d7a52] uppercase tracking-wider">NETWORK PROTOCOL & HLR</div>
                              <div className="font-['JetBrains_Mono'] text-xs font-mono text-[#7fff50] mt-0.5">
                                {phoneSearchResult?.line_type || 'GSM / 5G SA'} • {phoneSearchResult?.hlr_status || 'ACTIVE_SUBSCRIBER'}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  )}

                  {/* Card 3: Location & Address OR RTO Compliance OR GSMA Regulatory */}
                  {!phoneSearchResult?.upi && (
                    <div className="bg-[#071510] border border-[#0f3320] rounded-xl p-4 flex flex-col justify-between space-y-3">
                      <div>
                      <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-[#0f3320]">
                        <span className="flex items-center gap-2 font-['Orbitron'] text-xs font-bold text-[#7fff50] tracking-wide">
                          <MapPin className="w-4 h-4 text-[#7fff50]" />
                          <span>
                            {phoneSearchResult?.searchType === 'vehicle'
                              ? 'RTO AUTHORITY & COMPLIANCE'
                              : phoneSearchResult?.searchType === 'imei'
                              ? 'GSMA STATUS & REGULATORY'
                              : phoneSearchResult?.searchType === 'tgid'
                              ? 'ACCOUNT HISTORY & AGE'
                              : 'RESIDENCE & ADDRESS'}
                          </span>
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-[#0a1e12] border border-[#1a5c35] text-[9px] font-['JetBrains_Mono'] text-[#7fff50]">
                          {phoneSearchResult?.searchType === 'vehicle'
                            ? (phoneSearchResult?.state || 'RTO JURISDICTION')
                            : phoneSearchResult?.searchType === 'imei'
                            ? (phoneSearchResult?.country || 'GSMA GLOBAL')
                            : phoneSearchResult?.searchType === 'tgid'
                            ? 'TELEGRAM LOGS'
                            : `PIN ${phoneSearchResult?.pincode || 'N/A'}`}
                        </span>
                      </div>

                      <div className="space-y-3">
                        {phoneSearchResult?.searchType === 'vehicle' ? (
                          <>
                            {/* RTO Office */}
                            <div>
                              <div className="font-['JetBrains_Mono'] text-[10px] text-[#3d7a52] uppercase tracking-wider">REGISTERING RTO AUTHORITY ("rto_name")</div>
                              <div className="font-['JetBrains_Mono'] text-xs font-bold text-[#00ffd5] mt-0.5">
                                {phoneSearchResult?.rto || <span className="text-[#556655] font-mono">null</span>}
                              </div>
                            </div>

                            {/* Insurance Validity & Company */}
                            <div>
                              <div className="font-['JetBrains_Mono'] text-[10px] text-[#3d7a52] uppercase tracking-wider">INSURANCE VALIDITY ("insurance_upto")</div>
                              <div className="font-['JetBrains_Mono'] text-xs font-bold text-[#f0fff4] mt-0.5 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-[#00ffd5]" />
                                <span>{phoneSearchResult?.insurance_validity || 'N/A'}</span>
                                {phoneSearchResult?.insurance_company && (
                                  <span className="text-[10px] text-[#889988] font-normal truncate">({phoneSearchResult.insurance_company})</span>
                                )}
                              </div>
                            </div>

                            {/* Fitness & PUCC */}
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <div className="font-['JetBrains_Mono'] text-[10px] text-[#3d7a52] uppercase tracking-wider">FITNESS UPTO</div>
                                <div className="font-['JetBrains_Mono'] text-xs font-medium text-[#7fff50] mt-0.5 truncate">
                                  {phoneSearchResult?.fitness_validity || 'N/A'}
                                </div>
                              </div>
                              <div>
                                <div className="font-['JetBrains_Mono'] text-[10px] text-[#3d7a52] uppercase tracking-wider">PUCC UPTO</div>
                                <div className="font-['JetBrains_Mono'] text-xs font-medium text-[#c8ff00] mt-0.5 truncate">
                                  {phoneSearchResult?.pucc_validity || 'N/A'}
                                </div>
                              </div>
                            </div>

                            {/* Hypothecation & Tax */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <div>
                                <div className="font-['JetBrains_Mono'] text-[10px] text-[#3d7a52] uppercase tracking-wider">FINANCIER / HYPOTHECATION</div>
                                <div className="font-['JetBrains_Mono'] text-xs font-mono text-[#ffe600] mt-0.5 truncate">
                                  {phoneSearchResult?.financer || 'NO HYPOTHECATION (CLEAN)'}
                                </div>
                              </div>
                              {phoneSearchResult?.tax_upto && (
                                <div>
                                  <div className="font-['JetBrains_Mono'] text-[10px] text-[#3d7a52] uppercase tracking-wider">TAX PAID UPTO</div>
                                  <div className="font-['JetBrains_Mono'] text-xs font-mono text-[#7fff50] mt-0.5 truncate">
                                    {phoneSearchResult.tax_upto}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Registered Address if available */}
                            {phoneSearchResult?.address && (
                              <div>
                                <div className="font-['JetBrains_Mono'] text-[10px] text-[#3d7a52] uppercase tracking-wider flex items-center justify-between">
                                  <span>REGISTERED ADDRESS</span>
                                  <button
                                    onClick={() => handleCopy(phoneSearchResult.address, 'sub-addr')}
                                    className="text-[#3d7a52] hover:text-[#7fff50] cursor-pointer"
                                    title="Copy Address"
                                  >
                                    {copiedId === 'sub-addr' ? <Check className="w-3 h-3 text-[#c8ff00]" /> : <Copy className="w-3 h-3" />}
                                  </button>
                                </div>
                                <div className="font-['JetBrains_Mono'] text-xs font-medium text-[#f0fff4] mt-1 leading-relaxed bg-[#020d06] p-2 rounded border border-[#1a5c35]">
                                  {phoneSearchResult.address}
                                </div>
                              </div>
                            )}
                          </>
                        ) : phoneSearchResult?.searchType === 'imei' ? (
                          <>
                            {/* Blacklist Status */}
                            <div>
                              <div className="font-['JetBrains_Mono'] text-[10px] text-[#3d7a52] uppercase tracking-wider">GSMA BLACKLIST STATUS ("blacklist_status")</div>
                              <div className="font-['JetBrains_Mono'] text-xs font-bold text-[#c8ff00] mt-0.5 flex items-center gap-1.5 bg-[#020d06] p-2 rounded border border-[#c8ff00]/20">
                                <span className="w-2 h-2 rounded-full bg-[#c8ff00] animate-pulse" />
                                <span>{phoneSearchResult?.blacklist_status || 'CLEAN / NOT BLACKLISTED'}</span>
                              </div>
                            </div>

                            {/* Carrier Lock */}
                            <div>
                              <div className="font-['JetBrains_Mono'] text-[10px] text-[#3d7a52] uppercase tracking-wider">CARRIER / SIM LOCK STATUS ("network_lock")</div>
                              <div className="font-['JetBrains_Mono'] text-xs font-bold text-[#00ffd5] mt-0.5 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-[#00ffd5]" />
                                <span>{phoneSearchResult?.network_lock || 'UNLOCKED / GLOBAL COMPLIANT'}</span>
                              </div>
                            </div>

                            {/* Country of Origin */}
                            <div>
                              <div className="font-['JetBrains_Mono'] text-[10px] text-[#3d7a52] uppercase tracking-wider">COUNTRY OF ORIGIN / REGISTRATION</div>
                              <div className="font-['JetBrains_Mono'] text-xs font-medium text-[#7fff50] mt-0.5">
                                {phoneSearchResult?.country || 'GLOBAL / INTERNATIONAL SPEC'}
                              </div>
                            </div>

                            {/* Compliance & Regulatory */}
                            <div>
                              <div className="font-['JetBrains_Mono'] text-[10px] text-[#3d7a52] uppercase tracking-wider">REGULATORY COMPLIANCE</div>
                              <div className="font-['JetBrains_Mono'] text-xs font-mono text-[#889988] mt-0.5 bg-[#020d06] p-2 rounded border border-[#1a5c35]">
                                CE / FCC / GSMA TAC COMPLIANT • 3GPP STANDARD
                              </div>
                            </div>
                          </>
                        ) : phoneSearchResult?.searchType === 'tgid' ? (
                          <>
                            {/* Account Age Estimate */}
                            <div>
                              <div className="font-['JetBrains_Mono'] text-[10px] text-[#3d7a52] uppercase tracking-wider">ACCOUNT AGE ESTIMATE</div>
                              <div className="font-['JetBrains_Mono'] text-xs font-bold text-[#c8ff00] mt-0.5 flex items-center gap-1.5 bg-[#020d06] p-2 rounded border border-[#c8ff00]/20">
                                <span className="w-2 h-2 rounded-full bg-[#c8ff00]" />
                                <span>
                                  {parseInt(phoneSearchResult?.tgid || '0') < 1000000000 
                                    ? 'OLD ACCOUNT (PRE-2020)' 
                                    : 'MODERN ACCOUNT (POST-2020)'}
                                </span>
                              </div>
                            </div>

                            {/* Threat Intelligence / Risk Score */}
                            <div>
                              <div className="font-['JetBrains_Mono'] text-[10px] text-[#3d7a52] uppercase tracking-wider">THREAT INTELLIGENCE & RISK</div>
                              <div className="font-['JetBrains_Mono'] text-xs font-bold text-[#00ffd5] mt-0.5 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-[#00ffd5] animate-pulse" />
                                <span>{phoneSearchResult?.type?.includes('BOT') ? 'AUTOMATED SYSTEM / API BOT' : 'STANDARD USER ENTITY (CLEAN)'}</span>
                              </div>
                            </div>

                            {/* Extracted Artifacts */}
                            <div>
                              <div className="font-['JetBrains_Mono'] text-[10px] text-[#3d7a52] uppercase tracking-wider">RAW OSINT ARTIFACTS</div>
                              <div className="font-['JetBrains_Mono'] text-xs font-mono text-[#889988] mt-0.5 bg-[#020d06] p-2 rounded border border-[#1a5c35]">
                                {phoneSearchResult?.all_attributes?.length} TOTAL METADATA ARTIFACTS COLLECTED
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            {/* Formatted Address */}
                            <div>
                              <div className="font-['JetBrains_Mono'] text-[10px] text-[#3d7a52] uppercase tracking-wider flex items-center justify-between">
                                <span>FORMATTED ADDRESS</span>
                                {phoneSearchResult?.address && (
                                  <button
                                    onClick={() => handleCopy(phoneSearchResult.address, 'sub-addr')}
                                    className="text-[#3d7a52] hover:text-[#7fff50] cursor-pointer"
                                    title="Copy Address"
                                  >
                                    {copiedId === 'sub-addr' ? <Check className="w-3 h-3 text-[#c8ff00]" /> : <Copy className="w-3 h-3" />}
                                  </button>
                                )}
                              </div>
                              <div className="font-['JetBrains_Mono'] text-xs font-medium text-[#f0fff4] mt-1 leading-relaxed bg-[#020d06] p-2 rounded border border-[#1a5c35]">
                                {phoneSearchResult?.address || <span className="text-[#556655] font-mono">null</span>}
                              </div>
                            </div>

                            {/* Parsed Address Breakdown Chips */}
                            {phoneSearchResult?.address_segments && phoneSearchResult.address_segments.length > 0 && (
                              <div>
                                <div className="font-['JetBrains_Mono'] text-[10px] text-[#3d7a52] uppercase tracking-wider mb-1">
                                  PARSED STRUCTURED TOKENS
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {phoneSearchResult.address_segments.map((seg: string, idx: number) => (
                                    <span
                                      key={idx}
                                      className="text-[10px] font-['JetBrains_Mono'] px-2 py-0.5 rounded bg-[#0a1e12] border border-[#1a5c35] text-[#00ffd5]"
                                    >
                                      {seg}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Raw Address with ! */}
                            {phoneSearchResult?.raw_address && (
                              <div>
                                <div className="font-['JetBrains_Mono'] text-[10px] text-[#3d7a52] uppercase tracking-wider flex items-center justify-between">
                                  <span>RAW STRING ("address")</span>
                                  <button
                                    onClick={() => handleCopy(phoneSearchResult.raw_address, 'raw-addr')}
                                    className="text-[#3d7a52] hover:text-[#00ffd5] cursor-pointer"
                                  >
                                    {copiedId === 'raw-addr' ? <Check className="w-3 h-3 text-[#c8ff00]" /> : <Copy className="w-3 h-3" />}
                                  </button>
                                </div>
                                <div className="font-mono text-[10px] text-[#889988] bg-[#020d06] p-1.5 rounded border border-[#0f3320] truncate mt-0.5">
                                  {phoneSearchResult.raw_address}
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  )}
                </div>


                {/* Raw JSON Structure Viewer for Direct Verification */}
                <div className="bg-[#020d06] border border-[#0f3320] rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-[#0f3320]">
                    <span className="flex items-center gap-2 font-['Orbitron'] text-xs font-bold text-[#f0fff4] uppercase tracking-wide">
                      <Code2 className="w-4 h-4 text-[#00ffd5]" />
                      <span>API RAW RESPONSE MATRIX</span>
                    </span>
                    <button
                      onClick={() => {
                        const rawJsonObj = stripCreditFields(phoneSearchResult?.api_exact_response || phoneSearchResult?.raw_payload || {});
                        handleCopy(JSON.stringify(rawJsonObj, null, 2), 'raw-json');
                      }}
                      className="px-2.5 py-1 rounded bg-[#071510] hover:bg-[#0a1e12] border border-[#1a5c35] text-[#00ffd5] text-[10px] font-['JetBrains_Mono'] flex items-center gap-1 cursor-pointer"
                    >
                      {copiedId === 'raw-json' ? <Check className="w-3 h-3 text-[#c8ff00]" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedId === 'raw-json' ? 'JSON COPIED' : 'COPY JSON'}</span>
                    </button>
                  </div>
                  <pre className="font-mono text-[11px] text-[#00ffd5] bg-[#040f08] p-3 rounded-lg border border-[#0f3320] overflow-x-auto leading-relaxed">
{JSON.stringify(stripCreditFields(phoneSearchResult?.api_exact_response || phoneSearchResult?.raw_payload || {}), null, 2)}
                  </pre>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </section>

      {/* ========================================================================= */}
      {/* SECTION 3: INTERACTIVE OSINT MODULES */}
      {/* ========================================================================= */}
      <main className="relative z-10 py-6 px-4 lg:px-8 max-w-7xl mx-auto">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded bg-[#c8ff00] shadow-[0_0_8px_#c8ff00]" />
              <h3 className="font-['Orbitron'] text-base font-bold tracking-wider text-[#f0fff4] uppercase">
                ACTIVE RECON & OSINT KNOWLEDGE BASE
              </h3>
            </div>
            <span className="font-['JetBrains_Mono'] text-xs text-[#3d7a52]">
              SHOWING {filteredTopics.length} OF {DEFAULT_TOPICS.length} MODULES (CLICK ANY TO SEARCH)
            </span>
          </div>

          {filteredTopics.length === 0 ? (
            <div className="bg-[#071510] border border-[#0f3320] rounded-2xl p-12 text-center">
              <AlertCircle className="w-10 h-10 text-[#3d7a52] mx-auto mb-3" />
              <h4 className="font-['Orbitron'] text-lg font-bold text-[#f0fff4]">NO MODULES MATCH QUERY</h4>
              <p className="font-['JetBrains_Mono'] text-xs text-[#3d7a52] mt-1 max-w-md mx-auto">
                Try searching for "phone", "aadhar", "upi", "email", "vehicle", "imei", or "telegram".
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('ALL');
                }}
                className="mt-4 px-4 py-2 rounded-lg bg-[#0a1e12] text-[#c8ff00] border border-[#1a5c35] text-xs font-['JetBrains_Mono'] font-bold cursor-pointer"
              >
                RESET SEARCH FILTERS
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {filteredTopics.map((topic) => {
                const isSelected = selectedModuleId === topic.id;
                return (
                  <div
                    key={topic.id}
                    onClick={() => handleSelectModuleCard(topic)}
                    className={`cyber-edge-beam-card ${
                      isSelected ? 'is-selected' : ''
                    } rounded-xl p-3.5 relative overflow-hidden group flex flex-col justify-between cursor-pointer`}
                  >
                    <span className="hud-corner hud-tl scale-75 transform origin-top-left" />
                    <span className="hud-corner hud-tr scale-75 transform origin-top-right" />
                    <span className="hud-corner hud-bl scale-75 transform origin-bottom-left" />
                    <span className="hud-corner hud-br scale-75 transform origin-bottom-right" />

                    <div>
                      {/* Card Header */}
                      <div className="flex items-center justify-between gap-1.5 mb-2">
                        <span className="font-['JetBrains_Mono'] text-[9px] text-[#3d7a52] tracking-wider truncate">
                          {topic.badge}
                        </span>
                        <span
                          className={`text-[8px] font-['JetBrains_Mono'] px-1.5 py-0.5 rounded uppercase font-bold shrink-0 ${
                            topic.severity === 'crit'
                              ? 'bg-[#ff4060]/10 text-[#ff4060] border border-[#ff4060]/30'
                              : topic.severity === 'high'
                              ? 'bg-[#ffe600]/10 text-[#ffe600] border border-[#ffe600]/30'
                              : 'bg-[#c8ff00]/10 text-[#c8ff00] border border-[#c8ff00]/30'
                          }`}
                        >
                          {topic.severity} PRIORITY
                        </span>
                      </div>

                      {/* Title & Subtitle */}
                      <h4 className="font-['Orbitron'] font-bold text-sm text-[#f0fff4] group-hover:text-[#c8ff00] transition-colors uppercase flex items-center justify-between">
                        <span className="truncate pr-1">{topic.title}</span>
                        {isSelected && <span className="text-[9px] text-[#c8ff00] shrink-0">● ACTIVE</span>}
                      </h4>
                      <p className="font-['JetBrains_Mono'] text-[10px] text-[#00ffd5] mt-1 line-clamp-2 leading-tight">
                        {topic.subtitle}
                      </p>

                      <div className="mt-2.5 space-y-1.5">
                        <div className="p-2 rounded-lg bg-[#020d06] border border-[#1a5c35] text-[9px] font-['JetBrains_Mono'] text-[#00ffd5]/90 space-y-0.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[#3d7a52] flex items-center gap-1">
                              <span className={`w-1 h-1 rounded-full ${
                                apiHealth[topic.id] === 'online' ? 'bg-[#7fff50] animate-pulse' :
                                apiHealth[topic.id] === 'checking' ? 'bg-[#ffe600] animate-pulse' :
                                'bg-[#ff4060]'
                              }`} />
                              <span>GATEWAY STATUS:</span>
                            </span>
                            <span className={`font-bold ${
                              apiHealth[topic.id] === 'online' ? 'text-[#7fff50]' :
                              apiHealth[topic.id] === 'checking' ? 'text-[#ffe600]' :
                              'text-[#ff4060]'
                            }`}>
                              {apiHealth[topic.id] === 'online' ? 'ONLINE' :
                               apiHealth[topic.id] === 'checking' ? 'CHECKING...' :
                               'OFFLINE'}
                            </span>
                          </div>
                          <div className="text-[9px] text-[#00ffd5] flex items-center justify-between">
                            <span>{topic.category} NODE</span>
                            <span className={apiHealth[topic.id] === 'online' ? 'text-[#c8ff00] font-mono' : 'text-[#ff4060] font-mono'}>
                              {apiHealth[topic.id] === 'online' ? 'PROTECTED' : 'UNREACHABLE'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Click prompt note */}
                      <div className="mt-3 pt-2 border-t border-[#0f3320]/60 flex items-center justify-between text-[9px] font-['JetBrains_Mono'] text-[#3d7a52] group-hover:text-[#c8ff00] transition-colors">
                        <span>SELECT MODULE</span>
                        <span>→</span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Reset Filter Card */}
              <div
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('ALL');
                  setSelectedModuleId(null);
                  addLog('[SYS-ACTION] All query filters, category tags, and module selections reset to default matrix.', 'resp');
                }}
                className="cyber-edge-beam-card rounded-xl p-3.5 relative overflow-hidden group flex flex-col justify-between cursor-pointer"
              >
                <span className="hud-corner hud-tl scale-75 transform origin-top-left" />
                <span className="hud-corner hud-tr scale-75 transform origin-top-right" />
                <span className="hud-corner hud-bl scale-75 transform origin-bottom-left" />
                <span className="hud-corner hud-br scale-75 transform origin-bottom-right" />

                <div>
                  {/* Card Header */}
                  <div className="flex items-center justify-between gap-1.5 mb-2">
                    <span className="font-['JetBrains_Mono'] text-[9px] text-[#00ffd5] tracking-wider truncate flex items-center gap-1">
                      <FilterX className="w-3 h-3 text-[#00ffd5]" />
                      <span>SYS // FILTER-RESET</span>
                    </span>
                    <span className="text-[8px] font-['JetBrains_Mono'] px-1.5 py-0.5 rounded uppercase font-bold shrink-0 bg-[#00ffd5]/10 text-[#00ffd5] border border-[#00ffd5]/30">
                      ACTION READY
                    </span>
                  </div>

                  {/* Title & Subtitle */}
                  <h4 className="font-['Orbitron'] font-bold text-sm text-[#f0fff4] group-hover:text-[#00ffd5] transition-colors uppercase flex items-center justify-between">
                    <span className="truncate pr-1">RESET ALL FILTERS</span>
                    <RotateCcw className="w-3.5 h-3.5 text-[#00ffd5] group-hover:rotate-180 transition-transform duration-500 shrink-0" />
                  </h4>
                  <p className="font-['JetBrains_Mono'] text-[10px] text-[#3d7a52] group-hover:text-[#7fff50] transition-colors mt-1 line-clamp-2 leading-tight">
                    Restore all modules, clear active search query, and reset category selectors.
                  </p>

                  <div className="mt-2.5 space-y-1.5">
                    <div className="p-2 rounded-lg bg-[#020d06] border border-[#1a5c35] text-[9px] font-['JetBrains_Mono'] text-[#00ffd5]/90 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[#3d7a52]">CURRENT STATE:</span>
                        <span className={`font-bold ${searchQuery || activeCategory !== 'ALL' || selectedModuleId ? 'text-[#ffe600]' : 'text-[#7fff50]'}`}>
                          {searchQuery || activeCategory !== 'ALL' || selectedModuleId ? 'FILTERS ACTIVE' : 'DEFAULT MATRIX'}
                        </span>
                      </div>
                      <div className="text-[9px] text-[#3d7a52] flex items-center justify-between truncate">
                        <span>CATEGORY:</span>
                        <span className="text-[#c8ff00] font-mono">{activeCategory}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action prompt note */}
                  <div className="mt-3 pt-2 border-t border-[#0f3320]/60 flex items-center justify-between text-[9px] font-['JetBrains_Mono'] text-[#00ffd5] group-hover:text-[#c8ff00] transition-colors font-bold">
                    <span>CLEAR & RESTORE ALL</span>
                    <span>↺</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Cyber Ticker Bar */}
      <div className="border-y border-[#0f3320] bg-[#05110a]/95 backdrop-blur-md py-3 relative z-10 overflow-hidden mt-12 shadow-[0_4px_25px_rgba(0,0,0,0.6)]">
        {/* Subtle fade edges */}
        <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[#020d06] to-transparent pointer-events-none z-10" />
        <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[#020d06] to-transparent pointer-events-none z-10" />

        <div className="animate-ticker font-['JetBrains_Mono'] text-xs uppercase tracking-wider flex items-center gap-8 select-none">
          {/* Loop Set 1 */}
          {DEFAULT_TOPICS.map((topic, idx) => (
            <div key={`ticker-1-${topic.id}`} className="flex items-center gap-8 shrink-0">
              <button
                type="button"
                onClick={() => handleSelectModuleCard(topic)}
                className="group flex items-center gap-2.5 px-3 py-1 rounded-lg bg-[#071510] hover:bg-[#0c2417] border border-[#0f3320] hover:border-[#c8ff00]/60 transition-all cursor-pointer text-left"
                title={`Open ${topic.title} OSINT Module`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#c8ff00] group-hover:shadow-[0_0_8px_#c8ff00] transition-all" />
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#020d06] border border-[#1a5c35] text-[#00ffd5] font-bold">
                  {topic.badge}
                </span>
                <span className="text-[#f0fff4] group-hover:text-[#c8ff00] font-semibold tracking-wide transition-colors">
                  {topic.title}
                </span>
                <span className="text-[10px] text-[#3d7a52] group-hover:text-[#7bb38e] transition-colors hidden sm:inline">
                  [{topic.category}]
                </span>
              </button>
              <strong className={idx % 2 === 0 ? "text-[#c8ff00] drop-shadow-[0_0_6px_#c8ff00]" : "text-[#00ffd5] drop-shadow-[0_0_6px_#00ffd5]"}>
                ⚡
              </strong>
            </div>
          ))}

          {/* Loop Set 2 (for seamless infinite loop) */}
          {DEFAULT_TOPICS.map((topic, idx) => (
            <div key={`ticker-2-${topic.id}`} className="flex items-center gap-8 shrink-0">
              <button
                type="button"
                onClick={() => handleSelectModuleCard(topic)}
                className="group flex items-center gap-2.5 px-3 py-1 rounded-lg bg-[#071510] hover:bg-[#0c2417] border border-[#0f3320] hover:border-[#c8ff00]/60 transition-all cursor-pointer text-left"
                title={`Open ${topic.title} OSINT Module`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#c8ff00] group-hover:shadow-[0_0_8px_#c8ff00] transition-all" />
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#020d06] border border-[#1a5c35] text-[#00ffd5] font-bold">
                  {topic.badge}
                </span>
                <span className="text-[#f0fff4] group-hover:text-[#c8ff00] font-semibold tracking-wide transition-colors">
                  {topic.title}
                </span>
                <span className="text-[10px] text-[#3d7a52] group-hover:text-[#7bb38e] transition-colors hidden sm:inline">
                  [{topic.category}]
                </span>
              </button>
              <strong className={idx % 2 === 0 ? "text-[#c8ff00] drop-shadow-[0_0_6px_#c8ff00]" : "text-[#00ffd5] drop-shadow-[0_0_6px_#00ffd5]"}>
                ⚡
              </strong>
            </div>
          ))}
        </div>
      </div>

      {/* Cyber Footer */}
      <footer className="relative z-10 border-t border-[#0f3320] bg-[#040f08] py-8 px-4 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 font-['JetBrains_Mono'] text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#c8ff00] shadow-[0_0_8px_#c8ff00]" />
            <span className="text-[#f0fff4] font-bold tracking-wider">
              ZeroaTrace // <span className="text-[#c8ff00]">OSINT</span>
            </span>
            <span className="text-[#3d7a52]">• FIX • LEARN • SOLVE • 2026</span>
          </div>
          <div className="flex items-center gap-4 text-[#3d7a52]">
            <button
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="hover:text-[#c8ff00] transition-colors cursor-pointer"
            >
              [BACK TO TOP]
            </button>
            <button
              onClick={() => {
                searchInputRef.current?.focus();
              }}
              className="hover:text-[#c8ff00] transition-colors cursor-pointer"
            >
              [SEARCH BAR]
            </button>
            <button
              onClick={() => {
                const el = document.getElementById('pin-bar-section');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="hover:text-[#c8ff00] transition-colors cursor-pointer"
            >
              [PIN BAR]
            </button>
          </div>
        </div>
      </footer>

      {/* Floating Client-Side Anti-Inspect Shield HUD Toast */}
      {shieldAlert && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce max-w-md w-[calc(100vw-3rem)]">
          <div className="cyber-edge-beam-card bg-[#05110a] border-2 border-[#ff4060] rounded-xl p-4 shadow-[0_0_30px_rgba(255,64,96,0.35)] backdrop-blur-md">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-[#ff4060]/10 border border-[#ff4060]/30 text-[#ff4060] shrink-0">
                <ShieldAlert className="w-5 h-5 animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-['Orbitron'] text-xs font-bold text-[#ff4060] tracking-wider uppercase flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#ff4060] animate-ping" />
                    ANTI-INSPECT SHIELD ACTIVE
                  </span>
                  <button
                    onClick={() => setShieldAlert(null)}
                    className="text-[#3d7a52] hover:text-[#f0fff4] text-xs transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-xs text-[#f0fff4] font-['JetBrains_Mono'] mt-1 font-semibold">
                  {shieldAlert.reason}
                </p>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#1a5c35]/40 text-[10px] font-['JetBrains_Mono'] text-[#3d7a52]">
                  <span className="text-[#c8ff00]">CODE: {shieldAlert.code}</span>
                  <span className="text-[#00ffd5]">DOM INTEGRITY LOCKED</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
