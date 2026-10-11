import React, { useState, useMemo } from 'react';
import { ApiConfigItem } from '../types/apiTypes';
import { 
  ShieldCheck, 
  Key, 
  Wand2, 
  Timer, 
  X, 
  ArrowRight, 
  Lock, 
  Database,
  Layers,
  Sparkles,
  Server,
  Eye,
  EyeOff,
  ShieldAlert,
  Filter,
  Radio,
  Volume2,
  Megaphone,
  AlertTriangle,
  CheckCircle2,
  Info,
  Settings2,
  Activity,
  SlidersHorizontal,
  Power,
  Globe,
  Send,
  FileText,
  Plus
} from 'lucide-react';

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

interface AdminHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPinManagement: () => void;
  onSelectApiAutomation: () => void;
  onOpenTextFilterModal: () => void;
  onOpenMongoLogs?: () => void;
  onLockAdmin: () => void;
  apiCount: number;
  apiConfigs?: ApiConfigItem[];
  hideResultsForUsers: boolean;
  onToggleResultVisibility: (hide: boolean) => void;
  activeFilterCount?: number;
  featureVisibility?: Record<string, boolean>;
  onToggleFeatureVisibility?: (featureId: string, hide: boolean) => void;
  broadcast?: SystemBroadcast;
  onUpdateBroadcast?: (broadcast: SystemBroadcast) => Promise<void>;
  maintenance?: MaintenanceModeState;
  onUpdateMaintenance?: (maintenance: MaintenanceModeState) => Promise<void>;
  onOpenAddFeature?: () => void;
}

