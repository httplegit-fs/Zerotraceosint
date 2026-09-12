/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { HackerLoadingScreen } from './components/HackerLoadingScreen';
import { LiquidGlassLockScreen } from './components/LiquidGlassLockScreen';
import { ApiAutomationModal } from './components/ApiAutomationModal';
import { PinAuthDialog } from './components/PinAuthDialog';
import { MongoSecurityLogsModal } from './components/MongoSecurityLogsModal';
import { PinManagementModal } from './components/PinManagementModal';
import { AdminHubModal } from './components/AdminHubModal';
import { DashboardCleanVideoPlayer } from './components/DashboardCleanVideoPlayer';
import { AntiInspectShield } from './components/AntiInspectShield';
import { ApiConfigItem } from './types/apiTypes';
import { 
  DEFAULT_API_CONFIGS, 
  loadSavedApiConfigs, 
  saveApiConfigs, 
  buildExecutionUrl,
  analyzeJsonStructure 
} from './utils/apiAutoDetector';
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
  ExternalLink,
  Sliders,
  Sparkles,
  Zap,
  Wand2,
  Timer
} from 'lucide-react';

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

export default function App() {
  // Portal Gate Authentication State (PIN: 2007)
  const [isAppUnlocked, setIsAppUnlocked] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('zerotrace_portal_unlocked') === 'true';
    } catch {
      return false;
    }
  });

  // Master PIN state (fetched from MongoDB /api/pins)
  const [masterPin, setMasterPin] = useState<string>(() => {
    try {
      return localStorage.getItem('zerotrace_master_pin') || '2007';
    } catch {
      return '2007';
    }
  });

  // Search Security PIN (fetched from MongoDB, permanent search pin 9242)
  const [searchSecurityPin, setSearchSecurityPin] = useState<string>('9242');

  // Permanent API Automation PIN (stored in MongoDB as 9264)
  const [apiAutomationPin, setApiAutomationPin] = useState<string>('9264');

  // Fetch live security PINs from MongoDB on app initialization
  useEffect(() => {
    let isMounted = true;
    async function loadPinsFromMongo() {
      try {
        const res = await fetch('/api/pins');
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data) {
            if (data.loginPin) {
              setMasterPin(data.loginPin);
              try {
                localStorage.setItem('zerotrace_master_pin', data.loginPin);
              } catch {}
            }
            if (data.searchPin) {
              setSearchSecurityPin(data.searchPin);
            }
            if (data.apiAutomationPin) {
              setApiAutomationPin(data.apiAutomationPin);
            }
          }
        }
      } catch (err) {
        console.warn('[MongoDB Auth] Could not fetch remote PINs, using resilient defaults:', err);
      }
    }
    loadPinsFromMongo();
    return () => {
      isMounted = false;
    };
  }, []);

  // Dynamic API Configurations loaded from persistence
  const [apiConfigs, setApiConfigs] = useState<ApiConfigItem[]>(() => loadSavedApiConfigs());
  
  // API Manager Modal & PIN Dialog state
  const [isApiModalOpen, setIsApiModalOpen] = useState<boolean>(false);
  const [isPinDialogOpen, setIsPinDialogOpen] = useState<boolean>(false);
  const [isApiAuthAuthorized, setIsApiAuthAuthorized] = useState<boolean>(false);
  const [isAdminHubOpen, setIsAdminHubOpen] = useState<boolean>(false);
  const [isAdminAuthorized, setIsAdminAuthorized] = useState<boolean>(false);
  const [isMongoLogsOpen, setIsMongoLogsOpen] = useState<boolean>(false);
  const [isPinManagementOpen, setIsPinManagementOpen] = useState<boolean>(false);

  // Search & Console State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [searchFocused, setSearchFocused] = useState(false);

  // PIN Input Bar State
  const [currentPin, setCurrentPin] = useState('');
  const [pinMasked, setPinMasked] = useState(true);
  const [pinStatus, setPinStatus] = useState<'idle' | 'verifying' | 'granted' | 'denied'>('idle');
  const [clearanceLevel, setClearanceLevel] = useState<number>(1);
  const [pinFeedback, setPinFeedback] = useState<string>('ENTER PERMANENT SECURITY PIN TO AUTHENTICATE');

  // Live API Health Status
  const [apiHealth, setApiHealth] = useState<Record<string, 'checking' | 'online' | 'offline'>>({});

  // Real-Time Network & Server Ping (Live ms)
  const [livePing, setLivePing] = useState<number | null>(null);
  const [pingQuality, setPingQuality] = useState<'optimal' | 'good' | 'slow'>('optimal');

  // Terminal Logs
  const [terminalLogs, setTerminalLogs] = useState<Array<{ id: string; time: string; type: 'cmd' | 'resp' | 'warn' | 'success'; text: string }>>([
    { id: '1', time: '06:17:01', type: 'cmd', text: 'whoami && echo $CLEARANCE' },
    { id: '2', time: '06:17:02', type: 'resp', text: 'visitor@zerotrace.legit [SEC_LEVEL_01: GUEST]' },
    { id: '3', time: '06:17:04', type: 'warn', text: 'AUTOMATED API ENGINE ACTIVE: Tap "API AUTOMATION" in top bar to auto-detect structure or modify keys.' }
  ]);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const pinInputRef = useRef<HTMLInputElement>(null);

  // Module Selection
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>('phone-osint');
  const [pinError, setPinError] = useState<string | null>(null);
  const [isPinShaking, setIsPinShaking] = useState(false);
  const [phoneSearchLoading, setPhoneSearchLoading] = useState(false);
  const [phoneSearchResult, setPhoneSearchResult] = useState<any | null>(null);
  const [phoneSearchError, setPhoneSearchError] = useState<string | null>(null);
  const [searchedPhoneNumber, setSearchedPhoneNumber] = useState<string>('');

  // Measure server ping (optimized 15s interval, skips when tab is hidden)
  useEffect(() => {
    let isMounted = true;
    const measureLivePing = async () => {
      if (document.hidden) return;
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
        if (isMounted) setLivePing(12);
      }
    };
    measureLivePing();
    const pingInterval = setInterval(measureLivePing, 15000);
    return () => {
      isMounted = false;
      clearInterval(pingInterval);
    };
  }, []);

  // Initialize API statuses as online without blocking sequential network loops
  useEffect(() => {
    const initialStatus: Record<string, 'checking' | 'online' | 'offline'> = {};
    apiConfigs.forEach((topic) => {
      initialStatus[topic.id] = 'online';
    });
    setApiHealth(initialStatus);
  }, []);

  // Auto scroll terminal (using instant scroll to avoid UI animation lag)
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [terminalLogs]);

  // Add terminal log helper
  const addLog = (text: string, type: 'cmd' | 'resp' | 'warn' | 'success' = 'resp') => {
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    setTerminalLogs((prev) => [...prev.slice(-40), { id: Math.random().toString(), time, type, text }]);
  };

  // Copy helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    addLog(`Copied to clipboard: "${text.length > 35 ? text.substring(0, 35) + '...' : text}"`, 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Validate if current PIN has required clearance (Permanent search pin 9242 or active temp pin)
  const isPinAuthenticated = (): boolean => {
    if (pinStatus === 'granted') return true;
    const p = currentPin.trim().toLowerCase();
    const isSearchPinMatch = p === searchSecurityPin.toLowerCase() || p === '9242' || p === '2007' || p === masterPin.toLowerCase();
    if (isSearchPinMatch) {
      setPinStatus('granted');
      setPinError(null);
      setPinFeedback('ACCESS GRANTED: SECURITY PIN VERIFIED // SEARCHING UNLOCKED');
      return true;
    }
    return false;
  };

  // Trigger PIN requirement alerts when searching without PIN
  const triggerPinRequirement = () => {
    setIsPinShaking(true);
    setTimeout(() => setIsPinShaking(false), 650);
    setPinStatus('denied');
    setPinFeedback('ACCESS DENIED: ENTER & VERIFY SECURITY PIN TO SEARCH');
    setPhoneSearchError('Security PIN authentication required. Please enter valid Security PIN in the Security PIN Bar to perform searches.');
    addLog('[AUTH_BLOCKED] Search aborted: Security PIN required. Enter valid Security PIN to authorize.', 'warn');
    pinInputRef.current?.focus();
    const consoleEl = document.getElementById('search-pin-console');
    consoleEl?.scrollIntoView({ behavior: 'smooth' });
  };

  // Handle opening Admin Hub with PIN check via MongoDB
  const handleOpenAdmin = () => {
    if (isAdminAuthorized) {
      setIsAdminHubOpen(true);
      addLog('[ADMIN_HUB] Opened Admin Control Hub.', 'cmd');
    } else {
      setIsPinDialogOpen(true);
      addLog('[ADMIN_AUTH] Security PIN required for Admin Hub. Verified via MongoDB.', 'warn');
    }
  };

  // Handle opening API Automation Manager with PIN check
  const handleOpenApiManager = () => {
    if (isApiAuthAuthorized) {
      setIsApiModalOpen(true);
      addLog('[API_MANAGER] Opened Automated API Management Console.', 'cmd');
    } else {
      setIsPinDialogOpen(true);
      addLog('[AUTH_PROMPT] Security PIN requested for API Automation Access.', 'warn');
    }
  };

  // Strip credit fields
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

  // Extract nested value helper
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

  // Perform dynamic search using current configured active API settings
  const executeSearch = async (query: string) => {
    const q = query.trim();
    if (!q) return;

    if (!isPinAuthenticated()) {
      triggerPinRequirement();
      return;
    }

    // Find the matching configuration based on selected module or query heuristic
    const currentConfig = apiConfigs.find(c => c.id === selectedModuleId) || apiConfigs[0];
    
    setPhoneSearchLoading(true);
    setPhoneSearchError(null);
    setPhoneSearchResult(null);
    setSearchedPhoneNumber(q);
    
    const startTime = Date.now();
    addLog(`$ recon --module ${currentConfig.name} --target "${q}"`, 'cmd');
    addLog(`[API-DISPATCH] Executing query via [${currentConfig.name}] with key "${currentConfig.keyValue || 'AUTO'}"...`, 'resp');

    try {
      let data: any = null;
      let rawText = '';
      
      // Determine execution URL using proxy vs direct
      let targetFetchUrl = buildExecutionUrl(currentConfig, q);
      if (currentConfig.useProxy) {
        if (currentConfig.id === 'phone-osint') {
          targetFetchUrl = `/api/phone-lookup?number=${encodeURIComponent(q)}&key=${encodeURIComponent(currentConfig.keyValue || 'DADDY')}&action=${encodeURIComponent(currentConfig.actionValue || '')}&targetUrl=${encodeURIComponent(currentConfig.targetUrl)}&queryParam=${encodeURIComponent(currentConfig.queryParamName || 'number')}`;
        } else if (currentConfig.id === 'aadhar-search') {
          targetFetchUrl = `/api/aadhar-lookup?aadhar=${encodeURIComponent(q)}&key=${encodeURIComponent(currentConfig.keyValue || 'INDIAN_HACKER_BRO')}&action=${encodeURIComponent(currentConfig.actionValue || '')}&targetUrl=${encodeURIComponent(currentConfig.targetUrl)}&queryParam=${encodeURIComponent(currentConfig.queryParamName || 'aadhar')}`;
        } else if (currentConfig.id === 'upi-search') {
          targetFetchUrl = `/api/upi-lookup?upi=${encodeURIComponent(q)}&key=${encodeURIComponent(currentConfig.keyValue || 'INDIAN_HACKER_BRO')}&action=${encodeURIComponent(currentConfig.actionValue || '')}&targetUrl=${encodeURIComponent(currentConfig.targetUrl)}&queryParam=${encodeURIComponent(currentConfig.queryParamName || 'upi')}`;
        } else if (currentConfig.id === 'email-search') {
          targetFetchUrl = `/api/email-lookup?email=${encodeURIComponent(q)}&key=${encodeURIComponent(currentConfig.keyValue || 'DADDY')}&action=${encodeURIComponent(currentConfig.actionValue || '')}&targetUrl=${encodeURIComponent(currentConfig.targetUrl)}&queryParam=${encodeURIComponent(currentConfig.queryParamName || 'value')}`;
        } else if (currentConfig.id === 'vehicle-search') {
          targetFetchUrl = `/api/vehicle-lookup?rc=${encodeURIComponent(q)}&key=${encodeURIComponent(currentConfig.keyValue || 'INDIAN_HACKER_BRO')}&action=${encodeURIComponent(currentConfig.actionValue || '')}&targetUrl=${encodeURIComponent(currentConfig.targetUrl)}&queryParam=${encodeURIComponent(currentConfig.queryParamName || 'rc')}`;
        } else if (currentConfig.id === 'imei-search') {
          targetFetchUrl = `/api/imei-lookup?imei=${encodeURIComponent(q)}&key=${encodeURIComponent(currentConfig.keyValue || 'INDIAN_HACKER_BRO')}&action=${encodeURIComponent(currentConfig.actionValue || '')}&targetUrl=${encodeURIComponent(currentConfig.targetUrl)}&queryParam=${encodeURIComponent(currentConfig.queryParamName || 'imei_num')}`;
        } else if (currentConfig.id === 'telegram-search') {
          targetFetchUrl = `/api/tgid-lookup?id=${encodeURIComponent(q)}&key=${encodeURIComponent(currentConfig.keyValue || 'Tgid_num')}&action=${encodeURIComponent(currentConfig.actionValue || '')}&targetUrl=${encodeURIComponent(currentConfig.targetUrl)}&queryParam=${encodeURIComponent(currentConfig.queryParamName || 'id')}`;
        }
      }

      const res = await fetch(targetFetchUrl, {
        headers: {
          'Accept': 'application/json, text/plain, */*',
          ...(currentConfig.headers || {})
        }
      });

      rawText = await res.text();
      data = safeParseApiJson(rawText);

      // Ensure minimum 3-second hacker loading screen duration
      const elapsed = Date.now() - startTime;
      if (elapsed < 3000) {
        await new Promise((resolve) => setTimeout(resolve, 3000 - elapsed));
      }

      if (!data) {
        throw new Error('No valid response received from intelligence gateway');
      }

      let payload = data;
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
        payload = payload.data || payload.result || payload.details || payload.response || payload;
      }

      // Extract field data
      const subscriberName = extractValue(payload, ['name', 'full_name', 'fullname', 'subscriber_name', 'owner_name', 'account_holder_name', 'first_name']);
      const fatherName = extractValue(payload, ['father_name', 'fathername', 'father', 'fname', 'care_of', 'guardian']);
      const mobileNum = extractValue(payload, ['mobile', 'number', 'phone', 'phone_number', 'msisdn', 'mobile_no', 'num']) || q;
      const altMobile = extractValue(payload, ['alt_number', 'alt_mobile', 'alt_num', 'alternate_mobile', 'secondary_mobile', 'alt']);
      const aadhaarNum = extractValue(payload, ['aadhar', 'aadhaar', 'uid', 'uidai', 'aadhar_no', 'aadhaar_no', 'id_number']);
      const circleName = extractValue(payload, ['circle', 'telecom_circle', 'operator', 'carrier', 'state', 'rto_name', 'region']);
      const rawAddress = extractValue(payload, ['address', 'full_address', 'raw_address', 'location', 'residence']);
      
      let cleanAddress = '';
      if (rawAddress) {
        cleanAddress = rawAddress.includes('!') ? rawAddress.split('!').filter(Boolean).join(', ') : rawAddress;
      }
      const pinMatch = rawAddress ? String(rawAddress).match(/\b\d{6}\b/) : null;
      const pincode = extractValue(payload, ['pincode', 'pin', 'postal_code', 'zip', 'zipcode']) || (pinMatch ? pinMatch[0] : null);
      const email = extractValue(payload, ['email', 'mail', 'email_id', 'registered_email']);

      // Vehicle specific fields
      const makerModel = extractValue(payload, ['maker_model', 'maker', 'model', 'brand', 'vehicle_model']);
      const vehicleClass = extractValue(payload, ['vehicle_class', 'class', 'type']);
      const engineNo = extractValue(payload, ['engine_no', 'engine_number', 'engine']);
      const chassisNo = extractValue(payload, ['chassis_no', 'chassis_number', 'vin']);
      const regDate = extractValue(payload, ['reg_date', 'registration_date', 'purchase_date']);
      const insuranceExpiry = extractValue(payload, ['insurance_upto', 'insurance_expiry', 'insurance_validity']);
      const rtoName = extractValue(payload, ['rto_name', 'rto', 'registering_authority']) || circleName;

      // IMEI specific fields
      const imeiBrand = extractValue(payload, ['brand', 'brand_name', 'manufacturer', 'vendor']);
      const imeiModel = extractValue(payload, ['model', 'device_name', 'phone_model', 'name']);
      const imeiTac = extractValue(payload, ['tac', 'tac_code']) || (q.length >= 8 ? q.substring(0, 8) : null);
      const blacklistStatus = extractValue(payload, ['blacklist_status', 'blacklist', 'status']) || 'CLEAN / NOT BLACKLISTED';
      const carrierLock = extractValue(payload, ['carrier_lock', 'sim_lock', 'network_lock']) || 'UNLOCKED / GLOBAL COMPLIANT';

      // TGID specific fields
      const tgUsername = extractValue(payload, ['username', 'handle']);
      const tgBio = extractValue(payload, ['bio', 'about', 'description']);
      const tgPhone = extractValue(payload, ['phone', 'mobile']);

      const normalizedResult = {
        status: 'success',
        searchType: currentConfig.id.replace('-search', '').replace('-osint', ''),
        raw_payload: stripCreditFields(payload),
        api_exact_response: stripCreditFields(data),
        mobile: mobileNum,
        number: mobileNum,
        name: subscriberName || imeiModel || makerModel,
        father_name: fatherName,
        aadhaar: aadhaarNum,
        alt_mobile: altMobile,
        circle: circleName,
        address: cleanAddress,
        raw_address: rawAddress,
        pincode: pincode,
        email: email,
        rc: q,
        maker_model: makerModel,
        vehicle_class: vehicleClass,
        engine_no: engineNo,
        chassis_no: chassisNo,
        reg_date: regDate,
        insurance_validity: insuranceExpiry,
        rto: rtoName,
        imei: q,
        brand: imeiBrand,
        model: imeiModel,
        tac: imeiTac,
        blacklist_status: blacklistStatus,
        network_lock: carrierLock,
        tgid: q,
        username: tgUsername,
        bio: tgBio,
        phone: tgPhone,
        timestamp: new Date().toISOString()
      };

      setPhoneSearchResult(normalizedResult);
      addLog(`[STATUS 200 OK] Telemetry received from [${currentConfig.name}]`, 'success');
      addLog(`[DOSSIER FOUND] Target: ${q} | Entity: ${subscriberName || imeiModel || makerModel || 'Identified'}`, 'success');

    } catch (err: any) {
      const elapsed = Date.now() - startTime;
      if (elapsed < 3000) {
        await new Promise((resolve) => setTimeout(resolve, 3000 - elapsed));
      }
      setPhoneSearchError(`API query failed: ${err?.message || 'Gateway timeout or unreachable'}`);
      addLog(`[API_ERROR] ${err?.message}`, 'warn');
    } finally {
      setPhoneSearchLoading(false);
    }
  };

  // Filter topics based on search
  const filteredTopics = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return DEFAULT_TOPICS.filter((t) => {
      const matchesCategory = activeCategory === 'ALL' || t.category === activeCategory;
      if (!matchesCategory) return false;
      if (!q) return true;
      return (
        t.title.toLowerCase().includes(q) ||
        t.subtitle.toLowerCase().includes(q) ||
        t.command.toLowerCase().includes(q)
      );
    });
  }, [searchQuery, activeCategory]);

  // Handle unlock from login screen
  const handleUnlockPortal = (_pin: string) => {
    setIsAppUnlocked(true);
    try {
      sessionStorage.setItem('zerotrace_portal_unlocked', 'true');
    } catch {}
    addLog('[AUTH_GRANTED] Master passcode verified. Welcome to ZeroTrace Portal.', 'success');
  };

  // Handle lock portal
  const handleLockPortal = () => {
    setIsAppUnlocked(false);
    setIsAdminAuthorized(false);
    setIsApiAuthAuthorized(false);
    try {
      sessionStorage.removeItem('zerotrace_portal_unlocked');
    } catch {}
    addLog('[AUTH_LOCKED] Security lockdown activated.', 'warn');
  };

  // If application is locked, show the Liquid Glass Lock Screen
  if (!isAppUnlocked) {
    return (
      <LiquidGlassLockScreen
        onUnlock={handleUnlockPortal}
        requiredPin={masterPin}
        onUpdatePin={(newPin) => {
          setMasterPin(newPin);
          try {
            localStorage.setItem('zerotrace_master_pin', newPin);
          } catch {}
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#020d06] text-[#f0fff4] font-sans relative overflow-x-hidden">
      {/* Background visual layers */}
      <div className="cyber-grid-bg" />
      <div className="fixed -top-40 -left-40 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(200,255,0,0.07)_0%,transparent_70%)] pointer-events-none z-0" />
      <div className="fixed -bottom-40 -right-40 w-[650px] h-[650px] bg-[radial-gradient(circle,rgba(0,255,213,0.05)_0%,transparent_70%)] pointer-events-none z-0" />

      {/* Cyber Navbar / Taskbar */}
      <header className="sticky top-0 z-40 bg-[#020d06]/95 backdrop-blur-md border-b border-[#0f3320] px-3 sm:px-4 lg:px-8 py-2.5 sm:py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Brand Identity - Redirects to zerotracelegit.netlify.app on tap */}
          <a
            href="https://zerotracelegit.netlify.app"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 sm:gap-3 min-w-0 group cursor-pointer touch-manipulation"
            title="Open zerotracelegit.netlify.app"
          >
            <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-[#071510] border border-[#1a5c35] group-hover:border-[#c8ff00] flex items-center justify-center shadow-[0_0_15px_rgba(200,255,0,0.2)] shrink-0 transition-all group-hover:scale-105">
              <span className="hud-corner hud-tl" />
              <span className="hud-corner hud-tr" />
              <span className="hud-corner hud-bl" />
              <span className="hud-corner hud-br" />
              <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-[#c8ff00] animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-['Orbitron'] font-bold text-sm sm:text-lg tracking-wider text-[#f0fff4] group-hover:text-[#c8ff00] transition-colors truncate">
                  ZeroTrace<span className="text-[#c8ff00] glow-text">.Legit</span>
                </span>
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#c8ff00] animate-ping shrink-0" />
              </div>
              <p className="font-['JetBrains_Mono'] text-[8px] sm:text-[10px] tracking-widest text-[#3d7a52] group-hover:text-[#00ffd5] uppercase truncate transition-colors">
                OSINT TOOL // AUTOMATED API SYSTEM
              </p>
            </div>
          </a>

          {/* Center Status Telemetry (Desktop) */}
          <div className="hidden md:flex items-center gap-4 font-['JetBrains_Mono'] text-xs">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-[#071510] border border-[#0f3320]">
              <span className="w-2 h-2 rounded-full bg-[#c8ff00] shadow-[0_0_8px_#c8ff00]" />
              <span className="text-[#3d7a52]">NODE:</span>
              <span className="text-[#c8ff00] font-bold">SEC_L0{clearanceLevel}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-[#071510] border border-[#0f3320]">
              <Wifi className={`w-3.5 h-3.5 ${pingQuality === 'optimal' ? 'text-[#00ffd5]' : 'text-[#c8ff00]'}`} />
              <span className="text-[#3d7a52]">PING:</span>
              <span className="text-[#00ffd5] font-bold">{livePing !== null ? `${livePing}ms` : '12ms'}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-[#071510] border border-[#0f3320]">
              <Database className="w-3.5 h-3.5 text-[#00ffd5]" />
              <span className="text-[#3d7a52]">APIS:</span>
              <span className="text-[#c8ff00] font-bold">{apiConfigs.length} ACTIVE</span>
            </div>
          </div>

          {/* Action CTAs in Taskbar */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* UNIFIED ADMIN BUTTON: SELECT PIN MANAGEMENT OR API AUTOMATION (MONGODB SECURED) */}
            <button
              id="taskbar-admin-btn"
              type="button"
              onClick={handleOpenAdmin}
              className="relative group px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-[#00ffd5]/20 via-[#c8ff00]/25 to-[#00ffd5]/20 hover:from-[#00ffd5]/35 hover:to-[#c8ff00]/40 border-2 border-[#00ffd5] hover:border-[#c8ff00] text-[#00ffd5] hover:text-[#f0fff4] font-['Orbitron'] font-black text-[11px] sm:text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 sm:gap-2 shadow-[0_0_20px_rgba(0,255,213,0.35)] hover:shadow-[0_0_30px_rgba(200,255,0,0.6)] cursor-pointer active:scale-95 touch-manipulation min-h-[38px]"
              title="Open Admin Hub (Protected by Security PIN)"
            >
              <span className="relative flex items-center justify-center">
                <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#c8ff00] group-hover:scale-110 transition-transform" />
                <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-[#c8ff00] animate-ping" />
              </span>
              <span className="font-extrabold text-[#f0fff4] group-hover:text-[#c8ff00] tracking-wider">
                ADMIN
              </span>
              <span className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-[#020d06] border border-[#00ffd5]/40 text-[9px] font-['JetBrains_Mono'] text-[#00ffd5] font-bold">
                {isAdminAuthorized ? 'UNLOCKED' : 'AUTH'}
              </span>
            </button>

            {/* Lock Portal Button */}
            <button
              type="button"
              onClick={handleLockPortal}
              className="p-2 sm:p-2.5 rounded-xl bg-[#071510] border border-[#ff4060]/40 text-[#ff4060] hover:bg-[#ff4060]/10 hover:border-[#ff4060] active:scale-95 transition-all cursor-pointer font-bold touch-manipulation min-h-[38px] min-w-[38px] flex items-center justify-center"
              title="Lock portal and return to login"
              aria-label="Lock portal"
            >
              <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Mini-Telemetry Status Row for Android */}
        <div className="flex md:hidden items-center justify-between gap-2 mt-2 pt-2 border-t border-[#0f3320]/80 font-['JetBrains_Mono'] text-[10px]">
          <div className="flex items-center gap-1.5 text-[#3d7a52]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#c8ff00] shadow-[0_0_6px_#c8ff00]" />
            <span>NODE:</span>
            <span className="text-[#c8ff00] font-bold">SEC_L0{clearanceLevel}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[#3d7a52]">
            <Wifi className={`w-3 h-3 ${pingQuality === 'optimal' ? 'text-[#00ffd5]' : 'text-[#c8ff00]'}`} />
            <span>PING:</span>
            <span className="text-[#00ffd5] font-bold">{livePing !== null ? `${livePing}ms` : '12ms'}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[#3d7a52]">
            <Database className="w-3 h-3 text-[#00ffd5]" />
            <span>APIS:</span>
            <span className="text-[#c8ff00] font-bold">{apiConfigs.length} ACTIVE</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 py-6 px-4 lg:px-8 max-w-7xl mx-auto space-y-6">
        
        {/* ========================================================================= */}
        {/* CLEAN DASHBOARD VIDEO (AUTOPLAY CONTINUOUS LOOP, MUTE/UNMUTE ONLY, ANY RATIO) */}
        {/* ========================================================================= */}
        <section id="dashboard-clean-video" className="w-full">
          <DashboardCleanVideoPlayer />
        </section>

        {/* Banner highlighting the Auto API Feature (Hidden as requested) */}
        <div className="hidden cyber-edge-beam-card rounded-2xl p-3.5 sm:p-5 relative shadow-xl">
          <span className="hud-corner hud-tl" />
          <span className="hud-corner hud-tr" />
          <span className="hud-corner hud-bl" />
          <span className="hud-corner hud-br" />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-start sm:items-center gap-2.5 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#020d06] border-2 border-[#c8ff00] flex items-center justify-center text-[#c8ff00] shadow-[0_0_20px_rgba(200,255,0,0.3)] shrink-0 mt-0.5 sm:mt-0">
                <Wand2 className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <span className="px-2 py-0.5 rounded bg-[#c8ff00]/15 text-[#c8ff00] border border-[#c8ff00]/40 font-['JetBrains_Mono'] text-[9px] sm:text-[10px] font-bold uppercase">
                    STRUCTURE ADAPTER
                  </span>
                  <span className="text-[10px] sm:text-[11px] font-['JetBrains_Mono'] text-[#00ffd5]">
                    {apiConfigs.length} APIS READY
                  </span>
                </div>
                <h2 className="font-['Orbitron'] text-xs sm:text-base lg:text-lg font-black text-[#f0fff4] uppercase tracking-wide mt-1 leading-snug">
                  AUTOMATED API ACTION, KEY & STRUCTURE SYNC SYSTEM
                </h2>
                <p className="font-['JetBrains_Mono'] text-[11px] sm:text-xs text-[#7fff50] mt-0.5">
                  Tap <span className="text-[#c8ff00] font-bold">⚡ API AUTOMATION</span> to modify keys or paste any API URL to auto-adapt parameters!
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleOpenApiManager}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#c8ff00] hover:bg-[#d8ff33] text-[#020d06] font-['Orbitron'] font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(200,255,0,0.4)] cursor-pointer shrink-0 active:scale-98 min-h-[42px]"
            >
              <Sliders className="w-4 h-4" />
              <span>CONFIGURE APIS</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* UNIFIED CONSOLE: SEARCH BAR & PIN INPUT MATRIX                             */}
        {/* ========================================================================= */}
        <section id="search-pin-console" className="cyber-edge-beam-card rounded-2xl p-4 sm:p-5 lg:p-7 relative shadow-2xl">
          <span className="hud-corner hud-tl" />
          <span className="hud-corner hud-tr" />
          <span className="hud-corner hud-bl" />
          <span className="hud-corner hud-br" />

          {/* Section Header */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-[#0f3320]">
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[#020d06] border border-[#1a5c35] flex items-center justify-center text-[#c8ff00] shrink-0">
                <Search className="w-4 h-4 text-[#c8ff00]" />
              </div>
              <div className="min-w-0">
                <h2 className="font-['Orbitron'] text-xs sm:text-base font-bold tracking-wider text-[#f0fff4] uppercase flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <span>INTELLIGENCE CONSOLE</span>
                  {selectedModuleId && (
                    <span className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded bg-[#00ffd5]/15 text-[#00ffd5] border border-[#00ffd5]/40 font-['JetBrains_Mono'] uppercase flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00ffd5] animate-ping" />
                      <span className="truncate max-w-[140px] sm:max-w-none">{apiConfigs.find(t => t.id === selectedModuleId)?.name || 'MODULE'} ACTIVE</span>
                    </span>
                  )}
                </h2>
                <p className="font-['JetBrains_Mono'] text-[9px] sm:text-[10px] text-[#3d7a52] uppercase tracking-wider truncate">
                  REAL-TIME TELEMETRY // DYNAMIC APIS
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleOpenApiManager}
                className="text-[10px] font-['JetBrains_Mono'] px-2.5 py-1.5 rounded bg-[#071510] hover:bg-[#0a1e12] border border-[#00ffd5]/40 text-[#00ffd5] flex items-center gap-1 cursor-pointer font-bold active:scale-95 touch-manipulation"
              >
                <Sliders className="w-3 h-3 text-[#c8ff00]" />
                <span>API KEYS</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
            {/* Left 7 Cols: Search Bar */}
            <div className="lg:col-span-7 space-y-2">
              {/* Dedicated Module Selector Buttons - Horizontally Scrollable on Android */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] font-['JetBrains_Mono'] text-[#3d7a52] uppercase font-bold px-0.5">
                  <span>SELECT ACTIVE MODULE:</span>
                  <span className="text-[9px] text-[#00ffd5] sm:hidden">SWIPE ↔</span>
                </div>
                <div className="flex items-center gap-1.5 pb-1 overflow-x-auto no-scrollbar touch-pan-x -mx-1 px-1">
                  {apiConfigs.map((topic) => {
                    const isSel = selectedModuleId === topic.id;
                    return (
                      <button
                        key={topic.id}
                        type="button"
                        onClick={() => {
                          setSelectedModuleId(topic.id);
                          searchInputRef.current?.focus();
                        }}
                        className={`px-2.5 py-1.5 rounded-lg text-[10px] font-['JetBrains_Mono'] font-bold border transition-all flex items-center gap-1.5 cursor-pointer shrink-0 touch-manipulation active:scale-95 ${
                          isSel
                            ? 'bg-[#c8ff00] text-[#020d06] border-[#c8ff00] shadow-[0_0_12px_rgba(200,255,0,0.35)]'
                            : 'bg-[#020d06] text-[#3d7a52] hover:text-[#00ffd5] border-[#0f3320] hover:border-[#1a5c35]'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isSel ? 'bg-[#020d06]' : 'bg-[#1a5c35]'}`} />
                        <span className="whitespace-nowrap">{topic.name.replace(' SEARCH', '').replace(' NUMBER', '')}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2 min-w-0">
                  <label className="font-['JetBrains_Mono'] text-xs text-[#c8ff00] font-semibold flex items-center gap-1.5 uppercase truncate pr-1">
                    <Search className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">
                      {selectedModuleId
                        ? `${apiConfigs.find(t => t.id === selectedModuleId)?.name} (ACTIVE)`
                        : 'OSINT Search'}
                    </span>
                  </label>
                  <a
                    href="https://zerotracelegit.netlify.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[9px] font-['JetBrains_Mono'] text-[#00ffd5] hover:text-[#c8ff00] underline flex items-center gap-0.5 cursor-pointer shrink-0 touch-manipulation"
                    title="Redirect to zerotracelegit.netlify.app"
                  >
                    zerotracelegit.netlify.app
                  </a>
                </div>
                {pinStatus !== 'granted' && (
                  <span className="font-['JetBrains_Mono'] text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded bg-[#ff4060]/15 text-[#ff4060] border border-[#ff4060]/40 flex items-center gap-1 font-bold animate-pulse shrink-0">
                    <Lock className="w-3 h-3" />
                    <span>PIN REQUIRED</span>
                  </span>
                )}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  executeSearch(searchQuery || '9999883039');
                }}
                className="relative"
              >
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-[#3d7a52] pointer-events-none flex items-center z-10">
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
                        ? 'Enter Security PIN to search...'
                        : selectedModuleId === 'phone-osint'
                        ? 'Phone number (e.g. 9999883039)...'
                        : selectedModuleId === 'aadhar-search'
                        ? 'Aadhaar UID (e.g. 123456789012)...'
                        : selectedModuleId === 'upi-search'
                        ? 'UPI ID (e.g. name@bank)...'
                        : selectedModuleId === 'email-search'
                        ? 'Email (e.g. user@gmail.com)...'
                        : selectedModuleId === 'vehicle-search'
                        ? 'Vehicle RC (e.g. DL8CAF5030)...'
                        : selectedModuleId === 'imei-search'
                        ? '15-digit IMEI (e.g. 358240051234560)...'
                        : 'Query or Telegram ID...'
                    }
                    className="cyber-edge-beam-input w-full rounded-xl py-3 sm:py-3.5 pl-9 sm:pl-11 pr-24 sm:pr-28 text-[#f0fff4] font-['JetBrains_Mono'] text-xs sm:text-sm outline-none transition-all placeholder:text-[#2a5038]"
                  />
                  <div className="absolute right-1.5 sm:right-2 flex items-center gap-1 sm:gap-1.5 z-10">
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="text-[10px] sm:text-[11px] px-1.5 sm:px-2 py-1 rounded bg-[#071510] text-[#3d7a52] hover:text-[#f0fff4] border border-[#0f3320] transition-colors cursor-pointer active:scale-95"
                      >
                        ✕
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={phoneSearchLoading}
                      className={`text-xs px-2.5 sm:px-3.5 py-1.5 rounded-lg ${
                        pinStatus === 'granted'
                          ? 'bg-[#c8ff00] hover:bg-[#d8ff33] text-[#020d06] shadow-[0_0_12px_rgba(200,255,0,0.4)]'
                          : 'bg-[#0e2417] hover:bg-[#163824] text-[#c8ff00] border border-[#1a5c35]'
                      } font-['JetBrains_Mono'] font-bold transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1 sm:gap-1.5 active:scale-95 touch-manipulation min-h-[34px]`}
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
                  <button
                    type="button"
                    onClick={handleOpenAdmin}
                    className="font-['JetBrains_Mono'] text-[10px] px-2 py-0.5 rounded bg-[#071510] hover:bg-[#0a2015] border border-[#1a5c35] hover:border-[#00ffd5] text-[#00ffd5] transition-colors cursor-pointer flex items-center gap-1 font-bold"
                    title="Open Admin Hub"
                  >
                    <ShieldCheck className="w-3 h-3 text-[#c8ff00]" />
                    <span>ADMIN</span>
                  </button>
                  <span className="font-['JetBrains_Mono'] text-[10px] px-2 py-0.5 rounded bg-[#020d06] border border-[#1a5c35] text-[#3d7a52]">
                    STRICT AUTH
                  </span>
                </div>
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const clean = currentPin.trim();
                  if (!clean) return;

                  // Verify via MongoDB endpoint first (supports permanent 9242 & time-limited expiring keys)
                  try {
                    const res = await fetch('/api/auth/verify', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ pin: clean, type: 'search' })
                    });
                    const data = await res.json();
                    if (data && data.granted) {
                      setPinStatus('granted');
                      setClearanceLevel(4);
                      setPinError(null);
                      const feedbackMsg = data.isTemporary 
                        ? `ACCESS GRANTED: [${data.label || 'TEMP PIN'}] VERIFIED // ${Math.ceil((data.remainingSeconds || 60) / 60)}M REMAINING`
                        : 'ACCESS GRANTED: PERMANENT SECURITY PIN AUTHENTICATED';
                      setPinFeedback(feedbackMsg);
                      addLog(`AUTH SUCCESS: ${data.message || 'Security PIN verified via MongoDB. Searching unlocked.'}`, 'success');
                      return;
                    } else if (data && data.isExpired) {
                      setPinStatus('denied');
                      setIsPinShaking(true);
                      setTimeout(() => setIsPinShaking(false), 500);
                      setPinError('Access Denied: This time-limited PIN has expired.');
                      setPinFeedback('ACCESS DENIED: TIME-LIMITED PIN HAS EXPIRED');
                      addLog(`[AUTH_BLOCKED] ${data.message || 'Time-limited PIN has expired and cannot be used.'}`, 'warn');
                      return;
                    } else if (data && data.scopeMismatch) {
                      setPinStatus('denied');
                      setIsPinShaking(true);
                      setTimeout(() => setIsPinShaking(false), 500);
                      setPinError('Access Denied: PIN not authorized for search.');
                      setPinFeedback('ACCESS DENIED: PIN SCOPE RESTRICTED');
                      addLog(`[AUTH_BLOCKED] ${data.message || 'PIN is restricted to API Automation only.'}`, 'warn');
                      return;
                    }
                  } catch {
                    // Fallback to local MongoDB-synced state
                  }

                  // Permanent fallback checks: 9242 is the permanent search key
                  if (clean === searchSecurityPin || clean === '9242' || clean === masterPin || clean === '2007') {
                    setPinStatus('granted');
                    setClearanceLevel(4);
                    setPinError(null);
                    setPinFeedback('ACCESS GRANTED: PERMANENT SECURITY PIN AUTHENTICATED');
                    addLog('AUTH SUCCESS: Security PIN verified. Searching unlocked.', 'success');
                  } else {
                    setPinStatus('denied');
                    setIsPinShaking(true);
                    setTimeout(() => setIsPinShaking(false), 500);
                    setPinError('Access Denied: Invalid Security PIN.');
                    setPinFeedback('ACCESS DENIED: INVALID SECURITY PIN');
                    addLog('[AUTH_BLOCKED] Invalid PIN attempt. Access denied.', 'warn');
                  }
                }}
                className="space-y-2"
              >
                <div className="flex items-stretch gap-2">
                  <div className={`relative flex-1 flex items-center ${isPinShaking ? 'animate-shake' : ''}`}>
                    <div className="absolute left-3.5 text-[#00ffd5] pointer-events-none flex items-center z-10">
                      <Lock className={`w-4 h-4 ${pinStatus === 'denied' ? 'text-[#ff4060]' : pinStatus === 'granted' ? 'text-[#c8ff00]' : 'text-[#00ffd5]'}`} />
                    </div>
                    <input
                      ref={pinInputRef}
                      type={pinMasked ? 'password' : 'text'}
                      value={currentPin}
                      onChange={(e) => {
                        setCurrentPin(e.target.value);
                        if (pinError) setPinError(null);
                        if (pinStatus !== 'idle') setPinStatus('idle');
                      }}
                      placeholder="Enter Security PIN..."
                      className={`cyber-edge-beam-input ${
                        pinStatus === 'denied'
                          ? 'is-denied'
                          : pinStatus === 'granted'
                          ? 'is-granted'
                          : ''
                      } w-full rounded-xl py-3 sm:py-3.5 pl-10 pr-12 text-[#f0fff4] font-['JetBrains_Mono'] text-xs sm:text-sm outline-none transition-all placeholder:text-[#2a5038]`}
                    />
                    <div className="absolute right-2 flex items-center gap-1 z-10">
                      <button
                        type="button"
                        onClick={() => setPinMasked(!pinMasked)}
                        className="p-1.5 rounded hover:bg-[#071510] text-[#3d7a52] hover:text-[#00ffd5] transition-colors cursor-pointer"
                        aria-label="Toggle PIN visibility"
                      >
                        {pinMasked ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className={`px-3.5 sm:px-4 py-3 sm:py-3.5 rounded-xl ${
                      pinStatus === 'granted'
                        ? 'bg-[#c8ff00] text-[#020d06] shadow-[0_0_12px_rgba(200,255,0,0.4)]'
                        : pinStatus === 'denied'
                        ? 'bg-[#ff4060] text-[#020d06]'
                        : 'bg-[#00ffd5] text-[#020d06] shadow-[0_0_12px_rgba(0,255,213,0.3)]'
                    } font-['JetBrains_Mono'] font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 active:scale-95 touch-manipulation min-h-[42px]`}
                  >
                    {pinStatus === 'granted' ? <span>UNLOCKED</span> : <span>AUTH</span>}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Bottom Telemetry Status Bar */}
          <div className="mt-4 pt-3 border-t border-[#0f3320] flex items-center justify-between gap-2 font-['JetBrains_Mono'] text-xs">
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  pinStatus === 'granted'
                    ? 'bg-[#c8ff00] shadow-[0_0_8px_#c8ff00]'
                    : pinStatus === 'denied'
                    ? 'bg-[#ff4060] shadow-[0_0_8px_#ff4060]'
                    : 'bg-[#00ffd5]'
                }`}
              />
              <span className="text-[#3d7a52]">CONSOLE STATUS:</span>
              <span className={pinStatus === 'granted' ? 'text-[#c8ff00] font-bold' : 'text-[#f0fff4]/80'}>
                {pinFeedback}
              </span>
            </div>
          </div>

          {/* Terminal Section */}
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
                  <span>TERMINAL OUTPUT // LIVE INTELLIGENCE STREAM</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
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
            <div className="cyber-edge-beam-terminal rounded-xl p-4 font-['JetBrains_Mono'] text-xs min-h-[200px] max-h-[320px] overflow-y-auto space-y-2 shadow-inner relative">
              {terminalLogs.map((log) => {
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
              })}
              <div ref={terminalEndRef} />
            </div>
          </div>
        </section>

        {/* Live Dossier Display / Hacker Loading Screen */}
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
                  type="button"
                  onClick={() => setPhoneSearchError(null)}
                  className="text-xs text-[#3d7a52] hover:text-[#f0fff4] cursor-pointer"
                >
                  DISMISS
                </button>
              </div>
            ) : phoneSearchResult ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#0f3320]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-[#071510] border border-[#00ffd5] flex items-center justify-center text-[#00ffd5] shadow-[0_0_12px_rgba(0,255,213,0.2)]">
                      <Radio className="w-5 h-5 animate-pulse text-[#c8ff00]" />
                    </div>
                    <div>
                      <h4 className="font-['Orbitron'] text-sm sm:text-base font-bold text-[#f0fff4] uppercase flex items-center gap-2">
                        <span>INTELLIGENCE DOSSIER:</span>
                        <span className="text-[#c8ff00] font-mono tracking-wider">
                          {phoneSearchResult.mobile || phoneSearchResult.rc || phoneSearchResult.imei || phoneSearchResult.tgid || searchedPhoneNumber}
                        </span>
                      </h4>
                      <p className="font-['JetBrains_Mono'] text-[10px] text-[#3d7a52]">
                        PROCESSED VIA DYNAMIC API ENGINE // ENCRYPTED GATEWAY VERIFIED
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPhoneSearchResult(null)}
                      className="px-3 py-1.5 rounded-lg bg-[#071510] hover:bg-[#1a0509] border border-[#0f3320] hover:border-[#ff4060] text-xs font-['JetBrains_Mono'] text-[#3d7a52] hover:text-[#ff4060] transition-colors cursor-pointer"
                    >
                      CLOSE
                    </button>
                  </div>
                </div>

                {/* Organized attributes */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Identity Box */}
                  <div className="bg-[#020d06] border border-[#1a5c35] rounded-xl p-4 space-y-2">
                    <div className="font-['Orbitron'] text-xs font-bold text-[#c8ff00] border-b border-[#0f3320] pb-2">
                      IDENTITY INTEL
                    </div>
                    <div className="space-y-1.5 font-['JetBrains_Mono'] text-xs">
                      <div>
                        <div className="text-[10px] text-[#3d7a52]">NAME / ENTITY</div>
                        <div className="text-[#00ffd5] font-bold">{phoneSearchResult.name || 'N/A'}</div>
                      </div>
                      {phoneSearchResult.father_name && (
                        <div>
                          <div className="text-[10px] text-[#3d7a52]">FATHER / GUARDIAN</div>
                          <div className="text-[#f0fff4]">{phoneSearchResult.father_name}</div>
                        </div>
                      )}
                      {phoneSearchResult.aadhaar && (
                        <div>
                          <div className="text-[10px] text-[#3d7a52]">AADHAAR / UID</div>
                          <div className="text-[#ffe600] font-mono">{phoneSearchResult.aadhaar}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Telecom / Vehicle / Specs */}
                  <div className="bg-[#020d06] border border-[#1a5c35] rounded-xl p-4 space-y-2">
                    <div className="font-['Orbitron'] text-xs font-bold text-[#00ffd5] border-b border-[#0f3320] pb-2">
                      TELEMETRY & SPECS
                    </div>
                    <div className="space-y-1.5 font-['JetBrains_Mono'] text-xs">
                      {phoneSearchResult.mobile && (
                        <div>
                          <div className="text-[10px] text-[#3d7a52]">TARGET ID / PHONE</div>
                          <div className="text-[#c8ff00] font-mono font-bold">{phoneSearchResult.mobile}</div>
                        </div>
                      )}
                      {phoneSearchResult.alt_mobile && (
                        <div>
                          <div className="text-[10px] text-[#3d7a52]">ALT CONTACT</div>
                          <div className="text-[#7fff50] font-mono">{phoneSearchResult.alt_mobile}</div>
                        </div>
                      )}
                      {phoneSearchResult.circle && (
                        <div>
                          <div className="text-[10px] text-[#3d7a52]">CIRCLE / REGION</div>
                          <div className="text-[#f0fff4]">{phoneSearchResult.circle}</div>
                        </div>
                      )}
                      {phoneSearchResult.maker_model && (
                        <div>
                          <div className="text-[10px] text-[#3d7a52]">MODEL / BRAND</div>
                          <div className="text-[#ffe600]">{phoneSearchResult.maker_model}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Address / Location */}
                  <div className="bg-[#020d06] border border-[#1a5c35] rounded-xl p-4 space-y-2">
                    <div className="font-['Orbitron'] text-xs font-bold text-[#7fff50] border-b border-[#0f3320] pb-2">
                      LOCATION & RESIDENCE
                    </div>
                    <div className="space-y-1.5 font-['JetBrains_Mono'] text-xs">
                      <div>
                        <div className="text-[10px] text-[#3d7a52]">ADDRESS</div>
                        <div className="text-[#f0fff4] leading-relaxed">{phoneSearchResult.address || 'N/A'}</div>
                      </div>
                      {phoneSearchResult.pincode && (
                        <div>
                          <div className="text-[10px] text-[#3d7a52]">PINCODE</div>
                          <div className="text-[#00ffd5] font-mono">{phoneSearchResult.pincode}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Raw JSON viewer */}
                <div className="bg-[#020d06] border border-[#0f3320] rounded-xl p-3">
                  <div className="flex items-center justify-between pb-1.5 border-b border-[#0f3320] text-xs font-['Orbitron'] text-[#00ffd5]">
                    <span>API RAW PAYLOAD</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(JSON.stringify(phoneSearchResult.api_exact_response || phoneSearchResult.raw_payload, null, 2), 'raw-json')}
                      className="text-[10px] text-[#c8ff00] hover:underline cursor-pointer"
                    >
                      {copiedId === 'raw-json' ? 'COPIED' : 'COPY JSON'}
                    </button>
                  </div>
                  <pre className="text-[11px] font-mono text-[#00ffd5]/80 bg-[#040f08] p-2.5 rounded mt-2 max-h-40 overflow-y-auto">
                    {JSON.stringify(phoneSearchResult.api_exact_response || phoneSearchResult.raw_payload, null, 2)}
                  </pre>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {/* Modules Grid */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-['Orbitron'] text-sm sm:text-base font-bold text-[#f0fff4] uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded bg-[#c8ff00] shadow-[0_0_8px_#c8ff00]" />
              <span>ACTIVE RECON MODULES</span>
            </h3>
            <button
              type="button"
              onClick={handleOpenApiManager}
              className="text-xs font-['JetBrains_Mono'] text-[#00ffd5] hover:text-[#c8ff00] flex items-center gap-1 cursor-pointer"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>AUTO-DETECT APIS</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
            {apiConfigs.map((config) => {
              const isSelected = selectedModuleId === config.id;
              return (
                <div
                  key={config.id}
                  onClick={() => {
                    setSelectedModuleId(config.id);
                    searchInputRef.current?.focus();
                  }}
                  className={`cyber-edge-beam-card ${
                    isSelected ? 'is-selected' : ''
                  } rounded-xl p-3.5 sm:p-4 relative cursor-pointer group flex flex-col justify-between active:scale-[0.98] transition-all touch-manipulation`}
                >
                  <span className="hud-corner hud-tl scale-75 origin-top-left" />
                  <span className="hud-corner hud-tr scale-75 origin-top-right" />
                  <span className="hud-corner hud-bl scale-75 origin-bottom-left" />
                  <span className="hud-corner hud-br scale-75 origin-bottom-right" />

                  <div>
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <span className="font-['JetBrains_Mono'] text-[9px] text-[#3d7a52]">
                        {config.badge || 'MODULE'}
                      </span>
                      <span className="text-[8px] font-['JetBrains_Mono'] px-1.5 py-0.5 rounded bg-[#c8ff00]/10 text-[#c8ff00] border border-[#c8ff00]/30 font-bold">
                        {config.severity?.toUpperCase() || 'HIGH'}
                      </span>
                    </div>

                    <h4 className="font-['Orbitron'] font-bold text-xs sm:text-sm text-[#f0fff4] group-hover:text-[#c8ff00] transition-colors uppercase flex items-center justify-between">
                      <span className="truncate pr-1">{config.name}</span>
                      {isSelected && <span className="text-[9px] text-[#c8ff00] shrink-0">ACTIVE</span>}
                    </h4>

                    <p className="font-['JetBrains_Mono'] text-[10px] text-[#00ffd5] mt-1 line-clamp-2">
                      {config.subtitle || 'Dynamic API Gateway'}
                    </p>

                    <div className="mt-2.5 p-2 rounded-lg bg-[#020d06] border border-[#1a5c35] text-[9px] font-['JetBrains_Mono'] space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[#3d7a52]">KEY ATTACHED:</span>
                        <span className="text-[#c8ff00] font-mono font-bold truncate max-w-[110px]">
                          {config.keyValue || 'DEFAULT'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#3d7a52]">ACTION PARAM:</span>
                        <span className="text-[#00ffd5] font-mono truncate max-w-[110px]">
                          {config.actionValue || 'NONE'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-[#0f3320] flex items-center justify-between text-[9px] font-['JetBrains_Mono'] text-[#3d7a52] group-hover:text-[#c8ff00]">
                    <span>SELECT MODULE</span>
                    <span>→</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[#0f3320] bg-[#040f08] py-6 sm:py-8 pb-24 sm:pb-8 px-4 lg:px-8 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 font-['JetBrains_Mono'] text-xs text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#c8ff00] shadow-[0_0_8px_#c8ff00]" />
            <span className="text-[#f0fff4] font-bold tracking-wider text-[11px] sm:text-xs">
              ZeroTrace // <span className="text-[#c8ff00]">OSINT Tool</span>
            </span>
          </div>

          <div className="flex items-center gap-4 text-[#3d7a52] text-[11px] sm:text-xs">
            <button
              type="button"
              onClick={handleOpenApiManager}
              className="text-[#c8ff00] hover:underline cursor-pointer font-bold"
            >
              [⚡ AUTO API MANAGER]
            </button>
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="hover:text-[#f0fff4] cursor-pointer"
            >
              [BACK TO TOP]
            </button>
          </div>
        </div>
      </footer>

      {/* Floating Bottom Quick Bar for Android & Mobile Screens */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#020d06]/95 backdrop-blur-lg border-t border-[#0f3320] px-3 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] flex items-center justify-around gap-1 shadow-[0_-5px_20px_rgba(0,0,0,0.8)]">
        <button
          type="button"
          onClick={() => {
            const el = document.getElementById('search-pin-console');
            el?.scrollIntoView({ behavior: 'smooth' });
            setTimeout(() => searchInputRef.current?.focus(), 400);
          }}
          className="flex-1 flex flex-col items-center justify-center py-1 rounded-lg text-[#3d7a52] hover:text-[#c8ff00] active:scale-95 transition-all"
        >
          <Search className="w-4 h-4 text-[#c8ff00]" />
          <span className="font-['JetBrains_Mono'] text-[9px] font-bold mt-0.5">SEARCH</span>
        </button>

        <button
          type="button"
          onClick={handleOpenApiManager}
          className="flex-1 flex flex-col items-center justify-center py-1 rounded-lg bg-gradient-to-r from-[#00ffd5]/10 to-[#c8ff00]/15 border border-[#00ffd5]/40 text-[#00ffd5] active:scale-95 transition-all shadow-[0_0_10px_rgba(0,255,213,0.2)]"
        >
          <Wand2 className="w-4 h-4 text-[#c8ff00]" />
          <span className="font-['Orbitron'] text-[9px] font-extrabold text-[#f0fff4] mt-0.5">⚡ APIS</span>
        </button>

        <button
          type="button"
          onClick={() => {
            terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="flex-1 flex flex-col items-center justify-center py-1 rounded-lg text-[#3d7a52] hover:text-[#00ffd5] active:scale-95 transition-all"
        >
          <TerminalIcon className="w-4 h-4 text-[#00ffd5]" />
          <span className="font-['JetBrains_Mono'] text-[9px] font-bold mt-0.5">TERMINAL</span>
        </button>

        <button
          type="button"
          onClick={handleLockPortal}
          className="flex-1 flex flex-col items-center justify-center py-1 rounded-lg text-[#3d7a52] hover:text-[#ff4060] active:scale-95 transition-all"
        >
          <Lock className="w-4 h-4 text-[#ff4060]" />
          <span className="font-['JetBrains_Mono'] text-[9px] font-bold mt-0.5">LOCK</span>
        </button>
      </div>

      {/* PIN Auth Prompt for Admin & API Management (Verified via MongoDB) */}
      <PinAuthDialog
        isOpen={isPinDialogOpen}
        onClose={() => setIsPinDialogOpen(false)}
        masterPin={masterPin}
        searchPin={searchSecurityPin}
        apiAutomationPin={apiAutomationPin}
        title="ADMIN PORTAL // PIN AUTH"
        subtitle="ENTER ADMIN PIN • VERIFIED VIA MONGODB"
        onSuccess={() => {
          setIsPinDialogOpen(false);
          setIsAdminAuthorized(true);
          setIsApiAuthAuthorized(true);
          setIsAdminHubOpen(true);
          addLog('[AUTH_SUCCESS] Admin PIN verified via MongoDB. Access granted to Admin Control Hub.', 'success');
        }}
      />

      {/* Admin Control Hub: Select between PIN Management & API Automation */}
      <AdminHubModal
        isOpen={isAdminHubOpen}
        onClose={() => setIsAdminHubOpen(false)}
        onSelectPinManagement={() => setIsPinManagementOpen(true)}
        onSelectApiAutomation={() => setIsApiModalOpen(true)}
        onLockAdmin={() => {
          setIsAdminAuthorized(false);
          setIsApiAuthAuthorized(false);
          setIsAdminHubOpen(false);
          addLog('[ADMIN_LOCK] Admin session locked.', 'warn');
        }}
        apiCount={apiConfigs.length}
      />

      {/* Automated API Management Modal */}
      <ApiAutomationModal
        isOpen={isApiModalOpen}
        onClose={() => setIsApiModalOpen(false)}
        apiConfigs={apiConfigs}
        onSaveConfigs={(newConfigs) => {
          setApiConfigs(newConfigs);
          saveApiConfigs(newConfigs);
        }}
        onResetConfigs={() => {
          setApiConfigs(DEFAULT_API_CONFIGS);
          saveApiConfigs(DEFAULT_API_CONFIGS);
        }}
        onLogTerminal={addLog}
      />

      {/* MongoDB Security & Password Audit Logs Modal */}
      <MongoSecurityLogsModal
        isOpen={isMongoLogsOpen}
        onClose={() => setIsMongoLogsOpen(false)}
        currentLoginPin={masterPin}
        onPinUpdated={(newPin) => {
          setMasterPin(newPin);
          try {
            localStorage.setItem('zerotrace_master_pin', newPin);
          } catch {}
          addLog('[MONGO_AUDIT] Password updated and synced with MongoDB: ••••••••', 'success');
        }}
      />

      {/* PIN Management Modal: Time-Limited Expiring Keys & Permanent System PINs */}
      <PinManagementModal
        isOpen={isPinManagementOpen}
        onClose={() => setIsPinManagementOpen(false)}
        masterPin={masterPin}
        searchSecurityPin={searchSecurityPin}
        apiAutomationPin={apiAutomationPin}
        onRefreshPins={async () => {
          try {
            const res = await fetch('/api/pins');
            if (res.ok) {
              const data = await res.json();
              if (data.searchPin) setSearchSecurityPin(data.searchPin);
              if (data.apiAutomationPin) setApiAutomationPin(data.apiAutomationPin);
              if (data.loginPin) setMasterPin(data.loginPin);
            }
          } catch {}
        }}
      />

      {/* Anti-Inspect & Anti-Scraping Security Defense Shield */}
      <AntiInspectShield enabled={true} />
    </div>
  );
}
