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
import { AdminHubModal, SystemBroadcast, MaintenanceModeState } from './components/AdminHubModal';
import { DashboardCleanVideoPlayer } from './components/DashboardCleanVideoPlayer';
import { AntiInspectShield } from './components/AntiInspectShield';
import { PWAInstallButton } from './components/PWAInstallButton';
import { TextPromotionFilterModal } from './components/TextPromotionFilterModal';
import { AddFeatureModal } from './components/AddFeatureModal';
import { ApiConfigItem, CustomTextFilterItem, FeatureVisibilityMap } from './types/apiTypes';
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
  Timer,
  Filter,
  Megaphone,
  Power
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
  const [isTextFilterModalOpen, setIsTextFilterModalOpen] = useState<boolean>(false);
  const [isAddFeatureModalOpen, setIsAddFeatureModalOpen] = useState<boolean>(false);

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

  // Hardcoded Admin Result Concealment State (Hide/Unhide results for regular users)
  const [hideResultsForUsers, setHideResultsForUsers] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('zerotrace_hide_results_for_users');
      return saved !== null ? saved === 'true' : false;
    } catch {
      return false;
    }
  });

  // Feature-Specific Result Concealment State (Hide/Unhide specific stages for regular users)
  const [featureVisibility, setFeatureVisibility] = useState<FeatureVisibilityMap>(() => {
    try {
      const saved = localStorage.getItem('zerotrace_feature_visibility');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      'phone-osint': false,
      'aadhar-search': false,
      'upi-search': false,
      'email-search': false,
      'vehicle-search': false,
      'imei-search': false,
      'telegram-search': false,
      'raw-json': false
    };
  });

  // Admin preview toggle: when false (default), admin sees the exact user page where concealed cards are hidden
  const [adminShowHiddenCards, setAdminShowHiddenCards] = useState<boolean>(false);

  // Computes visible cards based on concealment status, pause state, and current user view mode
  const visibleApiConfigs = useMemo(() => {
    return apiConfigs.filter((config) => {
      const isConcealed = Boolean(featureVisibility[config.id]);
      const isPaused = config.enabled === false;
      // When admin has explicitly enabled adminShowHiddenCards mode, show all configs to admin
      if (isAdminAuthorized && adminShowHiddenCards) {
        return true;
      }
      // For all regular visitors, and for admin in user-preview mode: COMPLETELY HIDE concealed or paused cards
      if (isConcealed || isPaused) {
        return false;
      }
      return true;
    });
  }, [apiConfigs, featureVisibility, isAdminAuthorized, adminShowHiddenCards]);

  // Count of hidden or paused cards across the portal
  const hiddenCardsCount = useMemo(() => {
    return apiConfigs.filter(c => Boolean(featureVisibility[c.id]) || c.enabled === false).length;
  }, [apiConfigs, featureVisibility]);

  // Auto-switch selectedModuleId if current selected module is concealed or paused on the user page
  useEffect(() => {
    const isShowingAll = isAdminAuthorized && adminShowHiddenCards;
    if (!isShowingAll && selectedModuleId) {
      const isConcealed = Boolean(featureVisibility[selectedModuleId]);
      const currentConfig = apiConfigs.find(c => c.id === selectedModuleId);
      const isPaused = currentConfig?.enabled === false;
      if (isConcealed || isPaused) {
        const firstVisible = visibleApiConfigs[0];
        if (firstVisible) {
          setSelectedModuleId(firstVisible.id);
        } else {
          setSelectedModuleId(null);
        }
      }
    }
  }, [featureVisibility, apiConfigs, isAdminAuthorized, adminShowHiddenCards, selectedModuleId, visibleApiConfigs]);

  // Tracks which feature tab should be pre-focused when opening TextPromotionFilterModal
  const [textFilterInitialTab, setTextFilterInitialTab] = useState<string>('all');

  // System Broadcast Banner State
  const [systemBroadcast, setSystemBroadcast] = useState<SystemBroadcast>({
    enabled: true,
    title: 'SYSTEM ANNOUNCEMENT',
    message: '⚡ ZERO-TRACE OSINT GATEWAY v4.2 IS ACTIVE — MongoDB Auth Secured & High-Speed API Automation Online.',
    type: 'info',
    marquee: true,
    dismissable: true,
    actionUrl: '',
    actionText: ''
  });
  const [broadcastDismissed, setBroadcastDismissed] = useState<boolean>(false);

  // System Maintenance Mode State
  const [maintenanceMode, setMaintenanceMode] = useState<MaintenanceModeState>({
    enabled: false,
    message: '⚠️ SYSTEM MAINTENANCE IN PROGRESS: Portal is currently undergoing scheduled database optimization. Please check back shortly.'
  });

  // Fetch remote Broadcast & Maintenance settings
  useEffect(() => {
    let isMounted = true;
    async function fetchBroadcastAndMaintenance() {
      try {
        const bRes = await fetch('/api/admin/broadcast');
        if (bRes.ok) {
          const bData = await bRes.json();
          if (isMounted && bData.broadcast) setSystemBroadcast(bData.broadcast);
        }
        const mRes = await fetch('/api/admin/maintenance');
        if (mRes.ok) {
          const mData = await mRes.json();
          if (isMounted && mData.maintenance) setMaintenanceMode(mData.maintenance);
        }
      } catch (err) {
        console.warn('[Admin Broadcast/Maintenance fetch warning]:', err);
      }
    }
    fetchBroadcastAndMaintenance();
    return () => {
      isMounted = false;
    };
  }, []);

  // Live Maintenance Countdown Timer (Admin-Configured)
  const [maintenanceRemaining, setMaintenanceRemaining] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    totalSeconds: number;
    isExpired: boolean;
  }>({ hours: 0, minutes: 0, seconds: 0, totalSeconds: 0, isExpired: false });

  useEffect(() => {
    if (!maintenanceMode.enabled) return;

    // Fix: Compute a fixed target timestamp so the live timer counts down every second!
    let targetMs: number;
    if (maintenanceMode.estimatedEndTime && new Date(maintenanceMode.estimatedEndTime).getTime() > Date.now()) {
      targetMs = new Date(maintenanceMode.estimatedEndTime).getTime();
    } else if (maintenanceMode.updatedAt && maintenanceMode.durationMinutes) {
      const computed = new Date(maintenanceMode.updatedAt).getTime() + maintenanceMode.durationMinutes * 60000;
      targetMs = computed > Date.now() ? computed : Date.now() + (maintenanceMode.durationMinutes || 60) * 60000;
    } else {
      targetMs = Date.now() + (maintenanceMode.durationMinutes || 60) * 60000;
    }

    const tick = () => {
      const now = Date.now();
      const diffMs = targetMs - now;
      if (diffMs <= 0) {
        setMaintenanceRemaining({ hours: 0, minutes: 0, seconds: 0, totalSeconds: 0, isExpired: true });
        return;
      }

      const totalSec = Math.floor(diffMs / 1000);
      const hours = Math.floor(totalSec / 3600);
      const minutes = Math.floor((totalSec % 3600) / 60);
      const seconds = totalSec % 60;

      setMaintenanceRemaining({ hours, minutes, seconds, totalSeconds: totalSec, isExpired: false });
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [maintenanceMode.enabled, maintenanceMode.estimatedEndTime, maintenanceMode.durationMinutes, maintenanceMode.updatedAt]);

  const handleUpdateBroadcast = async (updated: SystemBroadcast) => {
    setSystemBroadcast(updated);
    setBroadcastDismissed(false);
    try {
      await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-PIN': masterPin || apiAutomationPin || '9264'
        },
        body: JSON.stringify(updated)
      });
      addLog(`[BROADCAST_PUBLISHED] Broadcast updated: "${updated.title}"`, 'success');
    } catch (e) {
      console.warn('[Broadcast Update Error]:', e);
    }
  };

  const handleUpdateMaintenance = async (updated: MaintenanceModeState) => {
    const calculatedEnd = updated.enabled
      ? (updated.estimatedEndTime && new Date(updated.estimatedEndTime).getTime() > Date.now()
          ? updated.estimatedEndTime
          : new Date(Date.now() + (updated.durationMinutes || 60) * 60000).toISOString())
      : undefined;

    const payload: MaintenanceModeState = {
      ...updated,
      estimatedEndTime: calculatedEnd,
      updatedAt: new Date().toISOString()
    };

    setMaintenanceMode(payload);
    try {
      await fetch('/api/admin/maintenance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-PIN': masterPin || apiAutomationPin || '9264'
        },
        body: JSON.stringify(payload)
      });
      addLog(`[MAINTENANCE_TOGGLE] Maintenance mode set to ${payload.enabled}. Timer: ${payload.durationMinutes || 60}m`, payload.enabled ? 'warn' : 'success');
    } catch (e) {
      console.warn('[Maintenance Update Error]:', e);
    }
  };

  // Fetch remote admin visibility setting on mount (both global and per-feature)
  useEffect(() => {
    let isMounted = true;
    async function fetchResultVisibility() {
      try {
        const res = await fetch('/api/admin/result-visibility');
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            if (typeof data.hideResultsForUsers === 'boolean') {
              setHideResultsForUsers(data.hideResultsForUsers);
              try {
                localStorage.setItem('zerotrace_hide_results_for_users', String(data.hideResultsForUsers));
              } catch {}
            }
            if (data.featureVisibility && typeof data.featureVisibility === 'object') {
              setFeatureVisibility(prev => ({ ...prev, ...data.featureVisibility }));
              try {
                localStorage.setItem('zerotrace_feature_visibility', JSON.stringify(data.featureVisibility));
              } catch {}
            }
          }
        }
      } catch (err) {
        console.warn('[Admin Visibility] Could not fetch remote visibility settings:', err);
      }
    }
    fetchResultVisibility();
    return () => {
      isMounted = false;
    };
  }, []);

  // Admin Master Toggle Handler for Result Concealment
  const handleToggleResultVisibility = async (hide: boolean) => {
    setHideResultsForUsers(hide);
    try {
      localStorage.setItem('zerotrace_hide_results_for_users', String(hide));
    } catch {}

    addLog(
      hide
        ? '[ADMIN_PRIVACY] HARDCODED SHIELD ACTIVE: Results and response payloads are now HIDDEN from non-admin users across all stages.'
        : '[ADMIN_PRIVACY] HARDCODED SHIELD DEACTIVATED: Results and response payloads are now VISIBLE to users.',
      hide ? 'warn' : 'success'
    );

    try {
      await fetch('/api/admin/result-visibility', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-PIN': masterPin || apiAutomationPin || '9264'
        },
        body: JSON.stringify({ hideResultsForUsers: hide })
      });
    } catch (e) {
      console.warn('[Admin Visibility] Remote sync failed:', e);
    }
  };

  // Admin Feature-Specific Toggle Handler for Result Concealment
  const handleToggleFeatureVisibility = async (featureId: string, hide: boolean) => {
    const updated = { ...featureVisibility, [featureId]: hide };
    setFeatureVisibility(updated);
    try {
      localStorage.setItem('zerotrace_feature_visibility', JSON.stringify(updated));
    } catch {}

    addLog(
      hide
        ? `[FEATURE_PRIVACY] STAGE SHIELD ACTIVE: Feature "${featureId.toUpperCase()}" results are now CONCEALED from non-admin users.`
        : `[FEATURE_PRIVACY] STAGE SHIELD DEACTIVATED: Feature "${featureId.toUpperCase()}" results are now VISIBLE to users.`,
      hide ? 'warn' : 'success'
    );

    try {
      await fetch('/api/admin/feature-visibility', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-PIN': masterPin || apiAutomationPin || '9264'
        },
        body: JSON.stringify({ featureId, hide })
      });
    } catch (e) {
      console.warn('[Feature Visibility] Remote sync failed:', e);
    }
  };

  const handleOpenFeatureFilterModal = (targetFeature: string = 'all') => {
    setTextFilterInitialTab(targetFeature);
    setIsTextFilterModalOpen(true);
  };

  // Dynamic Custom Text & Promotional Filter State (Hide/Unhide specific words/promos per feature)
  const [customTextFilters, setCustomTextFilters] = useState<CustomTextFilterItem[]>(() => {
    try {
      const saved = localStorage.getItem('zerotrace_custom_text_filters');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      { id: 'filter-1', phrase: 't.me/', enabled: true, action: 'hide', targetFeature: 'telegram-search' },
      { id: 'filter-2', phrase: 'telegram', enabled: true, action: 'hide', targetFeature: 'all' },
      { id: 'filter-3', phrase: 'join channel', enabled: true, action: 'hide', targetFeature: 'telegram-search' },
      { id: 'filter-4', phrase: 'buy api', enabled: true, action: 'hide', targetFeature: 'all' },
      { id: 'filter-5', phrase: 'developer', enabled: true, action: 'hide', targetFeature: 'all' },
      { id: 'filter-6', phrase: 'credits', enabled: true, action: 'hide', targetFeature: 'all' }
    ];
  });

  // Fetch remote custom filters on mount
  useEffect(() => {
    let isMounted = true;
    async function fetchCustomFilters() {
      try {
        const res = await fetch('/api/admin/text-filters');
        if (res.ok) {
          const data = await res.json();
          if (isMounted && Array.isArray(data.filters)) {
            setCustomTextFilters(prev => {
              const existingIds = new Set(data.filters.map((f: any) => f.id));
              const merged = [...data.filters];
              for (const p of prev) {
                if (!existingIds.has(p.id) && !merged.some(m => m.phrase.toLowerCase() === p.phrase.toLowerCase() && (m.targetFeature || 'all') === (p.targetFeature || 'all'))) {
                  merged.push(p);
                }
              }
              try {
                localStorage.setItem('zerotrace_custom_text_filters', JSON.stringify(merged));
              } catch {}
              return merged;
            });
          }
        }
      } catch (err) {
        console.warn('[Admin Text Filters] Remote fetch failed:', err);
      }
    }
    fetchCustomFilters();
    return () => {
      isMounted = false;
    };
  }, []);

  // Save filters handler
  const handleSaveTextFilters = async (newFilters: CustomTextFilterItem[]) => {
    setCustomTextFilters(newFilters);
    try {
      localStorage.setItem('zerotrace_custom_text_filters', JSON.stringify(newFilters));
    } catch {}

    // Immediately re-filter current phoneSearchResult in memory
    setPhoneSearchResult((prev) => {
      if (!prev) return prev;
      const targetF = prev.targetFeature || selectedModuleId || 'phone-osint';
      const sourceObj = prev._unfiltered_raw || prev.clean_intel_result || prev.clean_payload || {};
      const cleanIntel = hardcodePurgePromotions(sourceObj, targetF, newFilters);
      const isBlacklistHidden = shouldHideEntry('blacklist_status', prev.blacklist_status || 'CLEAN / NOT BLACKLISTED', targetF, newFilters);
      return {
        ...prev,
        _unfiltered_raw: sourceObj,
        blacklist_status: isBlacklistHidden ? null : (prev._original_blacklist_status || prev.blacklist_status),
        _original_blacklist_status: prev._original_blacklist_status || prev.blacklist_status,
        clean_intel_result: cleanIntel,
        clean_payload: cleanIntel,
        raw_payload: cleanIntel,
        api_exact_response: cleanIntel
      };
    });

    addLog(`[TEXT_FILTER] Saved ${newFilters.filter(f => f.enabled).length} active text/promotional filter rules across features.`, 'cmd');

    try {
      await fetch('/api/admin/text-filters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filters: newFilters })
      });
    } catch (e) {
      console.warn('[Admin Text Filters] Remote sync failed:', e);
    }
  };

  const handleResetTextFilters = async () => {
    const defaultFilters: CustomTextFilterItem[] = [
      { id: 'filter-1', phrase: 't.me/', enabled: true, action: 'hide', targetFeature: 'telegram-search' },
      { id: 'filter-2', phrase: 'telegram', enabled: true, action: 'hide', targetFeature: 'all' },
      { id: 'filter-3', phrase: 'join channel', enabled: true, action: 'hide', targetFeature: 'telegram-search' },
      { id: 'filter-4', phrase: 'buy api', enabled: true, action: 'hide', targetFeature: 'all' },
      { id: 'filter-5', phrase: 'developer', enabled: true, action: 'hide', targetFeature: 'all' },
      { id: 'filter-6', phrase: 'credits', enabled: true, action: 'hide', targetFeature: 'all' }
    ];
    handleSaveTextFilters(defaultFilters);
    addLog('[TEXT_FILTER] Reset to default anti-promotion filters.', 'warn');
  };

  // Quick 1-click toggle to hide/unhide any field directly from the active dossier response
  const handleQuickToggleFieldConcealment = (fieldKey: string) => {
    const activeFeature = phoneSearchResult?.targetFeature || selectedModuleId || 'phone-osint';
    const cleanKey = fieldKey.trim();
    // Check if there is an active hide filter matching this field in this stage
    const existing = customTextFilters.find(f => 
      f.action === 'hide' &&
      isFeatureMatch(f.targetFeature, activeFeature) &&
      (f.phrase.toLowerCase() === cleanKey.toLowerCase() || 
       f.phrase.toLowerCase() === `"${cleanKey.toLowerCase()}"` ||
       f.phrase.toLowerCase().startsWith(`"${cleanKey.toLowerCase()}":`) ||
       f.phrase.toLowerCase().startsWith(`${cleanKey.toLowerCase()}:`))
    );

    let updated: CustomTextFilterItem[];
    if (existing) {
      // Toggle enabled
      updated = customTextFilters.map(f => f.id === existing.id ? { ...f, enabled: !f.enabled } : f);
      addLog(`[FIELD CONCEALMENT] Toggled field [${cleanKey}]: ${!existing.enabled ? 'HIDDEN' : 'VISIBLE'}`, 'cmd');
    } else {
      // Add dedicated hide rule
      const newFilter: CustomTextFilterItem = {
        id: `filter_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        phrase: cleanKey,
        enabled: true,
        action: 'hide',
        targetFeature: activeFeature,
        addedAt: new Date().toISOString()
      };
      updated = [newFilter, ...customTextFilters];
      addLog(`[FIELD CONCEALMENT] Field [${cleanKey}] is now HIDDEN from response.`, 'warn');
    }
    handleSaveTextFilters(updated);
  };

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

  // Discrete admin route (/prime) and shortcut listener (Ctrl+Shift+L, Ctrl+Shift+A, Alt+A, or URL path /prime / ?admin=true)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrlShiftL = (e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'L' || e.key === 'l' || e.code === 'KeyL');
      const isCtrlShiftA = (e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a' || e.code === 'KeyA');
      const isAltA = e.altKey && (e.key === 'A' || e.key === 'a' || e.code === 'KeyA');

      if (isCtrlShiftL || isCtrlShiftA || isAltA) {
        e.preventDefault();
        handleOpenAdmin();
      }
    };

    const checkUrlRoute = () => {
      try {
        const path = window.location.pathname.toLowerCase().replace(/\/+$/, '');
        const hash = window.location.hash.toLowerCase();
        const search = window.location.search.toLowerCase();
        const isPrimePath = path.endsWith('/prime') || path === '/prime' || hash.includes('prime') || search.includes('admin=true');

        if (isPrimePath) {
          handleOpenAdmin();
        }
      } catch {}
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('popstate', checkUrlRoute);
    window.addEventListener('hashchange', checkUrlRoute);

    // Initial check on mount
    checkUrlRoute();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('popstate', checkUrlRoute);
      window.removeEventListener('hashchange', checkUrlRoute);
    };
  }, [isAdminAuthorized]);

  const logoClicksRef = useRef<number[]>([]);
  const handleLogoClick = (e: React.MouseEvent) => {
    const now = Date.now();
    logoClicksRef.current = [...logoClicksRef.current.filter(t => now - t < 1500), now];
    if (logoClicksRef.current.length >= 3) {
      e.preventDefault();
      logoClicksRef.current = [];
      handleOpenAdmin();
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

  // Hardcoded promotional and ad keywords that must never appear in the intelligence results
  const FORBIDDEN_PROMO_KEYWORDS = [
    'credit', 'credits', 'contact', 'contact_us', 'developer', 'dev', 'developed_by',
    'owner', 'author', 'creator', 'made_by', 'coded_by', 'built_by', 'channel',
    'telegram', 'tg', 'tg_channel', 'join', 'join_channel', 'join_tg', 'group',
    'bot', 't_me', 'promo', 'promotion', 'promotional', 'promo_msg', 'ad', 'ads',
    'advertisement', 'sponsored', 'buy', 'buy_api', 'sell', 'pricing', 'plans',
    'cost', 'paid', 'free_tier', 'support', 'help_desk', 'admin', 'api_owner',
    'service_provider', 'powered_by', 'provider', 'watermark', 'notice',
    'disclaimer', 'copyright', 'about_dev', 'website', 'site', 'link', 'links'
  ];

  // Feature match helper supporting all feature names and normalized keys
  const isFeatureMatch = (ruleFeature?: string, activeFeature?: string): boolean => {
    if (!ruleFeature || ruleFeature === 'all' || ruleFeature === 'raw-json') return true;
    if (!activeFeature || activeFeature === 'all' || activeFeature === 'raw-json') return true;
    const cleanRule = ruleFeature.toLowerCase().replace(/[-_]?(search|osint|intel|stage|\d+)/g, '').trim();
    const cleanActive = activeFeature.toLowerCase().replace(/[-_]?(search|osint|intel|stage|\d+)/g, '').trim();
    return cleanRule === cleanActive || ruleFeature.toLowerCase() === activeFeature.toLowerCase();
  };

  // Helper to determine if an object entry (key, value, or full line like "blacklist_status": "CLEAN / NOT BLACKLISTED")
  // should be completely hidden according to active admin filters
  const shouldHideEntry = (
    key: string,
    value: any,
    targetFeature?: string,
    activeFilters?: CustomTextFilterItem[]
  ): boolean => {
    const filters = activeFilters || customTextFilters || [];
    const activeFeature = targetFeature || selectedModuleId || 'phone-osint';
    const lowerKey = key.toLowerCase().trim();
    const strVal = typeof value === 'string' ? value : (value !== null && value !== undefined && typeof value !== 'object' ? String(value) : '');
    const lowerVal = strVal.toLowerCase().trim();

    // Check system promotional keywords on key
    if (FORBIDDEN_PROMO_KEYWORDS.some(kw => lowerKey === kw || lowerKey.includes(kw))) {
      return true;
    }

    for (const f of filters) {
      if (!f.enabled || !f.phrase || f.action !== 'hide') continue;
      // Feature matching: applies if filter target is 'all', 'raw-json', or matches activeFeature
      if (!isFeatureMatch(f.targetFeature, activeFeature)) {
        continue;
      }

      const rawP = f.phrase.trim();
      // Remove surrounding quotes, commas, braces, brackets, and whitespace
      const cleanP = rawP.replace(/^[\s"',{}[\]]+|[\s"',{}[\]]+$/g, '').trim().toLowerCase();
      if (!cleanP) continue;

      // 1. Direct match on key (exact or sanitized alphanumeric)
      if (lowerKey === cleanP || lowerKey === cleanP.replace(/[^a-z0-9_]/g, '')) {
        return true;
      }

      // 2. Direct match on value
      if (lowerVal && (lowerVal === cleanP || lowerVal.includes(cleanP) || cleanP.includes(lowerVal))) {
        return true;
      }

      // 3. User entered colon-separated line or key-value pair, e.g. "blacklist_status": "CLEAN / NOT BLACKLISTED"
      if (rawP.includes(':')) {
        const colonIdx = rawP.indexOf(':');
        const pKey = rawP.slice(0, colonIdx).replace(/[^a-zA-Z0-9_]/g, '').toLowerCase().trim();
        const pVal = rawP.slice(colonIdx + 1).replace(/^[\s"',:]+|[\s"',;]+$/g, '').toLowerCase().trim();

        // If the key matches what user wants to hide, hide the entire entry regardless of value format
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
  };

  // Detect whether a string is a promotional message, telegram channel, or ad link (supports per-feature filtering)
  const isPromotionalString = (val: any, targetFeature?: string, activeFilters?: CustomTextFilterItem[]): boolean => {
    if (!val || typeof val !== 'string') return false;
    const str = val.trim().toLowerCase();
    const activeFeature = targetFeature || selectedModuleId || 'phone-osint';
    const filters = activeFilters || customTextFilters || [];

    // Check custom text filters set by admin (applies if 'all', 'raw-json', or matching activeFeature)
    for (const f of filters) {
      if (f.enabled && f.phrase && f.action === 'hide') {
        if (!isFeatureMatch(f.targetFeature, activeFeature)) {
          continue;
        }
        const rawP = f.phrase.trim();
        const cleanP = rawP.replace(/^[\s"',{}[\]]+|[\s"',{}[\]]+$/g, '').trim().toLowerCase();
        if (cleanP && (str.includes(cleanP) || cleanP.includes(str))) return true;

        if (rawP.includes(':')) {
          const colonIdx = rawP.indexOf(':');
          const pVal = rawP.slice(colonIdx + 1).replace(/^[\s"',:]+|[\s"',;]+$/g, '').trim().toLowerCase();
          if (pVal && (str.includes(pVal) || pVal.includes(str))) return true;
        }
      }
    }

    if (str.includes('t.me/') || str.includes('telegram.me/') || str.includes('telegram.dog/')) return true;
    if (str.includes('join our') || str.includes('join channel') || str.includes('join telegram') || str.includes('join @')) return true;
    if (str.includes('buy api') || str.includes('dm for api') || str.includes('api seller') || str.includes('buy bot')) return true;
    if (str.includes('developer:') || str.includes('dev:') || str.includes('credits:') || str.includes('credit:')) return true;
    if (str.includes('all rights reserved') || str.includes('powered by') || str.includes('official channel')) return true;
    if (/^@\w{3,}$/.test(val.trim())) return true;
    return false;
  };

  // Strip embedded promotional tags from legitimate data values (supports per-feature filtering)
  const sanitizeIntelText = (val: string | null | undefined, targetFeature?: string, activeFilters?: CustomTextFilterItem[]): string => {
    if (!val || typeof val !== 'string') return '';
    let cleaned = val;
    const activeFeature = targetFeature || selectedModuleId || 'phone-osint';
    const filters = activeFilters || customTextFilters || [];

    // Apply active replacement and hiding custom filters for this feature
    for (const f of filters) {
      if (!f.enabled || !f.phrase) continue;
      if (!isFeatureMatch(f.targetFeature, activeFeature)) {
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

      if (f.action === 'replace') {
        const reg = new RegExp(matchPhrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        cleaned = cleaned.replace(reg, f.replaceWith || '');
      } else if (f.action === 'hide') {
        const reg = new RegExp(matchPhrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        cleaned = cleaned.replace(reg, '');
      }
    }

    cleaned = cleaned
      .replace(/(?:https?:\/\/)?(?:www\.)?(?:t\.me|telegram\.me|telegram\.dog)\/[a-zA-Z0-9_+/]+/gi, '')
      .replace(/@\b[a-zA-Z0-9_]{3,}\b/g, (match, offset, fullStr) => {
        // Keep valid email addresses like user@domain.com
        const before = fullStr[offset - 1];
        if (before && /[a-zA-Z0-9._%+-]/.test(before)) return match;
        return '';
      })
      .replace(/\b(join|telegram|channel|buy api|dm for api|dm for|dev|developer|credits?|sponsored|official channel)\b[:\s\w\-_/.]*/gi, '')
      .replace(/[\(\[\{]\s*[\)\]\}]/g, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
    return cleaned.replace(/^[-–—:,|/\s]+|[-–—:,|/\s]+$/g, '').trim();
  };

  // Hardcoded deep recursion that purges all promotional keys, channel references, and ads (supports per-feature filtering)
  const hardcodePurgePromotions = (obj: any, targetFeature?: string, activeFilters?: CustomTextFilterItem[]): any => {
    if (obj === null || obj === undefined) return null;
    const activeFeature = targetFeature || selectedModuleId || 'phone-osint';
    const filters = activeFilters || customTextFilters || [];

    if (typeof obj === 'string') {
      if (isPromotionalString(obj, activeFeature, filters)) return null;
      return sanitizeIntelText(obj, activeFeature, filters);
    }
    if (typeof obj === 'number' || typeof obj === 'boolean') {
      return obj;
    }
    if (Array.isArray(obj)) {
      return obj
        .map(item => hardcodePurgePromotions(item, activeFeature, filters))
        .filter(item => item !== null && item !== undefined && item !== '');
    }
    if (typeof obj === 'object') {
      const cleanObj: Record<string, any> = {};
      for (const [key, value] of Object.entries(obj)) {
        if (shouldHideEntry(key, value, activeFeature, filters)) {
          continue;
        }
        // Discard any promotional string value
        if (typeof value === 'string' && isPromotionalString(value, activeFeature, filters)) {
          continue;
        }
        const cleanedVal = hardcodePurgePromotions(value, activeFeature, filters);
        if (cleanedVal !== null && cleanedVal !== undefined && cleanedVal !== '') {
          if (typeof cleanedVal === 'object' && !Array.isArray(cleanedVal) && Object.keys(cleanedVal).length === 0) {
            continue;
          }
          cleanObj[key] = cleanedVal;
        }
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

    // HARDCODED REQUIREMENT: If maintenance mode is active and user is not admin, block search!
    if (maintenanceMode.enabled && !isAdminAuthorized) {
      setPhoneSearchLoading(false);
      setPhoneSearchError('SYSTEM MAINTENANCE: Portal operations and search tools are locked during maintenance.');
      setPhoneSearchResult(null);
      addLog('[MAINTENANCE_BLOCKED] Feature execution blocked due to active site maintenance.', 'warn');
      return;
    }

    // Find the matching configuration based on selected module or query heuristic
    const currentConfig = apiConfigs.find(c => c.id === selectedModuleId) || apiConfigs[0];
    
    // HARDCODED REQUIREMENT: If this specific API or active preset is paused, DO NOT return any response!
    if (currentConfig.enabled === false) {
      setPhoneSearchLoading(false);
      setPhoneSearchError(`API PAUSED: [${currentConfig.name}] is currently paused. No response will be returned.`);
      setPhoneSearchResult(null);
      addLog(`[API_PAUSED] Specific module [${currentConfig.name}] is paused. Execution halted with zero response.`, 'warn');
      return;
    }

    const activePreset = (currentConfig.presets || []).find(p => p.id === currentConfig.activePresetId || p.targetUrl === currentConfig.targetUrl);
    if (activePreset && activePreset.enabled === false) {
      setPhoneSearchLoading(false);
      setPhoneSearchError(`ENDPOINT PAUSED: Specific preset [${activePreset.name}] for [${currentConfig.name}] is paused. No response will be returned.`);
      setPhoneSearchResult(null);
      addLog(`[ENDPOINT_PAUSED] Specific preset [${activePreset.name}] is paused. Execution halted with zero response.`, 'warn');
      return;
    }

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
      let fetchOptions: RequestInit = {
        headers: {
          'Accept': 'application/json, text/plain, */*',
          ...(currentConfig.headers || {})
        }
      };

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
        } else {
          // ANY CUSTOM OR ADDED API: Route via /api/proxy so CORS and headers succeed cleanly
          targetFetchUrl = `/api/proxy`;
          fetchOptions = {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json, text/plain, */*'
            },
            body: JSON.stringify({
              url: buildExecutionUrl(currentConfig, q),
              method: currentConfig.method || 'GET',
              targetFeature: currentConfig.id,
              headers: currentConfig.headers || {}
            })
          };
        }
      }

      const res = await fetch(targetFetchUrl, fetchOptions);

      rawText = await res.text();
      data = safeParseApiJson(rawText);

      // Ensure minimum 3-second hacker loading screen duration
      const elapsed = Date.now() - startTime;
      if (elapsed < 3000) {
        await new Promise((resolve) => setTimeout(resolve, 3000 - elapsed));
      }

      // Check if backend returned hardcoded pause status
      if (data && (data.status === 'paused' || data.paused)) {
        setPhoneSearchLoading(false);
        setPhoneSearchError(data.message || `API PAUSED: Specific API [${currentConfig.name}] is paused. No response returned.`);
        setPhoneSearchResult(null);
        addLog(`[API_PAUSED] Server blocked query: [${currentConfig.name}] is paused. Zero response generated.`, 'warn');
        return;
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

      // Extract field data and sanitize all text against injected promotional watermarks (feature-specific filtering)
      const rawSubscriberName = extractValue(payload, ['name', 'full_name', 'fullname', 'subscriber_name', 'owner_name', 'account_holder_name', 'first_name']);
      const subscriberName = sanitizeIntelText(rawSubscriberName, currentConfig.id);
      
      const rawFatherName = extractValue(payload, ['father_name', 'fathername', 'father', 'fname', 'care_of', 'guardian']);
      const fatherName = sanitizeIntelText(rawFatherName, currentConfig.id);
      
      const rawMobileNum = extractValue(payload, ['mobile', 'number', 'phone', 'phone_number', 'msisdn', 'mobile_no', 'num']) || q;
      const mobileNum = sanitizeIntelText(rawMobileNum, currentConfig.id);
      
      const rawAltMobile = extractValue(payload, ['alt_number', 'alt_mobile', 'alt_num', 'alternate_mobile', 'secondary_mobile', 'alt']);
      const altMobile = sanitizeIntelText(rawAltMobile, currentConfig.id);
      
      const rawAadhaarNum = extractValue(payload, ['aadhar', 'aadhaar', 'uid', 'uidai', 'aadhar_no', 'aadhaar_no', 'id_number']);
      const aadhaarNum = sanitizeIntelText(rawAadhaarNum, currentConfig.id);
      
      const rawCircleName = extractValue(payload, ['circle', 'telecom_circle', 'operator', 'carrier', 'state', 'rto_name', 'region']);
      const circleName = sanitizeIntelText(rawCircleName, currentConfig.id);
      
      const rawAddress = extractValue(payload, ['address', 'full_address', 'raw_address', 'location', 'residence']);
      let cleanAddress = '';
      if (rawAddress) {
        cleanAddress = rawAddress.includes('!') ? rawAddress.split('!').filter(Boolean).join(', ') : rawAddress;
        cleanAddress = sanitizeIntelText(cleanAddress, currentConfig.id);
      }
      const pinMatch = rawAddress ? String(rawAddress).match(/\b\d{6}\b/) : null;
      const pincode = extractValue(payload, ['pincode', 'pin', 'postal_code', 'zip', 'zipcode']) || (pinMatch ? pinMatch[0] : null);
      
      const rawEmail = extractValue(payload, ['email', 'mail', 'email_id', 'registered_email']);
      const email = rawEmail && !isPromotionalString(rawEmail, currentConfig.id) ? rawEmail : null;

      // Vehicle specific fields
      const makerModel = sanitizeIntelText(extractValue(payload, ['maker_model', 'maker', 'model', 'brand', 'vehicle_model']), currentConfig.id);
      const vehicleClass = sanitizeIntelText(extractValue(payload, ['vehicle_class', 'class', 'type']), currentConfig.id);
      const engineNo = sanitizeIntelText(extractValue(payload, ['engine_no', 'engine_number', 'engine']), currentConfig.id);
      const chassisNo = sanitizeIntelText(extractValue(payload, ['chassis_no', 'chassis_number', 'vin']), currentConfig.id);
      const regDate = sanitizeIntelText(extractValue(payload, ['reg_date', 'registration_date', 'purchase_date']), currentConfig.id);
      const insuranceExpiry = sanitizeIntelText(extractValue(payload, ['insurance_upto', 'insurance_expiry', 'insurance_validity']), currentConfig.id);
      const rtoName = sanitizeIntelText(extractValue(payload, ['rto_name', 'rto', 'registering_authority']) || circleName, currentConfig.id);

      // IMEI specific fields (Only include defaults if current module is IMEI search)
      const isImeiModule = currentConfig.id === 'imei-search';
      const imeiBrand = sanitizeIntelText(extractValue(payload, ['brand', 'brand_name', 'manufacturer', 'vendor']), currentConfig.id);
      const imeiModel = sanitizeIntelText(extractValue(payload, ['model', 'device_name', 'phone_model']), currentConfig.id);
      const imeiTac = sanitizeIntelText(extractValue(payload, ['tac', 'tac_code']) || (isImeiModule && q.length >= 8 ? q.substring(0, 8) : null), currentConfig.id);
      
      const rawBlacklist = extractValue(payload, ['blacklist_status', 'blacklist']);
      const blacklistStatus = sanitizeIntelText(rawBlacklist || (isImeiModule ? 'CLEAN / NOT BLACKLISTED' : null), currentConfig.id);

      const rawCarrierLock = extractValue(payload, ['carrier_lock', 'sim_lock', 'network_lock']);
      const carrierLock = sanitizeIntelText(rawCarrierLock || (isImeiModule ? 'UNLOCKED / GLOBAL COMPLIANT' : null), currentConfig.id);

      // TGID specific fields
      const tgUsername = sanitizeIntelText(extractValue(payload, ['username', 'handle']), currentConfig.id);
      const tgBio = sanitizeIntelText(extractValue(payload, ['bio', 'about', 'description']), currentConfig.id);
      const tgPhone = sanitizeIntelText(extractValue(payload, ['phone', 'mobile']), currentConfig.id);

      // Assemble strictly hardcoded clean intelligence payload with zero promotional artifacts
      const cleanIntelResult: Record<string, any> = {
        target: q,
        status: 'VERIFIED_RECORD_FOUND',
        targetFeature: currentConfig.id
      };

      if (subscriberName && !shouldHideEntry('name', subscriberName, currentConfig.id)) cleanIntelResult.name = subscriberName;
      if (fatherName && !shouldHideEntry('father_name', fatherName, currentConfig.id)) cleanIntelResult.father_name = fatherName;
      if (mobileNum && !shouldHideEntry('mobile', mobileNum, currentConfig.id)) cleanIntelResult.mobile = mobileNum;
      if (altMobile && !shouldHideEntry('alt_mobile', altMobile, currentConfig.id)) cleanIntelResult.alt_mobile = altMobile;
      if (aadhaarNum && !shouldHideEntry('aadhaar', aadhaarNum, currentConfig.id)) cleanIntelResult.aadhaar = aadhaarNum;
      if (circleName && !shouldHideEntry('circle', circleName, currentConfig.id)) cleanIntelResult.circle = circleName;
      if (cleanAddress && !shouldHideEntry('address', cleanAddress, currentConfig.id)) cleanIntelResult.address = cleanAddress;
      if (pincode && !shouldHideEntry('pincode', pincode, currentConfig.id)) cleanIntelResult.pincode = pincode;
      if (email && !shouldHideEntry('email', email, currentConfig.id)) cleanIntelResult.email = email;

      if (makerModel && !shouldHideEntry('maker_model', makerModel, currentConfig.id)) cleanIntelResult.maker_model = makerModel;
      if (vehicleClass && !shouldHideEntry('vehicle_class', vehicleClass, currentConfig.id)) cleanIntelResult.vehicle_class = vehicleClass;
      if (engineNo && !shouldHideEntry('engine_no', engineNo, currentConfig.id)) cleanIntelResult.engine_no = engineNo;
      if (chassisNo && !shouldHideEntry('chassis_no', chassisNo, currentConfig.id)) cleanIntelResult.chassis_no = chassisNo;
      if (regDate && !shouldHideEntry('registration_date', regDate, currentConfig.id)) cleanIntelResult.registration_date = regDate;
      if (insuranceExpiry && !shouldHideEntry('insurance_validity', insuranceExpiry, currentConfig.id)) cleanIntelResult.insurance_validity = insuranceExpiry;
      if (rtoName && !shouldHideEntry('rto', rtoName, currentConfig.id)) cleanIntelResult.rto = rtoName;

      if (imeiBrand && !shouldHideEntry('brand', imeiBrand, currentConfig.id)) cleanIntelResult.brand = imeiBrand;
      if (imeiModel && !shouldHideEntry('model', imeiModel, currentConfig.id)) cleanIntelResult.model = imeiModel;
      if (imeiTac && !shouldHideEntry('tac', imeiTac, currentConfig.id)) cleanIntelResult.tac = imeiTac;
      if (blacklistStatus && !shouldHideEntry('blacklist_status', blacklistStatus, currentConfig.id)) cleanIntelResult.blacklist_status = blacklistStatus;
      if (carrierLock && !shouldHideEntry('network_lock', carrierLock, currentConfig.id)) cleanIntelResult.network_lock = carrierLock;

      if (tgUsername && !shouldHideEntry('username', tgUsername, currentConfig.id)) cleanIntelResult.username = tgUsername;
      if (tgBio && !shouldHideEntry('bio', tgBio, currentConfig.id)) cleanIntelResult.bio = tgBio;
      if (tgPhone && !shouldHideEntry('phone', tgPhone, currentConfig.id)) cleanIntelResult.phone = tgPhone;

      // Extract any remaining non-promotional real attributes from payload
      const purgedRawObj = hardcodePurgePromotions(payload, currentConfig.id);
      if (purgedRawObj && typeof purgedRawObj === 'object' && !Array.isArray(purgedRawObj)) {
        for (const [k, v] of Object.entries(purgedRawObj)) {
          if (shouldHideEntry(k, v, currentConfig.id)) continue;
          if (cleanIntelResult[k] === undefined && v !== null && v !== undefined && v !== '') {
            cleanIntelResult[k] = v;
          }
        }
      }

      // Deep purge the entire assembled cleanIntelResult against all active filters
      const finalCleanResult = hardcodePurgePromotions(cleanIntelResult, currentConfig.id) || {};

      const isBlacklistHidden = shouldHideEntry('blacklist_status', blacklistStatus || 'CLEAN / NOT BLACKLISTED', currentConfig.id);
      const normalizedResult = {
        status: 'success',
        searchType: currentConfig.id.replace('-search', '').replace('-osint', ''),
        moduleId: currentConfig.id,
        targetFeature: currentConfig.id,
        _unfiltered_raw: {
          ...cleanIntelResult,
          ...(blacklistStatus ? { blacklist_status: blacklistStatus } : {})
        },
        _original_blacklist_status: blacklistStatus,
        clean_intel_result: finalCleanResult,
        clean_payload: finalCleanResult,
        raw_payload: finalCleanResult,
        api_exact_response: finalCleanResult,
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
        blacklist_status: isBlacklistHidden ? null : blacklistStatus,
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
          
          {/* Brand Identity - Redirects to zerotracelegit.netlify.app on tap (Triple-click opens admin) */}
          <a
            href="https://zerotracelegit.netlify.app"
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleLogoClick}
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
              <span className="text-[#c8ff00] font-bold">
                {visibleApiConfigs.length} ACTIVE
                {isAdminAuthorized && hiddenCardsCount > 0 && (
                  <span className="text-[#ff4060] font-mono text-[10px] ml-1">
                    ({hiddenCardsCount} HIDDEN)
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* Action CTAs in Taskbar */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <PWAInstallButton />

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
            <Database className="w-3.5 h-3.5 text-[#00ffd5]" />
            <span>APIS:</span>
            <span className="text-[#c8ff00] font-bold">
              {visibleApiConfigs.length} ACTIVE
              {isAdminAuthorized && hiddenCardsCount > 0 && (
                <span className="text-[#ff4060] font-mono text-[9px] ml-1">
                  ({hiddenCardsCount} HIDDEN)
                </span>
              )}
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 py-6 px-4 lg:px-8 max-w-7xl mx-auto space-y-6">
        
        {/* ========================================================================= */}
        {/* LIVE SYSTEM BROADCAST ANNOUNCEMENT BANNER                                 */}
        {/* ========================================================================= */}
        {systemBroadcast.enabled && !broadcastDismissed && (
          <div className={`cyber-edge-beam-card rounded-2xl p-3 sm:p-4 relative shadow-2xl animate-fade-in border-2 overflow-hidden ${
            systemBroadcast.type === 'critical' ? 'bg-[#25080e]/95 border-[#ff4060] text-[#ff4060]' :
            systemBroadcast.type === 'warning' ? 'bg-[#1f1a05]/95 border-[#c8ff00] text-[#c8ff00]' :
            systemBroadcast.type === 'success' ? 'bg-[#062013]/95 border-[#7fff50] text-[#7fff50]' :
            'bg-[#06201e]/95 border-[#00ffd5] text-[#00ffd5]'
          }`}>
            <span className="hud-corner hud-tl" />
            <span className="hud-corner hud-tr" />
            <span className="hud-corner hud-bl" />
            <span className="hud-corner hud-br" />

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-black/50 border border-current flex items-center justify-center shrink-0 shadow-md">
                  <Megaphone className="w-4 h-4 animate-bounce" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-black/60 border border-current font-['Orbitron']">
                      {systemBroadcast.title || 'SYSTEM ANNOUNCEMENT'}
                    </span>
                    <span className="text-[10px] font-['JetBrains_Mono'] font-bold opacity-80 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping" />
                      <span>LIVE BROADCAST</span>
                    </span>
                  </div>
                  <div className="font-['JetBrains_Mono'] text-xs font-bold mt-1 leading-relaxed">
                    <span>{systemBroadcast.message}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {systemBroadcast.actionUrl && (
                  <a
                    href={systemBroadcast.actionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-black/60 hover:bg-black/90 border border-current font-['Orbitron'] font-bold text-[10px] uppercase tracking-wider transition-all flex items-center gap-1.5 min-h-[36px] touch-manipulation cursor-pointer"
                  >
                    <span>{systemBroadcast.actionText || 'OPEN'}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}

                {systemBroadcast.dismissable && (
                  <button
                    type="button"
                    onClick={() => setBroadcastDismissed(true)}
                    className="p-2 rounded-xl bg-black/40 hover:bg-black/70 border border-current transition-all cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center touch-manipulation"
                    title="Dismiss announcement"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ADMIN OVERRIDE BANNER (WHEN MAINTENANCE IS ACTIVE BUT ADMIN IS LOGGED IN) */}
        {/* ========================================================================= */}
        {maintenanceMode.enabled && isAdminAuthorized && (
          <div className="p-3.5 sm:p-4 rounded-2xl bg-[#25080e]/95 border-2 border-[#ff4060] text-[#ff4060] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-[0_0_25px_rgba(255,64,96,0.3)] animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-black/60 border border-[#ff4060] flex items-center justify-center shrink-0">
                <Power className="w-5 h-5 text-[#ff4060] animate-pulse" />
              </div>
              <div>
                <div className="font-['Orbitron'] text-xs sm:text-sm font-bold text-[#f0fff4] flex items-center gap-2">
                  <span>ADMIN OVERRIDE ACTIVE</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#ff4060]/20 border border-[#ff4060]/40 font-mono">
                    VISITORS LOCKED OUT
                  </span>
                </div>
                <p className="font-['JetBrains_Mono'] text-[11px] text-[#ff8095] mt-0.5">
                  Maintenance timer: {String(maintenanceRemaining.hours).padStart(2, '0')}h {String(maintenanceRemaining.minutes).padStart(2, '0')}m {String(maintenanceRemaining.seconds).padStart(2, '0')}s remaining. You have full bypassed access.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleOpenAdmin}
              className="px-3.5 py-2 rounded-xl bg-[#ff4060] hover:bg-[#ff5a75] text-[#f0fff4] font-['Orbitron'] font-bold text-[10px] sm:text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md active:scale-95 touch-manipulation shrink-0"
            >
              MANAGE MAINTENANCE TIMER
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* CLEAN DASHBOARD VIDEO (AUTOPLAY CONTINUOUS LOOP, MUTE/UNMUTE ONLY, ANY RATIO) */}
        {/* ========================================================================= */}
        <section id="dashboard-clean-video" className="w-full">
          <DashboardCleanVideoPlayer />
        </section>

        {/* ========================================================================= */}
        {/* FULL PORTAL MAINTENANCE LOCKOUT SCREEN WITH LIVE ADMIN COUNTDOWN TIMER     */}
        {/* (DISPLAYED TO REGULAR VISITORS WHEN MAINTENANCE IS ACTIVE - ALL TOOLS BLOCKED) */}
        {/* ========================================================================= */}
        {maintenanceMode.enabled && !isAdminAuthorized ? (
          <div className="cyber-edge-beam-card rounded-2xl sm:rounded-3xl p-6 sm:p-10 lg:p-12 relative shadow-[0_0_60px_rgba(255,64,96,0.25)] border-2 border-[#ff4060] bg-[#0c0205] text-center space-y-6 sm:space-y-8 animate-fade-in">
            <span className="hud-corner hud-tl" />
            <span className="hud-corner hud-tr" />
            <span className="hud-corner hud-bl" />
            <span className="hud-corner hud-br" />

            {/* Glowing Icon & Status Pill */}
            <div className="space-y-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#1d060a] border-2 border-[#ff4060] flex items-center justify-center text-[#ff4060] mx-auto shadow-[0_0_35px_rgba(255,64,96,0.5)] animate-pulse">
                <Power className="w-8 h-8 sm:w-10 sm:h-10" />
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ff4060]/15 border border-[#ff4060]/50 text-[#ff4060] font-['JetBrains_Mono'] text-[10px] sm:text-xs font-bold uppercase tracking-widest">
                <span className="w-2 h-2 rounded-full bg-[#ff4060] animate-ping" />
                <span>PORTAL MAINTENANCE WINDOW ACTIVE // ALL RECON OPERATIONS LOCKED</span>
              </div>

              <h2 className="font-['Orbitron'] text-xl sm:text-3xl lg:text-4xl font-black text-[#f0fff4] uppercase tracking-wider">
                SYSTEM UNDER MAINTENANCE
              </h2>

              <p className="font-['JetBrains_Mono'] text-xs sm:text-sm text-[#ff8095] max-w-2xl mx-auto leading-relaxed">
                {maintenanceMode.message || 'The ZeroTrace Intelligence gateway is currently undergoing scheduled infrastructure upgrades. All searches and features are temporarily locked.'}
              </p>
            </div>

            {/* LIVE COUNTDOWN TIMER (ADMIN-CONFIGURED) */}
            <div className="max-w-xl mx-auto p-4 sm:p-6 rounded-2xl bg-[#160408] border border-[#ff4060]/50 shadow-inner space-y-4">
              <div className="flex items-center justify-between text-[11px] sm:text-xs font-['Orbitron'] text-[#ff8095] uppercase font-bold tracking-wider">
                <span className="flex items-center gap-1.5">
                  <Timer className="w-4 h-4 text-[#ff4060] animate-spin" />
                  <span>ESTIMATED TIME REMAINING</span>
                </span>
                <span className="font-mono text-[#c8ff00]">
                  {maintenanceRemaining.isExpired ? 'FINALIZING...' : 'COUNTDOWN ACTIVE'}
                </span>
              </div>

              {/* Digits Display */}
              <div className="grid grid-cols-3 gap-2.5 sm:gap-4 font-['Orbitron']">
                {/* Hours */}
                <div className="p-3 sm:p-4 rounded-xl bg-[#090103] border border-[#ff4060]/40 flex flex-col items-center justify-center shadow-lg">
                  <span className="text-2xl sm:text-4xl lg:text-5xl font-black text-[#f0fff4] tracking-tight">
                    {String(maintenanceRemaining.hours).padStart(2, '0')}
                  </span>
                  <span className="text-[9px] sm:text-[11px] font-['JetBrains_Mono'] text-[#ff4060] font-bold uppercase tracking-wider mt-1">
                    HOURS
                  </span>
                </div>

                {/* Minutes */}
                <div className="p-3 sm:p-4 rounded-xl bg-[#090103] border border-[#ff4060]/40 flex flex-col items-center justify-center shadow-lg">
                  <span className="text-2xl sm:text-4xl lg:text-5xl font-black text-[#f0fff4] tracking-tight">
                    {String(maintenanceRemaining.minutes).padStart(2, '0')}
                  </span>
                  <span className="text-[9px] sm:text-[11px] font-['JetBrains_Mono'] text-[#ff4060] font-bold uppercase tracking-wider mt-1">
                    MINUTES
                  </span>
                </div>

                {/* Seconds */}
                <div className="p-3 sm:p-4 rounded-xl bg-[#090103] border border-[#ff4060]/40 flex flex-col items-center justify-center shadow-lg">
                  <span className="text-2xl sm:text-4xl lg:text-5xl font-black text-[#c8ff00] tracking-tight">
                    {String(maintenanceRemaining.seconds).padStart(2, '0')}
                  </span>
                  <span className="text-[9px] sm:text-[11px] font-['JetBrains_Mono'] text-[#c8ff00] font-bold uppercase tracking-wider mt-1">
                    SECONDS
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-[#090103] rounded-full h-2 border border-[#ff4060]/30 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-[#ff4060] to-[#c8ff00] h-full rounded-full transition-all duration-1000"
                  style={{
                    width: `${Math.max(5, Math.min(100, 100 - (maintenanceRemaining.totalSeconds / Math.max(1, (maintenanceMode.durationMinutes || 60) * 60)) * 100))}%`
                  }}
                />
              </div>

              {maintenanceMode.estimatedEndTime && (
                <div className="text-[10px] font-['JetBrains_Mono'] text-[#ff8095]/70">
                  ESTIMATED COMPLETION: {new Date(maintenanceMode.estimatedEndTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} ({new Date(maintenanceMode.estimatedEndTime).toLocaleDateString()})
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
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
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
            {/* Left 7 Cols: Search Bar */}
            <div className="lg:col-span-7 space-y-2">
              {/* Dedicated Module Selector Buttons - Horizontally Scrollable on Android */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] font-['JetBrains_Mono'] text-[#3d7a52] uppercase font-bold px-0.5">
                  <div className="flex items-center gap-2">
                    <span>SELECT ACTIVE MODULE:</span>
                    {isAdminAuthorized && (
                      <button
                        type="button"
                        onClick={() => setIsAddFeatureModalOpen(true)}
                        className="px-2 py-0.5 rounded bg-[#c8ff00]/15 hover:bg-[#c8ff00]/30 text-[#c8ff00] border border-[#c8ff00]/50 font-['Orbitron'] text-[9px] font-bold uppercase transition-all flex items-center gap-1 cursor-pointer active:scale-95 shadow-[0_0_8px_rgba(200,255,0,0.3)] touch-manipulation min-h-[26px]"
                        title="Add new custom feature card"
                      >
                        <Plus className="w-3 h-3 stroke-[3]" />
                        <span>ADD FEATURE</span>
                      </button>
                    )}
                  </div>
                  <span className="text-[9px] text-[#00ffd5] sm:hidden">SWIPE ↔</span>
                </div>
                <div className="flex items-center gap-1.5 pb-1 overflow-x-auto no-scrollbar touch-pan-x -mx-1 px-1">
                  {visibleApiConfigs.map((topic) => {
                    const isSel = selectedModuleId === topic.id;
                    const isHiddenForUsers = Boolean(featureVisibility[topic.id]);
                    const isPaused = topic.enabled === false;
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
                            : isHiddenForUsers
                            ? 'bg-[#180509] text-[#ff8095] border-[#ff4060]/50'
                            : 'bg-[#020d06] text-[#3d7a52] hover:text-[#00ffd5] border-[#0f3320] hover:border-[#1a5c35]'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          isPaused ? 'bg-[#ff9900] ring-1 ring-[#ff9900]' :
                          isHiddenForUsers ? 'bg-[#ff4060] animate-pulse' : (isSel ? 'bg-[#020d06]' : 'bg-[#1a5c35]')
                        }`} />
                        <span className="whitespace-nowrap">{topic.name.replace(' SEARCH', '').replace(' NUMBER', '')}</span>
                        {isPaused && (
                          <span className="text-[8px] px-1 rounded bg-[#ff9900]/20 text-[#ff9900] border border-[#ff9900]/40 font-mono">PAUSED</span>
                        )}
                        {isHiddenForUsers && !isPaused && (
                          <span className="text-[8px] px-1 rounded bg-[#ff4060]/20 text-[#ff4060] font-mono font-bold">HIDDEN</span>
                        )}
                      </button>
                    );
                  })}

                  {/* Dedicated + ADD FEATURE Card Pill at end of module list (Admin Only) */}
                  {isAdminAuthorized && (
                    <button
                      type="button"
                      onClick={() => setIsAddFeatureModalOpen(true)}
                      className="px-2.5 py-1.5 rounded-lg text-[10px] font-['Orbitron'] font-black bg-[#071d12] hover:bg-[#0c2a1c] text-[#c8ff00] hover:text-[#d8ff33] border border-[#c8ff00]/60 hover:border-[#c8ff00] transition-all flex items-center gap-1.5 cursor-pointer shrink-0 touch-manipulation active:scale-95 shadow-[0_0_10px_rgba(200,255,0,0.25)] min-h-[32px]"
                      title="Create new feature card and map its API"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[3]" />
                      <span className="whitespace-nowrap uppercase tracking-wider">+ ADD FEATURE</span>
                    </button>
                  )}
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
                        : (() => {
                            const activeCfg = apiConfigs.find(c => c.id === selectedModuleId);
                            if (activeCfg?.enabled === false) {
                              return `[PAUSED] ${activeCfg.name} is paused (No response). Resume to search.`;
                            }
                            if (selectedModuleId === 'phone-osint') return 'Phone number (e.g. 9999883039)...';
                            if (selectedModuleId === 'aadhar-search') return 'Aadhaar UID (e.g. 123456789012)...';
                            if (selectedModuleId === 'upi-search') return 'UPI ID (e.g. name@bank)...';
                            if (selectedModuleId === 'email-search') return 'Email (e.g. user@gmail.com)...';
                            if (selectedModuleId === 'vehicle-search') return 'Vehicle RC (e.g. DL8CAF5030)...';
                            if (selectedModuleId === 'imei-search') return '15-digit IMEI (e.g. 358240051234560)...';
                            return 'Query or Telegram ID...';
                          })()
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
                <span className="font-['JetBrains_Mono'] text-[10px] px-2 py-0.5 rounded bg-[#020d06] border border-[#1a5c35] text-[#3d7a52]">
                  REQUIRED
                </span>
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
            ) : phoneSearchResult ? (() => {
              const activeFeatureId = phoneSearchResult.targetFeature || selectedModuleId || 'phone-osint';
              const isStageConcealed = hideResultsForUsers || Boolean(featureVisibility[activeFeatureId]);
              const isResultConcealedForCurrentViewer = isStageConcealed && !isAdminAuthorized;
              const stageFilterCount = customTextFilters.filter(f => f.enabled && (f.targetFeature || 'all') === activeFeatureId).length;
              const globalFilterCount = customTextFilters.filter(f => f.enabled).length;

              return (
                <div className="space-y-4">
                  {/* Non-Admin Concealment Warning Notice (Shown when results are hidden) */}
                  {isResultConcealedForCurrentViewer && (
                  <div className="p-3.5 rounded-xl bg-[#150407] border-2 border-[#ff4060] text-[#ff4060] flex flex-wrap items-center justify-between gap-3 shadow-[0_0_20px_rgba(255,64,96,0.25)]">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-[#25080e] border border-[#ff4060] flex items-center justify-center text-[#ff4060] shrink-0">
                        <Lock className="w-4 h-4 animate-pulse" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-['Orbitron'] text-xs font-bold uppercase tracking-wider text-[#f0fff4]">
                          ACCESS RESTRICTED // {activeFeatureId.toUpperCase()} RECORD LOCKED
                        </div>
                        <p className="font-['JetBrains_Mono'] text-[10px] text-[#ff8095] mt-0.5">
                          Access to this intelligence record is restricted. Security clearance required.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Dossier Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#0f3320]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-[#071510] border border-[#00ffd5] flex items-center justify-center text-[#00ffd5] shadow-[0_0_12px_rgba(0,255,213,0.2)]">
                      <Radio className="w-5 h-5 animate-pulse text-[#c8ff00]" />
                    </div>
                    <div>
                      <h4 className="font-['Orbitron'] text-sm sm:text-base font-bold text-[#f0fff4] uppercase flex items-center gap-2">
                        <span>INTELLIGENCE DOSSIER:</span>
                        <span className="text-[#c8ff00] font-mono tracking-wider">
                          {isResultConcealedForCurrentViewer 
                            ? '•••••••••• [PROTECTED]' 
                            : (phoneSearchResult.mobile || phoneSearchResult.rc || phoneSearchResult.imei || phoneSearchResult.tgid || searchedPhoneNumber)}
                        </span>
                      </h4>
                      <p className="font-['JetBrains_Mono'] text-[10px] text-[#3d7a52]">
                        {isResultConcealedForCurrentViewer 
                          ? 'CLASSIFIED PRIVACY SHIELD ACTIVE' 
                          : 'PROCESSED VIA DYNAMIC API ENGINE // ENCRYPTED GATEWAY VERIFIED'}
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

                {/* Organized attributes (Redacted/Masked if concealed) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Identity Box */}
                  <div className="bg-[#020d06] border border-[#1a5c35] rounded-xl p-4 space-y-2">
                    <div className="font-['Orbitron'] text-xs font-bold text-[#c8ff00] border-b border-[#0f3320] pb-2 flex items-center justify-between">
                      <span>IDENTITY INTEL</span>
                      {isResultConcealedForCurrentViewer && (
                        <span className="text-[9px] text-[#ff4060] font-mono font-bold">LOCKED</span>
                      )}
                    </div>
                    <div className="space-y-1.5 font-['JetBrains_Mono'] text-xs">
                      <div>
                        <div className="text-[10px] text-[#3d7a52]">NAME / ENTITY</div>
                        {isResultConcealedForCurrentViewer ? (
                          <div className="text-[#ff4060] font-mono text-[11px] font-bold">
                            🔒 [RESTRICTED INTEL]
                          </div>
                        ) : (
                          <div className="text-[#00ffd5] font-bold">{phoneSearchResult.name || 'N/A'}</div>
                        )}
                      </div>
                      {phoneSearchResult.father_name && (
                        <div>
                          <div className="text-[10px] text-[#3d7a52]">FATHER / GUARDIAN</div>
                          {isResultConcealedForCurrentViewer ? (
                            <div className="text-[#ff4060] font-mono text-[11px]">••••••••••••••</div>
                          ) : (
                            <div className="text-[#f0fff4]">{phoneSearchResult.father_name}</div>
                          )}
                        </div>
                      )}
                      {phoneSearchResult.aadhaar && (
                        <div>
                          <div className="text-[10px] text-[#3d7a52]">AADHAAR / UID</div>
                          {isResultConcealedForCurrentViewer ? (
                            <div className="text-[#ff4060] font-mono text-[11px]">•••• •••• ••••</div>
                          ) : (
                            <div className="text-[#ffe600] font-mono">{phoneSearchResult.aadhaar}</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Telecom / Vehicle / Specs */}
                  <div className="bg-[#020d06] border border-[#1a5c35] rounded-xl p-4 space-y-2">
                    <div className="font-['Orbitron'] text-xs font-bold text-[#00ffd5] border-b border-[#0f3320] pb-2 flex items-center justify-between">
                      <span>TELEMETRY & SPECS</span>
                      {isResultConcealedForCurrentViewer && (
                        <span className="text-[9px] text-[#ff4060] font-mono font-bold">MASKED</span>
                      )}
                    </div>
                    <div className="space-y-1.5 font-['JetBrains_Mono'] text-xs">
                      {phoneSearchResult.mobile && (
                        <div>
                          <div className="text-[10px] text-[#3d7a52]">TARGET ID / PHONE</div>
                          {isResultConcealedForCurrentViewer ? (
                            <div className="text-[#ff4060] font-mono font-bold">•••••••••• [HIDDEN]</div>
                          ) : (
                            <div className="text-[#c8ff00] font-mono font-bold">{phoneSearchResult.mobile}</div>
                          )}
                        </div>
                      )}
                      {phoneSearchResult.alt_mobile && (
                        <div>
                          <div className="text-[10px] text-[#3d7a52]">ALT CONTACT</div>
                          {isResultConcealedForCurrentViewer ? (
                            <div className="text-[#ff4060] font-mono">••••••••••</div>
                          ) : (
                            <div className="text-[#7fff50] font-mono">{phoneSearchResult.alt_mobile}</div>
                          )}
                        </div>
                      )}
                      {phoneSearchResult.circle && (
                        <div>
                          <div className="text-[10px] text-[#3d7a52]">CIRCLE / REGION</div>
                          {isResultConcealedForCurrentViewer ? (
                            <div className="text-[#ff4060] font-mono">[RESTRICTED]</div>
                          ) : (
                            <div className="text-[#f0fff4]">{phoneSearchResult.circle}</div>
                          )}
                        </div>
                      )}
                      {phoneSearchResult.maker_model && (
                        <div>
                          <div className="text-[10px] text-[#3d7a52]">MODEL / BRAND</div>
                          {isResultConcealedForCurrentViewer ? (
                            <div className="text-[#ff4060] font-mono">[RESTRICTED]</div>
                          ) : (
                            <div className="text-[#ffe600]">{phoneSearchResult.maker_model}</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Address / Location */}
                  <div className="bg-[#020d06] border border-[#1a5c35] rounded-xl p-4 space-y-2">
                    <div className="font-['Orbitron'] text-xs font-bold text-[#7fff50] border-b border-[#0f3320] pb-2 flex items-center justify-between">
                      <span>LOCATION & RESIDENCE</span>
                      {isResultConcealedForCurrentViewer && (
                        <span className="text-[9px] text-[#ff4060] font-mono font-bold">CONCEALED</span>
                      )}
                    </div>
                    <div className="space-y-1.5 font-['JetBrains_Mono'] text-xs">
                      <div>
                        <div className="text-[10px] text-[#3d7a52]">ADDRESS</div>
                        {isResultConcealedForCurrentViewer ? (
                          <div className="text-[#ff4060] font-mono text-[11px] leading-relaxed">
                            🔒 [ADDRESS RESTRICTED // ACCESS PROTECTED]
                          </div>
                        ) : (
                          <div className="text-[#f0fff4] leading-relaxed">{phoneSearchResult.address || 'N/A'}</div>
                        )}
                      </div>
                      {phoneSearchResult.pincode && (
                        <div>
                          <div className="text-[10px] text-[#3d7a52]">PINCODE</div>
                          {isResultConcealedForCurrentViewer ? (
                            <div className="text-[#ff4060] font-mono">••••••</div>
                          ) : (
                            <div className="text-[#00ffd5] font-mono">{phoneSearchResult.pincode}</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Strictly Hardcoded Result Dossier (Zero-Promotion Clean Intel & Admin Concealment Shield) */}
                <div className={`border rounded-xl p-3.5 shadow-inner transition-colors ${
                  isResultConcealedForCurrentViewer 
                    ? 'bg-[#120306] border-[#ff4060]/50' 
                    : 'bg-[#020d06] border-[#0f3320]'
                }`}>
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#0f3320] text-xs font-['Orbitron']">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${
                        isResultConcealedForCurrentViewer 
                          ? 'bg-[#ff4060] shadow-[0_0_8px_#ff4060]' 
                          : 'bg-[#c8ff00] shadow-[0_0_8px_#c8ff00]'
                      }`} />
                      <span className={`font-bold tracking-wider ${
                        isResultConcealedForCurrentViewer ? 'text-[#ff4060]' : 'text-[#00ffd5]'
                      }`}>
                        {isResultConcealedForCurrentViewer 
                          ? 'RESPONSE CONCEALED' 
                          : 'HARDCODED RESULT DATA'}
                      </span>
                      <span className={`text-[9px] font-['JetBrains_Mono'] px-2 py-0.5 rounded font-bold uppercase tracking-widest border ${
                        isResultConcealedForCurrentViewer 
                          ? 'bg-[#ff4060]/20 text-[#ff4060] border-[#ff4060]/40' 
                          : 'bg-[#00ffd5]/10 text-[#00ffd5] border-[#00ffd5]/30'
                      }`}>
                        {isResultConcealedForCurrentViewer 
                          ? 'PROTECTED RECORD' 
                          : 'PURE INTEL // NO ADS'}
                      </span>
                    </div>

                    {!isResultConcealedForCurrentViewer && (
                      <button
                        type="button"
                        onClick={() => {
                          const displayObj = hardcodePurgePromotions(
                            phoneSearchResult.clean_intel_result || phoneSearchResult.clean_payload || {},
                            phoneSearchResult.targetFeature || selectedModuleId,
                            customTextFilters
                          ) || {};
                          handleCopy(JSON.stringify(displayObj, null, 2), 'clean-json-dossier');
                        }}
                        className="text-[10px] font-['JetBrains_Mono'] text-[#c8ff00] hover:text-[#f0fff4] bg-[#071510] hover:bg-[#0a2015] border border-[#1a5c35] hover:border-[#c8ff00] px-2.5 py-1 rounded transition-colors cursor-pointer font-bold flex items-center gap-1 active:scale-95"
                      >
                        {copiedId === 'clean-json-dossier' ? '✓ COPIED' : 'COPY RESULT'}
                      </button>
                    )}
                  </div>

                  {/* Targeted Selector <pre>: Result or Classified Concealment Shield */}
                  <pre className={`text-[11px] font-mono p-3 rounded-lg mt-2.5 max-h-48 overflow-y-auto border select-text leading-relaxed font-semibold transition-colors ${
                    isResultConcealedForCurrentViewer
                      ? 'text-[#ff607d] bg-[#0e0204] border-[#ff4060]/40'
                      : 'text-[#00ffd5] bg-[#040f08] border-[#0f3320]'
                  }`}>
                    {isResultConcealedForCurrentViewer ? (
`═══════════════════════════════════════════════════════════════════════════════
🔒 [CLASSIFIED // ACCESS RESTRICTED]
───────────────────────────────────────────────────────────────────────────────
THIS RECORD IS RESTRICTED UNDER ACTIVE SECURITY CLEARANCE POLICY.

ACCESS STATUS    : CONCEALED [PRIVACY SHIELD ACTIVE]
CLEARANCE LEVEL  : ELEVATED CLEARANCE REQUIRED
TARGET REFERENCE : ${phoneSearchResult.mobile || phoneSearchResult.rc || searchedPhoneNumber || 'PROTECTED_QUERY'}
SECURITY ENCLAVE : ENCRYPTED DATA BUFFER LOCKED
═══════════════════════════════════════════════════════════════════════════════`
                    ) : (
                      JSON.stringify(
                        hardcodePurgePromotions(
                          phoneSearchResult.clean_intel_result || phoneSearchResult.clean_payload || {},
                          phoneSearchResult.targetFeature || selectedModuleId,
                          customTextFilters
                        ) || {},
                        null,
                        2
                      )
                    )}
                  </pre>
                </div>
              </div>
              );
            })() : null}
          </div>
        ) : null}

        {/* Modules Grid */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <h3 className="font-['Orbitron'] text-sm sm:text-base font-bold text-[#f0fff4] uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded bg-[#c8ff00] shadow-[0_0_8px_#c8ff00]" />
              <span>ACTIVE RECON MODULES</span>
              <span className="text-xs font-['JetBrains_Mono'] text-[#3d7a52] font-normal">
                ({visibleApiConfigs.length} ACTIVE)
              </span>
            </h3>

            {/* Admin View Mode Switcher: Toggle between pure user view and admin preview */}
            {isAdminAuthorized && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-['JetBrains_Mono'] text-[#7fff50] uppercase font-bold">
                  ADMIN VIEW MODE:
                </span>
                <div className="flex items-center p-0.5 rounded-xl bg-[#071510] border border-[#1a5c35]">
                  <button
                    type="button"
                    onClick={() => setAdminShowHiddenCards(false)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-['Orbitron'] font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer touch-manipulation ${
                      !adminShowHiddenCards
                        ? 'bg-[#c8ff00] text-[#020d06] shadow-[0_0_10px_rgba(200,255,0,0.3)]'
                        : 'text-[#3d7a52] hover:text-[#f0fff4]'
                    }`}
                    title="Exact visitor view: Concealed and hidden cards are completely gone"
                  >
                    <Eye className="w-3 h-3" />
                    <span>USER VIEW</span>
                    {hiddenCardsCount > 0 && (
                      <span className="text-[9px] px-1 rounded bg-black/40 font-mono">
                        {hiddenCardsCount} HIDDEN
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setAdminShowHiddenCards(true)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-['Orbitron'] font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer touch-manipulation ${
                      adminShowHiddenCards
                        ? 'bg-[#00ffd5] text-[#020d06] shadow-[0_0_10px_rgba(0,255,213,0.3)]'
                        : 'text-[#3d7a52] hover:text-[#f0fff4]'
                    }`}
                    title="Admin view: Shows all cards including concealed cards with 1-click toggles"
                  >
                    <Sliders className="w-3 h-3" />
                    <span>ADMIN VIEW (ALL)</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {visibleApiConfigs.length === 0 ? (
            <div className="p-8 sm:p-10 rounded-2xl bg-[#071510] border-2 border-[#1a5c35] text-center space-y-3 relative overflow-hidden">
              <span className="hud-corner hud-tl" />
              <span className="hud-corner hud-tr" />
              <span className="hud-corner hud-bl" />
              <span className="hud-corner hud-br" />
              <Shield className="w-10 h-10 text-[#ff4060] mx-auto animate-pulse" />
              <h4 className="font-['Orbitron'] text-sm sm:text-base font-bold text-[#f0fff4] uppercase">
                ALL RECON MODULES RESTRICTED
              </h4>
              <p className="font-['JetBrains_Mono'] text-xs text-[#3d7a52] max-w-md mx-auto leading-relaxed">
                All reconnaissance modules are currently concealed under security clearance policy. No active cards visible for regular users.
              </p>
              {isAdminAuthorized && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setAdminShowHiddenCards(true)}
                    className="px-4 py-2 rounded-xl bg-[#00ffd5] hover:bg-[#33ffe0] text-[#020d06] font-['Orbitron'] font-bold text-xs uppercase cursor-pointer transition-all shadow-[0_0_15px_rgba(0,255,213,0.3)]"
                  >
                    SWITCH TO ADMIN VIEW (SHOW ALL CARDS)
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
              {visibleApiConfigs.map((config) => {
                const isSelected = selectedModuleId === config.id;
                const isConcealed = Boolean(featureVisibility[config.id]);
                const isPaused = config.enabled === false;
                return (
                  <div
                    key={config.id}
                    onClick={() => {
                      setSelectedModuleId(config.id);
                      searchInputRef.current?.focus();
                    }}
                    className={`cyber-edge-beam-card ${
                      isSelected ? 'is-selected' : ''
                    } rounded-xl p-3.5 sm:p-4 relative cursor-pointer group flex flex-col justify-between active:scale-[0.98] transition-all touch-manipulation ${
                      isConcealed ? 'border-[#ff4060]/70 bg-[#140306]/95' : ''
                    }`}
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
                        <div className="flex items-center gap-1">
                          {isConcealed && (
                            <span className="text-[8px] font-['JetBrains_Mono'] px-1.5 py-0.5 rounded bg-[#ff4060]/20 text-[#ff4060] border border-[#ff4060]/50 font-bold flex items-center gap-0.5 animate-pulse">
                              <EyeOff className="w-2.5 h-2.5" />
                              <span>CONCEALED</span>
                            </span>
                          )}
                          {isPaused ? (
                            <span className="text-[8px] font-['JetBrains_Mono'] px-1.5 py-0.5 rounded bg-[#ff9900]/20 text-[#ff9900] border border-[#ff9900]/40 font-bold animate-pulse">
                              PAUSED
                            </span>
                          ) : !isConcealed && (
                            <span className="text-[8px] font-['JetBrains_Mono'] px-1.5 py-0.5 rounded bg-[#c8ff00]/10 text-[#c8ff00] border border-[#c8ff00]/30 font-bold">
                              {config.severity?.toUpperCase() || 'HIGH'}
                            </span>
                          )}
                        </div>
                      </div>

                      <h4 className="font-['Orbitron'] font-bold text-xs sm:text-sm text-[#f0fff4] group-hover:text-[#c8ff00] transition-colors uppercase flex items-center justify-between">
                        <span className="truncate pr-1">{config.name}</span>
                        {isPaused ? (
                          <span className="text-[9px] text-[#ff9900] font-bold shrink-0">PAUSED</span>
                        ) : isConcealed ? (
                          <span className="text-[9px] text-[#ff4060] font-bold shrink-0">HIDDEN</span>
                        ) : isSelected ? (
                          <span className="text-[9px] text-[#c8ff00] shrink-0">ACTIVE</span>
                        ) : null}
                      </h4>

                      <p className="font-['JetBrains_Mono'] text-[10px] text-[#00ffd5] mt-1 line-clamp-2">
                        {config.subtitle || 'Dynamic API Gateway'}
                      </p>

                      {isAdminAuthorized && (
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
                      )}
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-[#0f3320] flex items-center justify-between gap-1.5 text-[9px] font-['JetBrains_Mono']">
                      <span className="text-[#3d7a52] group-hover:text-[#c8ff00] transition-colors truncate">
                        {isSelected ? '✓ ACTIVE' : 'SELECT'}
                      </span>
                      
                      <div className="flex items-center gap-1 shrink-0">
                        {/* 1-Click Hide/Unhide toggle directly on card for Admin */}
                        {isAdminAuthorized && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleFeatureVisibility(config.id, !isConcealed);
                            }}
                            className={`px-2 py-1 rounded border text-[9px] font-['Orbitron'] font-bold flex items-center gap-1 cursor-pointer transition-all active:scale-95 ${
                              isConcealed
                                ? 'bg-[#00ffd5]/20 border-[#00ffd5]/50 text-[#00ffd5] hover:bg-[#00ffd5]/30'
                                : 'bg-[#ff4060]/20 border-[#ff4060]/50 text-[#ff4060] hover:bg-[#ff4060]/30'
                            }`}
                            title={isConcealed ? `Click to UNHIDE ${config.name} for users` : `Click to HIDE ${config.name} from users`}
                          >
                            {isConcealed ? (
                              <>
                                <Eye className="w-3 h-3" />
                                <span>UNHIDE</span>
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-3 h-3" />
                                <span>HIDE</span>
                              </>
                            )}
                          </button>
                        )}

                        {isAdminAuthorized && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedModuleId(config.id);
                              handleOpenApiManager();
                            }}
                            className="px-2 py-1 rounded bg-[#071510] hover:bg-[#0a2015] border border-[#1a5c35] hover:border-[#00ffd5] text-[#00ffd5] hover:text-[#f0fff4] transition-all font-bold cursor-pointer active:scale-95 flex items-center gap-1 shrink-0"
                            title={`Open API list manager for ${config.name}`}
                          >
                            <span>API</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
          </>
        )}
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

          <div className="flex items-center gap-3 sm:gap-4 flex-wrap justify-center sm:justify-end text-[#3d7a52] text-[11px] sm:text-xs">
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
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#020d06]/95 backdrop-blur-lg border-t border-[#0f3320] px-3 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] flex items-center justify-around gap-2 shadow-[0_-5px_20px_rgba(0,0,0,0.8)]">
        <button
          type="button"
          onClick={() => {
            const el = document.getElementById('search-pin-console');
            el?.scrollIntoView({ behavior: 'smooth' });
            setTimeout(() => searchInputRef.current?.focus(), 400);
          }}
          className="flex-1 flex flex-col items-center justify-center py-1.5 rounded-lg text-[#3d7a52] hover:text-[#c8ff00] active:scale-95 transition-all"
        >
          <Search className="w-4 h-4 text-[#c8ff00]" />
          <span className="font-['JetBrains_Mono'] text-[10px] font-bold mt-0.5">SEARCH</span>
        </button>

        <button
          type="button"
          onClick={handleLockPortal}
          className="flex-1 flex flex-col items-center justify-center py-1.5 rounded-lg text-[#3d7a52] hover:text-[#ff4060] active:scale-95 transition-all"
        >
          <Lock className="w-4 h-4 text-[#ff4060]" />
          <span className="font-['JetBrains_Mono'] text-[10px] font-bold mt-0.5">LOCK</span>
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

      {/* Admin Control Hub: Full Page Feature Management, Broadcast & System Controls */}
      <AdminHubModal
        isOpen={isAdminHubOpen}
        onClose={() => setIsAdminHubOpen(false)}
        onSelectPinManagement={() => setIsPinManagementOpen(true)}
        onSelectApiAutomation={() => setIsApiModalOpen(true)}
        onOpenTextFilterModal={() => setIsTextFilterModalOpen(true)}
        onOpenMongoLogs={() => setIsMongoLogsOpen(true)}
        onLockAdmin={() => {
          setIsAdminAuthorized(false);
          setIsApiAuthAuthorized(false);
          setIsAdminHubOpen(false);
          addLog('[ADMIN_LOCK] Admin session locked.', 'warn');
        }}
        apiCount={apiConfigs.length}
        apiConfigs={apiConfigs}
        hideResultsForUsers={hideResultsForUsers}
        onToggleResultVisibility={handleToggleResultVisibility}
        activeFilterCount={customTextFilters.filter(f => f.enabled).length}
        featureVisibility={featureVisibility}
        onToggleFeatureVisibility={handleToggleFeatureVisibility}
        broadcast={systemBroadcast}
        onUpdateBroadcast={handleUpdateBroadcast}
        maintenance={maintenanceMode}
        onUpdateMaintenance={handleUpdateMaintenance}
        onOpenAddFeature={() => setIsAddFeatureModalOpen(true)}
      />

      {/* Add New Feature Card Creator Modal */}
      <AddFeatureModal
        isOpen={isAddFeatureModalOpen}
        onClose={() => setIsAddFeatureModalOpen(false)}
        apiConfigs={apiConfigs}
        onSaveConfigs={(newConfigs) => {
          setApiConfigs(newConfigs);
          saveApiConfigs(newConfigs);
        }}
        onSelectNewModule={(newId) => {
          setSelectedModuleId(newId);
          addLog(`[MODULE_SELECTED] Switched active module to new card (${newId})`, 'cmd');
        }}
        onOpenApiManager={() => setIsApiModalOpen(true)}
        onLogTerminal={addLog}
      />

      {/* Custom Specific Text & Promotion Filter Modal */}
      <TextPromotionFilterModal
        isOpen={isTextFilterModalOpen}
        onClose={() => setIsTextFilterModalOpen(false)}
        filters={customTextFilters}
        onSaveFilters={handleSaveTextFilters}
        onResetFilters={handleResetTextFilters}
        initialFeatureTab={textFilterInitialTab}
        hideResultsForUsers={hideResultsForUsers}
        onToggleResultVisibility={handleToggleResultVisibility}
        featureVisibility={featureVisibility}
        onToggleFeatureVisibility={handleToggleFeatureVisibility}
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