export const AdminHubModal: React.FC<AdminHubModalProps> = ({
  isOpen,
  onClose,
  onSelectPinManagement,
  onSelectApiAutomation,
  onOpenTextFilterModal,
  onOpenMongoLogs,
  onLockAdmin,
  apiCount = 5,
  apiConfigs = [],
  hideResultsForUsers,
  onToggleResultVisibility,
  activeFilterCount = 6,
  featureVisibility = {},
  onToggleFeatureVisibility,
  broadcast = {
    enabled: true,
    title: 'SYSTEM ANNOUNCEMENT',
    message: '⚡ ZERO-TRACE OSINT GATEWAY v4.2 IS ACTIVE — MongoDB Auth Secured & High-Speed API Automation Online.',
    type: 'info',
    marquee: true,
    dismissable: true,
    actionUrl: '',
    actionText: ''
  },
  onUpdateBroadcast,
  maintenance = {
    enabled: false,
    message: '⚠️ SYSTEM MAINTENANCE IN PROGRESS: Portal is currently undergoing scheduled database optimization. Please check back shortly.',
    durationMinutes: 60,
    estimatedEndTime: ''
  },
  onUpdateMaintenance,
  onOpenAddFeature
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'broadcast' | 'features' | 'maintenance'>('overview');

  const featureList = useMemo(() => {
    const defaults = [
      { id: 'phone-osint', name: 'PHONE NUMBER SEARCH', icon: '📱' },
      { id: 'aadhar-search', name: 'AADHAR NUMBER SEARCH', icon: '🆔' },
      { id: 'upi-search', name: 'UPI ID SEARCH', icon: '💳' },
      { id: 'email-search', name: 'EMAIL ADDRESS SEARCH', icon: '📧' },
      { id: 'vehicle-search', name: 'VEHICLE RC SEARCH', icon: '🚗' },
      { id: 'imei-search', name: 'DEVICE IMEI SEARCH', icon: '📲' },
      { id: 'telegram-search', name: 'TELEGRAM USER SEARCH', icon: '✈️' },
      { id: 'raw-json', name: 'RAW API JSON INSPECTOR', icon: '⚡' }
    ];

    if (!apiConfigs || apiConfigs.length === 0) return defaults;
    const map = new Map<string, { id: string; name: string; icon: string }>();
    defaults.forEach(f => map.set(f.id, f));
    apiConfigs.forEach(c => {
      if (!map.has(c.id)) {
        map.set(c.id, {
          id: c.id,
          name: c.name.toUpperCase(),
          icon: c.badge === 'CUSTOM' ? '⚡' : '🔍'
        });
      }
    });
    return Array.from(map.values());
  }, [apiConfigs]);

  // Local state for Broadcast form
  const [bEnabled, setBEnabled] = useState<boolean>(broadcast.enabled);
  const [bTitle, setBTitle] = useState<string>(broadcast.title || 'SYSTEM ANNOUNCEMENT');
  const [bMessage, setBMessage] = useState<string>(broadcast.message || '');
  const [bType, setBType] = useState<'info' | 'warning' | 'critical' | 'success'>(broadcast.type || 'info');
  const [bMarquee, setBMarquee] = useState<boolean>(broadcast.marquee);
  const [bDismissable, setBDismissable] = useState<boolean>(broadcast.dismissable);
  const [bActionUrl, setBActionUrl] = useState<string>(broadcast.actionUrl || '');
  const [bActionText, setBActionText] = useState<string>(broadcast.actionText || '');
  const [bSaving, setBSaving] = useState<boolean>(false);
  const [bFeedback, setBFeedback] = useState<string | null>(null);

  // Local state for Maintenance form
  const [mEnabled, setMEnabled] = useState<boolean>(maintenance.enabled);
  const [mMessage, setMMessage] = useState<string>(maintenance.message);
  const [mDurationMinutes, setMDurationMinutes] = useState<number>(maintenance.durationMinutes || 60);
  const [mEstimatedEndTime, setMEstimatedEndTime] = useState<string>(() => {
    if (maintenance.estimatedEndTime) return maintenance.estimatedEndTime;
    return new Date(Date.now() + (maintenance.durationMinutes || 60) * 60000).toISOString();
  });
  const [mSaving, setMSaving] = useState<boolean>(false);
  const [mFeedback, setMFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectDuration = (mins: number) => {
    setMDurationMinutes(mins);
    const end = new Date(Date.now() + mins * 60000).toISOString();
    setMEstimatedEndTime(end);
  };

  const handleSaveBroadcast = async () => {
    setBSaving(true);
    setBFeedback(null);
    try {
      const updated: SystemBroadcast = {
        enabled: bEnabled,
        title: bTitle,
        message: bMessage,
        type: bType,
        marquee: bMarquee,
        dismissable: bDismissable,
        actionUrl: bActionUrl,
        actionText: bActionText
      };
      if (onUpdateBroadcast) {
        await onUpdateBroadcast(updated);
      } else {
        await fetch('/api/admin/broadcast', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'X-Admin-PIN': '9264'
          },
          body: JSON.stringify(updated)
        });
      }
      setBFeedback('✅ BROADCAST PUBLISHED LIVE TO ALL USER SESSIONS!');
    } catch (err: any) {
      setBFeedback(`❌ Failed to publish broadcast: ${err.message || 'Error'}`);
    } finally {
      setBSaving(false);
    }
  };

  const handleSaveMaintenance = async () => {
    setMSaving(true);
    setMFeedback(null);
    try {
      // Calculate active target end time if enabling now
      const calculatedEnd = mEnabled 
        ? (mEstimatedEndTime && new Date(mEstimatedEndTime).getTime() > Date.now() 
            ? mEstimatedEndTime 
            : new Date(Date.now() + mDurationMinutes * 60000).toISOString())
        : undefined;

      const updated: MaintenanceModeState = {
        enabled: mEnabled,
        message: mMessage,
        durationMinutes: mDurationMinutes,
        estimatedEndTime: calculatedEnd,
        updatedAt: new Date().toISOString()
      };
      if (onUpdateMaintenance) {
        await onUpdateMaintenance(updated);
      } else {
        await fetch('/api/admin/maintenance', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'X-Admin-PIN': '9264'
          },
          body: JSON.stringify(updated)
        });
      }
      setMFeedback(mEnabled ? `🔒 MAINTENANCE ACTIVE! COUNTDOWN TIMER SET FOR ${mDurationMinutes} MINUTES.` : '🟢 SYSTEM MAINTENANCE MODE DEACTIVATED!');
    } catch (err: any) {
      setMFeedback(`❌ Failed to update maintenance mode: ${err.message || 'Error'}`);
    } finally {
      setMSaving(false);
    }
  };

  const osintFeatures = [
    { id: 'phone-osint', name: 'Phone OSINT Lookup', icon: '📱' },
    { id: 'aadhar-search', name: 'Aadhaar Intelligence', icon: '🆔' },
    { id: 'upi-search', name: 'UPI VPA Search', icon: '💳' },
    { id: 'email-search', name: 'Email OSINT Breach', icon: '🌐' },
    { id: 'vehicle-search', name: 'Vehicle RC Status', icon: '🚗' },
    { id: 'imei-search', name: 'IMEI Blacklist Recon', icon: '⚡' },
    { id: 'telegram-search', name: 'Telegram ID Intel', icon: '💬' },
    { id: 'raw-json', name: 'Raw JSON Payload Output', icon: '💻' }
  ];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-[#020d06]/90 backdrop-blur-md animate-fade-in overflow-y-auto overscroll-contain min-h-[100dvh]"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-3xl max-h-[94dvh] bg-[#071510] border-2 border-[#1a5c35] rounded-2xl sm:rounded-3xl shadow-[0_0_60px_rgba(0,255,213,0.25)] flex flex-col overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HUD Corners */}
        <span className="hud-corner hud-tl" />
        <span className="hud-corner hud-tr" />
        <span className="hud-corner hud-bl" />
        <span className="hud-corner hud-br" />

        {/* Modal Header */}
        <div className="flex items-center justify-between p-3.5 sm:p-5 border-b border-[#0f3320] bg-[#020d06]/80 sticky top-0 z-20 backdrop-blur-md">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#020d06] border border-[#00ffd5] flex items-center justify-center text-[#00ffd5] shadow-[0_0_15px_rgba(0,255,213,0.3)] shrink-0">
              <ShieldCheck className="w-5 h-5 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h3 className="font-['Orbitron'] text-sm sm:text-lg font-black text-[#f0fff4] uppercase tracking-wider truncate">
                  ADMIN MASTER CONTROL HUB
                </h3>
                <span className="px-1.5 sm:px-2 py-0.5 rounded bg-[#00ffd5]/15 border border-[#00ffd5]/40 text-[#00ffd5] font-['JetBrains_Mono'] text-[8px] sm:text-[9px] uppercase font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00ffd5] animate-ping" />
                  <span>SUPERADMIN</span>
                </span>
              </div>
              <p className="font-['JetBrains_Mono'] text-[9px] sm:text-[11px] text-[#3d7a52] uppercase truncate">
                FULL PAGE FEATURE MANAGEMENT, BROADCAST & SYSTEM CONTROLS
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={onLockAdmin}
              className="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-[#020d06] hover:bg-[#1a0509] border border-[#0f3320] hover:border-[#ff4060] text-[#3d7a52] hover:text-[#ff4060] transition-colors cursor-pointer flex items-center gap-1 text-[10px] sm:text-xs font-['JetBrains_Mono'] uppercase touch-manipulation min-h-[38px]"
              title="Lock Admin session"
            >
              <Lock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">LOCK SESSION</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 sm:p-2.5 rounded-xl bg-[#020d06] hover:bg-[#1a0509] border border-[#0f3320] hover:border-[#ff4060] text-[#3d7a52] hover:text-[#ff4060] transition-colors cursor-pointer touch-manipulation min-h-[38px] min-w-[38px] flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 p-2 sm:p-3 border-b border-[#0f3320] bg-[#020d06]/60 overflow-x-auto no-scrollbar scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-2 sm:px-4 sm:py-2 rounded-xl font-['Orbitron'] font-bold text-[10px] sm:text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap min-h-[38px] touch-manipulation ${
              activeTab === 'overview'
                ? 'bg-[#00ffd5]/20 text-[#00ffd5] border border-[#00ffd5]/50 shadow-[0_0_15px_rgba(0,255,213,0.2)]'
                : 'bg-[#020d06] text-[#3d7a52] border border-transparent hover:text-[#f0fff4] hover:bg-[#071a10]'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>OVERVIEW</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('broadcast')}
            className={`px-3 py-2 sm:px-4 sm:py-2 rounded-xl font-['Orbitron'] font-bold text-[10px] sm:text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap min-h-[38px] touch-manipulation relative ${
              activeTab === 'broadcast'
                ? 'bg-[#c8ff00]/20 text-[#c8ff00] border border-[#c8ff00]/50 shadow-[0_0_15px_rgba(200,255,0,0.2)]'
                : 'bg-[#020d06] text-[#3d7a52] border border-transparent hover:text-[#f0fff4] hover:bg-[#071a10]'
            }`}
          >
            <Megaphone className="w-3.5 h-3.5 animate-bounce" />
            <span>BROADCAST BANNER</span>
            {bEnabled && (
              <span className="w-2 h-2 rounded-full bg-[#c8ff00] animate-ping ml-0.5" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('features')}
            className={`px-3 py-2 sm:px-4 sm:py-2 rounded-xl font-['Orbitron'] font-bold text-[10px] sm:text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap min-h-[38px] touch-manipulation ${
              activeTab === 'features'
                ? 'bg-[#00ffd5]/20 text-[#00ffd5] border border-[#00ffd5]/50 shadow-[0_0_15px_rgba(0,255,213,0.2)]'
                : 'bg-[#020d06] text-[#3d7a52] border border-transparent hover:text-[#f0fff4] hover:bg-[#071a10]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>FEATURE VISIBILITY</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('maintenance')}
            className={`px-3 py-2 sm:px-4 sm:py-2 rounded-xl font-['Orbitron'] font-bold text-[10px] sm:text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap min-h-[38px] touch-manipulation ${
              activeTab === 'maintenance'
                ? 'bg-[#ff4060]/20 text-[#ff4060] border border-[#ff4060]/50 shadow-[0_0_15px_rgba(255,64,96,0.2)]'
                : 'bg-[#020d06] text-[#3d7a52] border border-transparent hover:text-[#f0fff4] hover:bg-[#071a10]'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            <span>MAINTENANCE MODE</span>
            {mEnabled && (
              <span className="w-2 h-2 rounded-full bg-[#ff4060] animate-ping ml-0.5" />
            )}
          </button>
        </div>

        {/* Modal Scrollable Content Area */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(94dvh-140px)] space-y-4">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* HARDCODED GLOBAL RESULT PRIVACY SHIELD */}
              <div className={`p-4 sm:p-5 rounded-2xl border-2 transition-all duration-300 relative overflow-hidden ${
                hideResultsForUsers 
                  ? 'bg-[#150407] border-[#ff4060] shadow-[0_0_25px_rgba(255,64,96,0.25)]' 
                  : 'bg-[#03150c] border-[#00ffd5] shadow-[0_0_25px_rgba(0,255,213,0.18)]'
              }`}>
                <span className="hud-corner hud-tl" />
                <span className="hud-corner hud-tr" />
                <span className="hud-corner hud-bl" />
                <span className="hud-corner hud-br" />

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl border flex items-center justify-center shrink-0 transition-transform ${
                      hideResultsForUsers 
                        ? 'bg-[#25080e] border-[#ff4060] text-[#ff4060] shadow-[0_0_15px_rgba(255,64,96,0.3)]' 
                        : 'bg-[#062013] border-[#00ffd5] text-[#00ffd5] shadow-[0_0_15px_rgba(0,255,213,0.3)]'
                    }`}>
                      {hideResultsForUsers ? (
                        <EyeOff className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
                      ) : (
                        <Eye className="w-5 h-5 sm:w-6 sm:h-6" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h5 className="font-['Orbitron'] text-xs sm:text-sm font-bold text-[#f0fff4] uppercase tracking-wider">
                          GLOBAL RESULT PRIVACY SHIELD
                        </h5>
                        <span className={`px-2 py-0.5 rounded font-['JetBrains_Mono'] text-[9px] sm:text-[10px] font-bold uppercase tracking-wider border ${
                          hideResultsForUsers
                            ? 'bg-[#ff4060]/20 text-[#ff4060] border-[#ff4060]/40'
                            : 'bg-[#00ffd5]/20 text-[#00ffd5] border-[#00ffd5]/40'
                        }`}>
                          {hideResultsForUsers ? '🔒 HIDDEN FROM USERS' : '👁️ VISIBLE TO USERS'}
                        </span>
                      </div>
                      <p className="font-['JetBrains_Mono'] text-[11px] text-[#7fff50] mt-1 leading-relaxed">
                        {hideResultsForUsers 
                          ? 'HARDCODED SHIELD ACTIVE: Regular users cannot see raw OSINT payload results. Only authenticated Admin session sees output.'
                          : 'NORMAL MODE: Results and OSINT payloads are fully visible to authenticated portal users.'
                        }
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onToggleResultVisibility(!hideResultsForUsers)}
                    className={`w-full sm:w-auto px-4 py-2.5 rounded-xl font-['Orbitron'] font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 active:scale-95 shadow-lg min-h-[42px] touch-manipulation ${
                      hideResultsForUsers
                        ? 'bg-[#00ffd5] hover:bg-[#33ffe0] text-[#020d06] shadow-[0_0_15px_rgba(0,255,213,0.4)]'
                        : 'bg-[#ff4060] hover:bg-[#ff5a75] text-[#f0fff4] shadow-[0_0_15px_rgba(255,64,96,0.4)]'
                    }`}
                  >
                    {hideResultsForUsers ? (
                      <>
                        <Eye className="w-4 h-4" />
                        <span>UNHIDE FOR USERS</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-4 h-4" />
                        <span>HIDE FROM USERS</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* CORE ADMIN MODULE CARDS GRID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {/* OPTION 1: PIN & EXPIRING KEY MANAGEMENT */}
                <div 
                  onClick={() => {
                    onClose();
                    onSelectPinManagement();
                  }}
                  className="group relative p-4 sm:p-5 rounded-2xl bg-[#020d06] hover:bg-[#071a10] border-2 border-[#1a5c35] hover:border-[#c8ff00] transition-all duration-300 cursor-pointer shadow-[0_0_20px_rgba(0,0,0,0.5)] hover:shadow-[0_0_30px_rgba(200,255,0,0.25)] flex flex-col justify-between touch-manipulation active:scale-[0.98]"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#071510] border border-[#c8ff00]/40 group-hover:border-[#c8ff00] flex items-center justify-center text-[#c8ff00] transition-all group-hover:scale-110 shadow-[0_0_15px_rgba(200,255,0,0.2)]">
                        <Timer className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                      <span className="px-2 py-0.5 rounded bg-[#c8ff00]/10 border border-[#c8ff00]/30 text-[#c8ff00] font-['JetBrains_Mono'] text-[10px] font-bold">
                        DAYS / HOURS / MINS
                      </span>
                    </div>

                    <div>
                      <h5 className="font-['Orbitron'] text-sm sm:text-base font-bold text-[#f0fff4] group-hover:text-[#c8ff00] transition-colors flex items-center gap-1.5">
                        <span>PIN & EXPIRING KEYS</span>
                      </h5>
                      <p className="font-['JetBrains_Mono'] text-[11px] text-[#7fff50] mt-1.5 leading-relaxed">
                        Generate temporary access keys with custom duration (days, hours, minutes), revoke PINs instantly, and manage MongoDB password logs.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#0f3320] flex items-center justify-between text-xs font-['Orbitron'] font-bold text-[#c8ff00]">
                    <span className="flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5" />
                      <span>OPEN PIN MANAGER</span>
                    </span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                  </div>
                </div>

                {/* OPTION 2: API AUTOMATION & PAUSE CONTROLLER */}
                <div 
                  onClick={() => {
                    onClose();
                    onSelectApiAutomation();
                  }}
                  className="group relative p-4 sm:p-5 rounded-2xl bg-[#020d06] hover:bg-[#071a10] border-2 border-[#1a5c35] hover:border-[#00ffd5] transition-all duration-300 cursor-pointer shadow-[0_0_20px_rgba(0,0,0,0.5)] hover:shadow-[0_0_30px_rgba(0,255,213,0.25)] flex flex-col justify-between touch-manipulation active:scale-[0.98]"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#071510] border border-[#00ffd5]/40 group-hover:border-[#00ffd5] flex items-center justify-center text-[#00ffd5] transition-all group-hover:scale-110 shadow-[0_0_15px_rgba(0,255,213,0.2)]">
                        <Wand2 className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                      <span className="px-2 py-0.5 rounded bg-[#00ffd5]/10 border border-[#00ffd5]/30 text-[#00ffd5] font-['JetBrains_Mono'] text-[10px] font-bold">
                        {apiCount} AUTOMATED APIS
                      </span>
                    </div>

                    <div>
                      <h5 className="font-['Orbitron'] text-sm sm:text-base font-bold text-[#f0fff4] group-hover:text-[#00ffd5] transition-colors flex items-center gap-1.5">
                        <span>API AUTOMATION & PAUSE</span>
                      </h5>
                      <p className="font-['JetBrains_Mono'] text-[11px] text-[#7fff50] mt-1.5 leading-relaxed">
                        Auto-detect API structures, pause/resume specific endpoints, configure headers/params, and perform live payload testing.
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#0f3320] flex items-center justify-between text-xs font-['Orbitron'] font-bold text-[#00ffd5]">
                    <span className="flex items-center gap-1.5">
                      <Server className="w-3.5 h-3.5" />
                      <span>OPEN API ENGINE</span>
                    </span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                  </div>
                </div>

                {/* OPTION 3: ADD NEW FEATURE CARD */}
                {onOpenAddFeature && (
                  <div 
                    onClick={() => {
                      onClose();
                      onOpenAddFeature();
                    }}
                    className="group relative p-4 sm:p-5 rounded-2xl bg-[#020d06] hover:bg-[#071a10] border-2 border-[#1a5c35] hover:border-[#c8ff00] transition-all duration-300 cursor-pointer shadow-[0_0_20px_rgba(0,0,0,0.5)] hover:shadow-[0_0_30px_rgba(200,255,0,0.25)] flex flex-col justify-between sm:col-span-2 touch-manipulation active:scale-[0.98]"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#071510] border border-[#c8ff00]/40 group-hover:border-[#c8ff00] flex items-center justify-center text-[#c8ff00] transition-all group-hover:scale-110 shadow-[0_0_15px_rgba(200,255,0,0.2)]">
                          <Plus className="w-6 h-6 stroke-[3]" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h5 className="font-['Orbitron'] text-sm sm:text-base font-bold text-[#f0fff4] group-hover:text-[#c8ff00] transition-colors">
                              ADD NEW FEATURE CARD
                            </h5>
                            <span className="px-2 py-0.5 rounded bg-[#c8ff00]/15 text-[#c8ff00] border border-[#c8ff00]/40 font-['JetBrains_Mono'] text-[9px] font-bold uppercase">
                              CUSTOM CARD CREATOR
                            </span>
                          </div>
                          <p className="font-['JetBrains_Mono'] text-[11px] text-[#7fff50] mt-1 leading-relaxed">
                            Create a new OSINT module card (PAN, Passport, Bank, Custom) and set its API parameters directly in API Management.
                          </p>
                        </div>
                      </div>
                      <div className="hidden sm:flex items-center gap-2 text-xs font-['Orbitron'] font-bold text-[#c8ff00] shrink-0">
                        <span>CREATE CARD</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* OPTION 3: CUSTOM TEXT & PROMOTION FILTER */}
              <div
                onClick={() => {
                  onClose();
                  onOpenTextFilterModal();
                }}
                className="group relative p-4 sm:p-5 rounded-2xl bg-[#020d06] hover:bg-[#071a10] border-2 border-[#1a5c35] hover:border-[#c8ff00] transition-all duration-300 cursor-pointer shadow-[0_0_20px_rgba(0,0,0,0.5)] hover:shadow-[0_0_30px_rgba(200,255,0,0.2)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 touch-manipulation active:scale-[0.99]"
              >
                <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#071510] border border-[#c8ff00]/40 group-hover:border-[#c8ff00] flex items-center justify-center text-[#c8ff00] transition-all group-hover:scale-110 shadow-[0_0_15px_rgba(200,255,0,0.2)] shrink-0">
                    <Filter className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h5 className="font-['Orbitron'] text-sm sm:text-base font-bold text-[#f0fff4] group-hover:text-[#c8ff00] transition-colors">
                        CUSTOM TEXT & PROMOTION FILTER
                      </h5>
                      <span className="px-2 py-0.5 rounded bg-[#c8ff00]/10 border border-[#c8ff00]/30 text-[#c8ff00] font-['JetBrains_Mono'] text-[10px] font-bold">
                        {activeFilterCount} ACTIVE FILTERS
                      </span>
                    </div>
                    <p className="font-['JetBrains_Mono'] text-[11px] text-[#7fff50] mt-1 leading-relaxed">
                      Filter out watermarks, developer promo links (t.me/...), or specific keywords across OSINT response views.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-['Orbitron'] font-bold text-[#c8ff00] shrink-0 self-end sm:self-center">
                  <span>MANAGE FILTERS</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                </div>
              </div>

              {/* OPTION 4: MONGODB AUDIT LOGS */}
              {onOpenMongoLogs && (
                <div
                  onClick={() => {
                    onClose();
                    onOpenMongoLogs();
                  }}
                  className="group relative p-3.5 sm:p-4 rounded-2xl bg-[#020d06] hover:bg-[#071a10] border border-[#0f3320] hover:border-[#00ffd5] transition-all duration-300 cursor-pointer flex items-center justify-between gap-3 touch-manipulation"
                >
                  <div className="flex items-center gap-3">
                    <Database className="w-5 h-5 text-[#00ffd5] shrink-0" />
                    <div>
                      <h5 className="font-['Orbitron'] text-xs sm:text-sm font-bold text-[#f0fff4] group-hover:text-[#00ffd5] transition-colors">
                        SECURITY AUDIT & PASSWORD LOGS
                      </h5>
                      <p className="font-['JetBrains_Mono'] text-[10px] text-[#3d7a52]">
                        View real-time password changes, permanent key audits & MongoDB sync status.
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#00ffd5] group-hover:translate-x-1 transition-transform shrink-0" />
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SYSTEM BROADCAST EDITOR */}
          {activeTab === 'broadcast' && (
            <div className="p-4 sm:p-5 rounded-2xl bg-[#020d06] border-2 border-[#1a5c35] space-y-4">
              <div className="flex items-center justify-between border-b border-[#0f3320] pb-3">
                <div className="flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-[#c8ff00]" />
                  <h4 className="font-['Orbitron'] text-sm sm:text-base font-bold text-[#f0fff4] uppercase">
                    SYSTEM BROADCAST ANNOUNCER
                  </h4>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="font-['JetBrains_Mono'] text-xs text-[#3d7a52] uppercase font-bold">
                    {bEnabled ? 'BROADCAST ON' : 'BROADCAST OFF'}
                  </span>
                  <input
                    type="checkbox"
                    checked={bEnabled}
                    onChange={(e) => setBEnabled(e.target.checked)}
                    className="w-5 h-5 accent-[#c8ff00] rounded cursor-pointer"
                  />
                </label>
              </div>

              {bFeedback && (
                <div className="p-3 rounded-xl bg-[#071e12] border border-[#c8ff00]/40 text-[#c8ff00] font-['JetBrains_Mono'] text-xs font-bold animate-fade-in">
                  {bFeedback}
                </div>
              )}

              <div className="space-y-3">
                {/* Broadcast Title & Type */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-['Orbitron'] text-[11px] text-[#3d7a52] uppercase mb-1 font-bold">
                      ANNOUNCEMENT TITLE
                    </label>
                    <input
                      type="text"
                      value={bTitle}
                      onChange={(e) => setBTitle(e.target.value)}
                      placeholder="e.g. SYSTEM ANNOUNCEMENT"
                      className="w-full px-3 py-2 rounded-xl bg-[#071510] border border-[#0f3320] focus:border-[#c8ff00] text-[#f0fff4] font-['JetBrains_Mono'] text-xs outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-['Orbitron'] text-[11px] text-[#3d7a52] uppercase mb-1 font-bold">
                      BANNER THEME / BADGE
                    </label>
                    <select
                      value={bType}
                      onChange={(e) => setBType(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-[#071510] border border-[#0f3320] focus:border-[#c8ff00] text-[#f0fff4] font-['JetBrains_Mono'] text-xs outline-none"
                    >
                      <option value="info">NEON CYAN (INFO)</option>
                      <option value="warning">HIGH VOLTAGE GOLD (WARNING)</option>
                      <option value="critical">CRIMSON RED (URGENT)</option>
                      <option value="success">MATRIX GREEN (SUCCESS)</option>
                    </select>
                  </div>
                </div>

                {/* Broadcast Message */}
                <div>
                  <label className="block font-['Orbitron'] text-[11px] text-[#3d7a52] uppercase mb-1 font-bold">
                    BROADCAST MESSAGE CONTENT (LIVE MARQUEE TEXT)
                  </label>
                  <textarea
                    rows={3}
                    value={bMessage}
                    onChange={(e) => setBMessage(e.target.value)}
                    placeholder="Enter broadcast announcement message to show to all portal visitors..."
                    className="w-full px-3 py-2 rounded-xl bg-[#071510] border border-[#0f3320] focus:border-[#c8ff00] text-[#f0fff4] font-['JetBrains_Mono'] text-xs outline-none resize-none"
                  />
                </div>

                {/* Options: Marquee & Dismissable */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-[#071510] border border-[#0f3320] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={bMarquee}
                      onChange={(e) => setBMarquee(e.target.checked)}
                      className="w-4 h-4 accent-[#c8ff00]"
                    />
                    <span className="font-['JetBrains_Mono'] text-xs text-[#f0fff4]">
                      SCROLLING MARQUEE ANIMATION
                    </span>
                  </label>

                  <label className="flex items-center gap-2 p-2.5 rounded-xl bg-[#071510] border border-[#0f3320] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={bDismissable}
                      onChange={(e) => setBDismissable(e.target.checked)}
                      className="w-4 h-4 accent-[#c8ff00]"
                    />
                    <span className="font-['JetBrains_Mono'] text-xs text-[#f0fff4]">
                      ALLOW USER TO DISMISS BANNER
                    </span>
                  </label>
                </div>

                {/* Optional Action Link */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block font-['Orbitron'] text-[10px] text-[#3d7a52] uppercase mb-1 font-bold">
                      ACTION BUTTON LABEL (OPTIONAL)
                    </label>
                    <input
                      type="text"
                      value={bActionText}
                      onChange={(e) => setBActionText(e.target.value)}
                      placeholder="e.g. JOIN TELEGRAM"
                      className="w-full px-3 py-2 rounded-xl bg-[#071510] border border-[#0f3320] focus:border-[#c8ff00] text-[#f0fff4] font-['JetBrains_Mono'] text-xs outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-['Orbitron'] text-[10px] text-[#3d7a52] uppercase mb-1 font-bold">
                      ACTION URL (OPTIONAL)
                    </label>
                    <input
                      type="text"
                      value={bActionUrl}
                      onChange={(e) => setBActionUrl(e.target.value)}
                      placeholder="e.g. https://t.me/yourchannel"
                      className="w-full px-3 py-2 rounded-xl bg-[#071510] border border-[#0f3320] focus:border-[#c8ff00] text-[#f0fff4] font-['JetBrains_Mono'] text-xs outline-none"
                    />
                  </div>
                </div>

                {/* PREVIEW BANNER */}
                <div className="mt-3 p-3 rounded-xl bg-[#020d06] border border-[#0f3320] space-y-1.5">
                  <span className="font-['Orbitron'] text-[10px] text-[#3d7a52] uppercase font-bold flex items-center gap-1">
                    <Eye className="w-3 h-3 text-[#c8ff00]" />
                    LIVE BANNER PREVIEW:
                  </span>
                  <div className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 ${
                    bType === 'critical' ? 'bg-[#25080e] border-[#ff4060] text-[#ff4060]' :
                    bType === 'warning' ? 'bg-[#1f1a05] border-[#c8ff00] text-[#c8ff00]' :
                    bType === 'success' ? 'bg-[#062013] border-[#7fff50] text-[#7fff50]' :
                    'bg-[#06201e] border-[#00ffd5] text-[#00ffd5]'
                  }`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-black/40 border border-current shrink-0">
                        {bTitle}
                      </span>
                      <span className="font-['JetBrains_Mono'] text-xs font-bold truncate">
                        {bMessage || 'Broadcast message preview text...'}
                      </span>
                    </div>
                    {bActionText && (
                      <span className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-black/50 border border-current shrink-0">
                        {bActionText}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSaveBroadcast}
                  disabled={bSaving}
                  className="w-full mt-2 py-3 rounded-xl bg-[#c8ff00] hover:bg-[#d8ff33] text-[#020d06] font-['Orbitron'] font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(200,255,0,0.3)] active:scale-95 min-h-[44px] touch-manipulation"
                >
                  <Send className="w-4 h-4" />
                  <span>{bSaving ? 'PUBLISHING BROADCAST...' : 'PUBLISH LIVE BROADCAST TO ALL USERS'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: FEATURE-SPECIFIC VISIBILITY CONTROLLER */}
          {activeTab === 'features' && (
            <div className="p-4 sm:p-5 rounded-2xl bg-[#020d06] border-2 border-[#1a5c35] space-y-4">
              <div className="border-b border-[#0f3320] pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-['Orbitron'] text-sm sm:text-base font-bold text-[#f0fff4] uppercase flex items-center gap-2">
                    <Layers className="w-5 h-5 text-[#00ffd5]" />
                    <span>PER-FEATURE OSINT STAGE VISIBILITY CONTROLLER</span>
                  </h4>
                  <p className="font-['JetBrains_Mono'] text-[11px] text-[#3d7a52] mt-1">
                    Toggle visibility for each feature card or create new cards directly.
                  </p>
                </div>
                {onOpenAddFeature && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenAddFeature();
                    }}
                    className="px-3.5 py-2 rounded-xl bg-[#c8ff00] hover:bg-[#d8ff33] text-[#020d06] font-['Orbitron'] font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(200,255,0,0.3)] shrink-0 active:scale-95 touch-manipulation min-h-[38px]"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>+ ADD FEATURE CARD</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {featureList.map((feat) => {
                  const isHidden = Boolean(featureVisibility[feat.id]);
                  return (
                    <div 
                      key={feat.id}
                      className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-2 ${
                        isHidden 
                          ? 'bg-[#180509] border-[#ff4060]/50 text-[#ff4060]' 
                          : 'bg-[#071510] border-[#0f3320] text-[#f0fff4]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-base shrink-0">{feat.icon}</span>
                        <div className="min-w-0">
                          <h6 className="font-['Orbitron'] text-xs font-bold truncate">
                            {feat.name}
                          </h6>
                          <span className="font-['JetBrains_Mono'] text-[9px] uppercase font-bold text-[#3d7a52]">
                            STAGE ID: {feat.id}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onToggleFeatureVisibility && onToggleFeatureVisibility(feat.id, !isHidden)}
                        className={`px-2.5 py-1.5 rounded-lg font-['Orbitron'] font-bold text-[10px] uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shrink-0 min-h-[34px] touch-manipulation ${
                          isHidden
                            ? 'bg-[#ff4060]/20 text-[#ff4060] border border-[#ff4060]/40'
                            : 'bg-[#00ffd5]/15 text-[#00ffd5] border border-[#00ffd5]/40 hover:bg-[#00ffd5]/25'
                        }`}
                      >
                        {isHidden ? (
                          <>
                            <EyeOff className="w-3.5 h-3.5" />
                            <span>CONCEALED</span>
                          </>
                        ) : (
                          <>
                            <Eye className="w-3.5 h-3.5" />
                            <span>VISIBLE</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: MAINTENANCE MODE CONTROLLER */}
          {activeTab === 'maintenance' && (
            <div className="p-4 sm:p-5 rounded-2xl bg-[#020d06] border-2 border-[#ff4060]/50 space-y-4">
              <div className="flex items-center justify-between border-b border-[#0f3320] pb-3">
                <div className="flex items-center gap-2">
                  <Power className="w-5 h-5 text-[#ff4060]" />
                  <h4 className="font-['Orbitron'] text-sm sm:text-base font-bold text-[#f0fff4] uppercase">
                    SITE MAINTENANCE SWITCH
                  </h4>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className={`font-['JetBrains_Mono'] text-xs font-bold uppercase ${mEnabled ? 'text-[#ff4060]' : 'text-[#3d7a52]'}`}>
                    {mEnabled ? 'MAINTENANCE ACTIVE' : 'NORMAL OPERATION'}
                  </span>
                  <input
                    type="checkbox"
                    checked={mEnabled}
                    onChange={(e) => setMEnabled(e.target.checked)}
                    className="w-5 h-5 accent-[#ff4060] rounded cursor-pointer"
                  />
                </label>
              </div>

              {mFeedback && (
                <div className="p-3 rounded-xl bg-[#1d060a] border border-[#ff4060]/40 text-[#ff4060] font-['JetBrains_Mono'] text-xs font-bold animate-fade-in">
                  {mFeedback}
                </div>
              )}

              {/* Maintenance Duration Timer Configuration */}
              <div className="space-y-2 p-3.5 rounded-xl bg-[#071510] border border-[#0f3320]">
                <div className="flex items-center justify-between">
                  <label className="font-['Orbitron'] text-[11px] text-[#00ffd5] uppercase font-bold flex items-center gap-1.5">
                    <Timer className="w-3.5 h-3.5 text-[#ff4060]" />
                    <span>SET MAINTENANCE COUNTDOWN TIMER</span>
                  </label>
                  <span className="font-['JetBrains_Mono'] text-[10px] text-[#c8ff00] font-bold">
                    {mDurationMinutes} MINUTES ({Math.floor(mDurationMinutes / 60)}h {mDurationMinutes % 60}m)
                  </span>
                </div>

                {/* Quick Presets */}
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 pt-1">
                  {[
                    { label: '15m', mins: 15 },
                    { label: '30m', mins: 30 },
                    { label: '1h', mins: 60 },
                    { label: '2h', mins: 120 },
                    { label: '4h', mins: 240 },
                    { label: '12h', mins: 720 },
                    { label: '24h', mins: 1440 }
                  ].map((p) => {
                    const isSelected = mDurationMinutes === p.mins;
                    return (
                      <button
                        key={p.mins}
                        type="button"
                        onClick={() => handleSelectDuration(p.mins)}
                        className={`py-1.5 rounded-lg font-['Orbitron'] text-[10px] uppercase font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#ff4060] text-[#f0fff4] shadow-[0_0_10px_rgba(255,64,96,0.4)]'
                            : 'bg-[#020d06] text-[#3d7a52] hover:text-[#00ffd5] border border-[#0f3320]'
                        }`}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Minutes Input */}
                <div className="pt-2 flex items-center gap-2">
                  <span className="text-[10px] font-['JetBrains_Mono'] text-[#3d7a52] uppercase shrink-0">
                    CUSTOM DURATION (MINS):
                  </span>
                  <input
                    type="number"
                    min="1"
                    max="10080"
                    value={mDurationMinutes}
                    onChange={(e) => {
                      const val = Math.max(1, parseInt(e.target.value, 10) || 1);
                      handleSelectDuration(val);
                    }}
                    className="w-24 px-2 py-1 rounded-lg bg-[#020d06] border border-[#0f3320] focus:border-[#ff4060] text-[#f0fff4] font-mono text-xs outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-['Orbitron'] text-[11px] text-[#3d7a52] uppercase mb-1 font-bold">
                  MAINTENANCE NOTICE MESSAGE FOR VISITORS
                </label>
                <textarea
                  rows={3}
                  value={mMessage}
                  onChange={(e) => setMMessage(e.target.value)}
                  placeholder="Enter maintenance reason or message..."
                  className="w-full px-3 py-2 rounded-xl bg-[#071510] border border-[#0f3320] focus:border-[#ff4060] text-[#f0fff4] font-['JetBrains_Mono'] text-xs outline-none resize-none"
                />
              </div>

              <div className="p-3 rounded-xl bg-[#120407] border border-[#ff4060]/30 text-[11px] font-['JetBrains_Mono'] text-[#ff4060] leading-relaxed">
                ⚠️ NOTICE: When maintenance mode is active, ALL features on the portal are completely blocked and hidden for regular visitors. A live countdown timer set by you will run on their screen until maintenance finishes. Admins can bypass using PIN (2007 or bypass button).
              </div>

              <button
                type="button"
                onClick={handleSaveMaintenance}
                disabled={mSaving}
                className="w-full py-3 rounded-xl bg-[#ff4060] hover:bg-[#ff5a75] text-[#f0fff4] font-['Orbitron'] font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,64,96,0.3)] active:scale-95 min-h-[44px] touch-manipulation"
              >
                <Power className="w-4 h-4" />
                <span>{mSaving ? 'SAVING MAINTENANCE SETTINGS...' : 'ACTIVATE / UPDATE MAINTENANCE & TIMER'}</span>
              </button>
            </div>
          )}

          {/* Database Security Footer */}
          <div className="p-3 rounded-xl bg-[#020d06] border border-[#0f3320] flex items-center justify-between text-[11px] font-['JetBrains_Mono'] text-[#3d7a52]">
            <div className="flex items-center gap-2">
              <Database className="w-3.5 h-3.5 text-[#00ffd5]" />
              <span>MONGODB SECURITY:</span>
              <span className="text-[#f0fff4]">DATABASE VERIFIED</span>
            </div>
            <span className="text-[#c8ff00] font-bold">PORTAL SECURED</span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 border-t border-[#0f3320] bg-[#020d06]/80 flex items-center justify-between text-xs font-['JetBrains_Mono'] text-[#3d7a52]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00ffd5] animate-pulse" />
            <span>SESSION VALIDATED</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#020d06] border border-[#1a5c35] hover:border-[#00ffd5] text-[#f0fff4] hover:text-[#00ffd5] text-xs transition-colors cursor-pointer min-h-[36px]"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
