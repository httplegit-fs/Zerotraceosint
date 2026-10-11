import React, { useState, useMemo } from 'react';
import { 
  Shield, 
  Plus, 
  Trash2, 
  Eye, 
  EyeOff, 
  RefreshCw, 
  X, 
  Check, 
  AlertTriangle, 
  Filter, 
  Sparkles,
  Ban,
  FileText,
  SlidersHorizontal,
  Search,
  Lock,
  Layers,
  Radio,
  Globe,
  Terminal,
  Server,
  Cpu,
  Code2
} from 'lucide-react';
import { CustomTextFilterItem, FeatureVisibilityMap, TargetFeatureId } from '../types/apiTypes';

export interface FeatureDefinition {
  id: TargetFeatureId;
  name: string;
  stageBadge: string;
  category: string;
  iconName: string;
  description: string;
  presets: Array<{ phrase: string; label: string; action: 'hide' | 'replace'; replaceWith?: string }>;
}

export const SYSTEM_FEATURES: FeatureDefinition[] = [
  {
    id: 'all',
    name: 'GLOBAL (ALL FEATURES)',
    stageBadge: 'GLOBAL',
    category: 'SYSTEM-WIDE',
    iconName: 'Globe',
    description: 'System-wide universal filters applied to all features, responses & stages.',
    presets: [
      { phrase: 't.me/', label: 'Telegram Links (t.me/)', action: 'hide' },
      { phrase: 'telegram', label: 'Telegram Word', action: 'hide' },
      { phrase: 'join channel', label: 'Join Channel Invites', action: 'hide' },
      { phrase: 'buy api', label: 'API Sales / Pricing', action: 'hide' },
      { phrase: 'dm for api', label: 'DM For API Offers', action: 'hide' },
      { phrase: 'developer', label: 'Developer Tag/Credit', action: 'hide' },
      { phrase: 'credits', label: 'Credits / Watermark', action: 'hide' },
      { phrase: 'powered by', label: 'Powered By Branding', action: 'hide' },
      { phrase: 'sponsored', label: 'Sponsored Ads', action: 'hide' },
      { phrase: 'blacklist_status', label: 'Blacklist Status Key', action: 'hide' },
      { phrase: '"blacklist_status": "CLEAN / NOT BLACKLISTED"', label: 'Line: "blacklist_status": "CLEAN / NOT BLACKLISTED"', action: 'hide' },
      { phrase: 'CLEAN / NOT BLACKLISTED', label: 'Clean Blacklist Value', action: 'hide' },
      { phrase: 'contact us', label: 'Contact Prompts', action: 'hide' }
    ]
  },
  {
    id: 'phone-osint',
    name: 'PHONE NUMBER SEARCH',
    stageBadge: 'STAGE 01',
    category: 'NETWORK INTEL',
    iconName: 'Globe',
    description: 'Filter carrier footers, Truecaller spam tags, SIM vendors & telemarketer ads.',
    presets: [
      { phrase: 'truecaller', label: 'Truecaller Branding', action: 'hide' },
      { phrase: 'sim seller', label: 'SIM Vendor Ads', action: 'hide' },
      { phrase: 'carrier promo', label: 'Carrier Promo Footer', action: 'hide' },
      { phrase: 'caller id sponsor', label: 'Caller ID Watermark', action: 'hide' },
      { phrase: 'blacklist_status', label: 'Blacklist Status Key ("blacklist_status")', action: 'hide' },
      { phrase: '"blacklist_status": "CLEAN / NOT BLACKLISTED"', label: 'Full Line: "blacklist_status": "CLEAN / NOT BLACKLISTED"', action: 'hide' },
      { phrase: 'CLEAN / NOT BLACKLISTED', label: 'Clean Blacklist Flag ("CLEAN / NOT BLACKLISTED")', action: 'hide' },
      { phrase: 'bulk sms', label: 'Bulk SMS Vendors', action: 'hide' },
      { phrase: 'hlr lookup promo', label: 'HLR Lookup Ads', action: 'hide' }
    ]
  },
  {
    id: 'aadhar-search',
    name: 'AADHAR SEARCH',
    stageBadge: 'STAGE 02',
    category: 'SECURITY INTEL',
    iconName: 'Shield',
    description: 'Filter UIDAI portal warnings, government disclaimers & verification charges.',
    presets: [
      { phrase: 'uidai disclaimer', label: 'UIDAI Legal Disclaimer', action: 'hide' },
      { phrase: 'portal notice', label: 'Portal Surcharge Notice', action: 'hide' },
      { phrase: 'govt watermark', label: 'Govt Verification Watermark', action: 'hide' },
      { phrase: 'masked card promo', label: 'Card Masking Ads', action: 'hide' },
      { phrase: 'csc center', label: 'CSC Center Contacts', action: 'hide' }
    ]
  },
  {
    id: 'upi-search',
    name: 'UPI SEARCH',
    stageBadge: 'STAGE 03',
    category: 'NETWORK INTEL',
    iconName: 'Terminal',
    description: 'Filter cashback banners, coupon codes, rewards & payment gateway promos.',
    presets: [
      { phrase: 'cashback', label: 'Cashback & Offers', action: 'hide' },
      { phrase: 'reward points', label: 'Rewards / Bonus Coins', action: 'hide' },
      { phrase: 'paytm promo', label: 'Paytm Promotion Links', action: 'hide' },
      { phrase: 'gpay coupon', label: 'GPay Coupon / Scratch Card', action: 'hide' },
      { phrase: 'referral code', label: 'Referral Invite Codes', action: 'hide' },
      { phrase: 'merchant promo', label: 'Payment Gateway Ads', action: 'hide' }
    ]
  },
  {
    id: 'email-search',
    name: 'EMAIL SEARCH',
    stageBadge: 'STAGE 04',
    category: 'NETWORK INTEL',
    iconName: 'Globe',
    description: 'Filter newsletter footers, unsubscribe links, tracking pixels & campaign IDs.',
    presets: [
      { phrase: 'unsubscribe', label: 'Unsubscribe Links', action: 'hide' },
      { phrase: 'newsletter promo', label: 'Newsletter Disclaimers', action: 'hide' },
      { phrase: 'mailer-daemon', label: 'Mailer-Daemon Notices', action: 'hide' },
      { phrase: 'marketing campaign', label: 'Email Campaign Signatures', action: 'hide' },
      { phrase: 'tracking pixel', label: 'Spy Pixel Notices', action: 'hide' }
    ]
  },
  {
    id: 'vehicle-search',
    name: 'VEHICLE SEARCH',
    stageBadge: 'STAGE 05',
    category: 'LAB_SETUP',
    iconName: 'Server',
    description: 'Filter auto insurance quotes, RTO agent contacts, car resale & fastag banners.',
    presets: [
      { phrase: 'insurance quote', label: 'Insurance Policy Quotes', action: 'hide' },
      { phrase: 'car resale promo', label: 'Car Valuation Ads', action: 'hide' },
      { phrase: 'rto agent', label: 'RTO Broker Contact Info', action: 'hide' },
      { phrase: 'vahan surcharge', label: 'Vahan Surcharge Notes', action: 'hide' },
      { phrase: 'fastag promo', label: 'Fastag Vendor Ads', action: 'hide' }
    ]
  },
  {
    id: 'imei-search',
    name: 'IMEI NUMBER SEARCH',
    stageBadge: 'STAGE 06',
    category: 'SECURITY INTEL',
    iconName: 'Cpu',
    description: 'Filter phone unlock services, repair affiliate links & blacklist check ads.',
    presets: [
      { phrase: 'unlock tool', label: 'Carrier Unlock Services', action: 'hide' },
      { phrase: 'icloud bypass', label: 'Bypass Tool Advertisements', action: 'hide' },
      { phrase: 'imei discount', label: 'Paid IMEI Check Discounts', action: 'hide' },
      { phrase: 'repair affiliate', label: 'Phone Repair Affiliate Links', action: 'hide' },
      { phrase: 'blacklist removal', label: 'Blacklist Removal Scams', action: 'hide' }
    ]
  },
  {
    id: 'telegram-search',
    name: 'TELEGRAM ID SEARCH',
    stageBadge: 'STAGE 07',
    category: 'SCRIPTS INTEL',
    iconName: 'Code2',
    description: 'Filter t.me channel links, group invites, VIP groups & bot token sales.',
    presets: [
      { phrase: 't.me/', label: 't.me/ Channel Links', action: 'hide' },
      { phrase: 'join channel', label: 'Join Channel Invites', action: 'hide' },
      { phrase: 'vip group', label: 'VIP Channel Mentions', action: 'hide' },
      { phrase: 'crypto signals', label: 'Crypto Signal Bots', action: 'hide' },
      { phrase: 'buy bot token', label: 'Bot Token Sales Promos', action: 'hide' },
      { phrase: 'dm admin', label: 'DM Admin Prompts', action: 'hide' }
    ]
  },
  {
    id: 'raw-json',
    name: 'RAW RESPONSE & DOSSIER',
    stageBadge: 'PAYLOAD',
    category: 'RAW DATA',
    iconName: 'FileText',
    description: 'Filter internal gateway headers, third-party provider credits & metadata.',
    presets: [
      { phrase: 'x-gateway-provider', label: 'Gateway Provider Tag', action: 'hide' },
      { phrase: 'api-watermark', label: 'API Watermark Headers', action: 'hide' },
      { phrase: 'blacklist_status', label: 'Blacklist Status Key ("blacklist_status")', action: 'hide' },
      { phrase: '"blacklist_status": "CLEAN / NOT BLACKLISTED"', label: 'Full Line: "blacklist_status": "CLEAN / NOT BLACKLISTED"', action: 'hide' },
      { phrase: 'CLEAN / NOT BLACKLISTED', label: 'Clean Blacklist Value', action: 'hide' },
      { phrase: 'diagnostics-banner', label: 'Diagnostic Notice Banners', action: 'hide' },
      { phrase: 'proxy-signature', label: 'Proxy Signature Footprints', action: 'hide' }
    ]
  }
];

interface TextPromotionFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: CustomTextFilterItem[];
  onSaveFilters: (filters: CustomTextFilterItem[]) => void;
  onResetFilters: () => void;
  initialFeatureTab?: string;
  hideResultsForUsers?: boolean;
  onToggleResultVisibility?: (hide: boolean) => void;
  featureVisibility?: FeatureVisibilityMap;
  onToggleFeatureVisibility?: (featureId: string, hide: boolean) => void;
}

export const TextPromotionFilterModal: React.FC<TextPromotionFilterModalProps> = ({
  isOpen,
  onClose,
  filters,
  onSaveFilters,
  onResetFilters,
  initialFeatureTab = 'all',
  hideResultsForUsers = false,
  onToggleResultVisibility,
  featureVisibility = {
    'phone-osint': false,
    'aadhar-search': false,
    'upi-search': false,
    'email-search': false,
    'vehicle-search': false,
    'imei-search': false,
    'telegram-search': false,
    'raw-json': false
  },
  onToggleFeatureVisibility
}) => {
  const [activeFeatureTab, setActiveFeatureTab] = useState<string>(initialFeatureTab || 'all');
  const [localFilters, setLocalFilters] = useState<CustomTextFilterItem[]>(filters);
  const [newPhrase, setNewPhrase] = useState('');
  const [targetFeatureForNew, setTargetFeatureForNew] = useState<string>(initialFeatureTab || 'all');
  const [newAction, setNewAction] = useState<'hide' | 'replace'>('hide');
  const [newReplaceWith, setNewReplaceWith] = useState('');
  const [filterSearchQuery, setFilterSearchQuery] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Sync when props change or modal opens
  React.useEffect(() => {
    setLocalFilters(filters);
  }, [filters, isOpen]);

  React.useEffect(() => {
    if (initialFeatureTab) {
      setActiveFeatureTab(initialFeatureTab);
      setTargetFeatureForNew(initialFeatureTab);
    }
  }, [initialFeatureTab, isOpen]);

  // When active tab changes, sync default target for new filter
  const handleSelectTab = (tabId: string) => {
    setActiveFeatureTab(tabId);
    setTargetFeatureForNew(tabId);
  };

  const triggerSuccessFeedback = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleAddFilter = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const rawClean = newPhrase.trim();
    if (!rawClean) return;
    const cleanPhrase = rawClean.replace(/,\s*$/, '').trim();
    if (!cleanPhrase) return;

    // Check duplicate in same feature scope
    if (localFilters.some(f => 
      f.phrase.toLowerCase() === cleanPhrase.toLowerCase() && 
      (f.targetFeature || 'all') === targetFeatureForNew
    )) {
      return;
    }

    const newItem: CustomTextFilterItem = {
      id: `filter_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      phrase: cleanPhrase,
      enabled: true,
      action: newAction,
      replaceWith: newAction === 'replace' ? newReplaceWith.trim() : undefined,
      targetFeature: targetFeatureForNew,
      addedAt: new Date().toISOString()
    };

    const updated = [newItem, ...localFilters];
    setLocalFilters(updated);
    setNewPhrase('');
    setNewReplaceWith('');
    onSaveFilters(updated);
    triggerSuccessFeedback();
  };

  const handleToggleEnabled = (id: string) => {
    const updated = localFilters.map(f => f.id === id ? { ...f, enabled: !f.enabled } : f);
    setLocalFilters(updated);
    onSaveFilters(updated);
    triggerSuccessFeedback();
  };

  const handleDeleteFilter = (id: string) => {
    const updated = localFilters.filter(f => f.id !== id);
    setLocalFilters(updated);
    onSaveFilters(updated);
    triggerSuccessFeedback();
  };

  const handleAddPreset = (preset: { phrase: string; label: string; action: 'hide' | 'replace'; replaceWith?: string }, targetFeature: string) => {
    const existing = localFilters.find(f => 
      f.phrase.toLowerCase() === preset.phrase.toLowerCase() && 
      (f.targetFeature || 'all') === targetFeature
    );

    if (existing) {
      // Toggle
      const updated = localFilters.map(f => 
        f.id === existing.id ? { ...f, enabled: !f.enabled } : f
      );
      setLocalFilters(updated);
      onSaveFilters(updated);
    } else {
      const newItem: CustomTextFilterItem = {
        id: `filter_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        phrase: preset.phrase,
        enabled: true,
        action: preset.action,
        replaceWith: preset.replaceWith,
        targetFeature: targetFeature,
        addedAt: new Date().toISOString()
      };
      const updated = [newItem, ...localFilters];
      setLocalFilters(updated);
      onSaveFilters(updated);
    }
    triggerSuccessFeedback();
  };

  // Current active feature metadata
  const currentFeature = SYSTEM_FEATURES.find(f => f.id === activeFeatureTab) || SYSTEM_FEATURES[0];

  // Count active filters per feature
  const filterCountsByFeature = useMemo(() => {
    const counts: Record<string, number> = { all: 0 };
    SYSTEM_FEATURES.forEach(sf => {
      counts[sf.id] = localFilters.filter(f => f.enabled && (f.targetFeature || 'all') === sf.id).length;
    });
    // total active across all
    counts['total_active'] = localFilters.filter(f => f.enabled).length;
    return counts;
  }, [localFilters]);

  // Filter list display based on active tab and search query
  const displayedFilters = useMemo(() => {
    return localFilters.filter(f => {
      const matchesFeature = activeFeatureTab === 'all' 
        ? true 
        : (f.targetFeature || 'all') === activeFeatureTab || (f.targetFeature || 'all') === 'all';
      
      const matchesSearch = filterSearchQuery.trim() === ''
        || f.phrase.toLowerCase().includes(filterSearchQuery.toLowerCase())
        || (f.targetFeature || 'all').toLowerCase().includes(filterSearchQuery.toLowerCase());

      return matchesFeature && matchesSearch;
    });
  }, [localFilters, activeFeatureTab, filterSearchQuery]);

  // Check if current tab is concealed for users
  const isTabFeatureConcealed = useMemo(() => {
    if (activeFeatureTab === 'all') {
      return Boolean(hideResultsForUsers);
    }
    return Boolean(hideResultsForUsers || featureVisibility[activeFeatureTab]);
  }, [activeFeatureTab, hideResultsForUsers, featureVisibility]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-[#020d06]/85 backdrop-blur-md animate-fade-in overflow-y-auto overscroll-contain min-h-[100dvh]"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-4xl max-h-[92dvh] bg-[#071510] border-2 border-[#1a5c35] rounded-2xl sm:rounded-3xl shadow-[0_0_60px_rgba(0,255,213,0.25)] flex flex-col overflow-y-auto overscroll-contain my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HUD Corners */}
        <span className="hud-corner hud-tl" />
        <span className="hud-corner hud-tr" />
        <span className="hud-corner hud-bl" />
        <span className="hud-corner hud-br" />

        {/* Modal Header */}
        <div className="flex items-center justify-between p-3.5 sm:p-5 border-b border-[#0f3320] bg-[#020d06]/85 sticky top-0 z-20 backdrop-blur-md">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#020d06] border border-[#c8ff00] flex items-center justify-center text-[#c8ff00] shadow-[0_0_15px_rgba(200,255,0,0.3)] shrink-0">
              <Filter className="w-5 h-5 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h3 className="font-['Orbitron'] text-sm sm:text-base font-black text-[#f0fff4] uppercase tracking-wider truncate">
                  FEATURE SPECIFIC FILTER MANAGER
                </h3>
                <span className="px-2 py-0.5 rounded bg-[#c8ff00]/15 border border-[#c8ff00]/40 text-[#c8ff00] font-['JetBrains_Mono'] text-[9px] uppercase font-bold">
                  {filterCountsByFeature['total_active']} ACTIVE RULES
                </span>
              </div>
              <p className="font-['JetBrains_Mono'] text-[10px] sm:text-[11px] text-[#3d7a52] truncate">
                Har feature aur stage ke liye alag specific text, word, promotion & visibility control
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {savedSuccess && (
              <span className="hidden sm:inline-flex items-center gap-1 font-['JetBrains_Mono'] text-[10px] text-[#00ffd5] bg-[#00ffd5]/10 border border-[#00ffd5]/30 px-2 py-1 rounded">
                <Check className="w-3 h-3" />
                <span>SAVED & SYNCED</span>
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-[#020d06] border border-[#0f3320] hover:border-[#ff4060] flex items-center justify-center text-[#3d7a52] hover:text-[#ff4060] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Feature Navigation Tabs (All Features have specific filters) */}
        <div className="p-2 sm:p-3 bg-[#030e07] border-b border-[#0f3320] overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-1.5 min-w-max">
            {SYSTEM_FEATURES.map((feat) => {
              const isSelected = activeFeatureTab === feat.id;
              const count = filterCountsByFeature[feat.id] || 0;
              const isFeatureHidden = feat.id === 'all' 
                ? Boolean(hideResultsForUsers) 
                : Boolean(featureVisibility[feat.id]);

              return (
                <button
                  key={feat.id}
                  type="button"
                  onClick={() => handleSelectTab(feat.id)}
                  className={`px-3 py-1.5 rounded-xl font-['Orbitron'] text-[10px] sm:text-[11px] uppercase tracking-wider font-bold transition-all flex items-center gap-2 cursor-pointer border ${
                    isSelected
                      ? 'bg-[#c8ff00] text-[#020d06] border-[#c8ff00] shadow-[0_0_15px_rgba(200,255,0,0.35)]'
                      : 'bg-[#05140b] text-[#a0c4ab] hover:text-[#f0fff4] border-[#0f3320] hover:border-[#1a5c35]'
                  }`}
                >
                  <span>{feat.stageBadge}</span>
                  <span className="hidden md:inline">{feat.name}</span>
                  {count > 0 && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono font-black ${
                      isSelected ? 'bg-[#020d06] text-[#c8ff00]' : 'bg-[#c8ff00]/20 text-[#c8ff00]'
                    }`}>
                      {count}
                    </span>
                  )}
                  {isFeatureHidden && (
                    <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-[#ff4060]' : 'bg-[#ff4060] animate-pulse'}`} title="Concealed for regular users" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Main Body */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto">
          {/* Active Feature Control Banner & Result Concealment Switch */}
          <div className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
            isTabFeatureConcealed 
              ? 'bg-[#180407] border-[#ff4060]/70 text-[#ff4060]' 
              : 'bg-[#03150c] border-[#1a5c35] text-[#00ffd5]'
          }`}>
            <div className="flex items-start sm:items-center gap-3 min-w-0">
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${
                isTabFeatureConcealed 
                  ? 'bg-[#25080e] border-[#ff4060] text-[#ff4060]' 
                  : 'bg-[#062013] border-[#00ffd5] text-[#00ffd5]'
              }`}>
                {isTabFeatureConcealed ? <EyeOff className="w-5 h-5 animate-pulse" /> : <Eye className="w-5 h-5" />}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-['Orbitron'] text-xs sm:text-sm font-black uppercase tracking-wider text-[#f0fff4]">
                    {currentFeature.stageBadge}: {currentFeature.name}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-['JetBrains_Mono'] font-bold uppercase border ${
                    isTabFeatureConcealed 
                      ? 'bg-[#ff4060]/20 text-[#ff4060] border-[#ff4060]/40' 
                      : 'bg-[#00ffd5]/15 text-[#00ffd5] border-[#00ffd5]/40'
                  }`}>
                    {isTabFeatureConcealed ? 'CONCEALED FROM USERS' : 'VISIBLE TO USERS'}
                  </span>
                </div>
                <p className="font-['JetBrains_Mono'] text-[10px] sm:text-[11px] text-[#7fff50] mt-0.5">
                  {currentFeature.description}
                </p>
              </div>
            </div>

            {/* Feature Concealment Toggle Buttons */}
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              {currentFeature.id === 'all' ? (
                // Master global visibility toggle
                <button
                  type="button"
                  onClick={() => onToggleResultVisibility && onToggleResultVisibility(!hideResultsForUsers)}
                  className={`px-3 py-2 rounded-xl text-xs font-['Orbitron'] font-black uppercase transition-all flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95 ${
                    hideResultsForUsers
                      ? 'bg-[#00ffd5] hover:bg-[#33ffe0] text-[#020d06] shadow-[0_0_15px_rgba(0,255,213,0.3)]'
                      : 'bg-[#ff4060] hover:bg-[#ff5a75] text-[#f0fff4] shadow-[0_0_15px_rgba(255,64,96,0.3)]'
                  }`}
                >
                  {hideResultsForUsers ? (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      <span>UNHIDE ALL FEATURES</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>HIDE ALL RESULTS FOR USERS</span>
                    </>
                  )}
                </button>
              ) : (
                // Feature-specific visibility toggle
                <button
                  type="button"
                  onClick={() => {
                    if (onToggleFeatureVisibility) {
                      const currentVal = Boolean(featureVisibility[currentFeature.id]);
                      onToggleFeatureVisibility(currentFeature.id, !currentVal);
                    }
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-['Orbitron'] font-black uppercase transition-all flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95 ${
                    featureVisibility[currentFeature.id]
                      ? 'bg-[#00ffd5] hover:bg-[#33ffe0] text-[#020d06] shadow-[0_0_15px_rgba(0,255,213,0.3)]'
                      : 'bg-[#ff4060] hover:bg-[#ff5a75] text-[#f0fff4] shadow-[0_0_15px_rgba(255,64,96,0.3)]'
                  }`}
                >
                  {featureVisibility[currentFeature.id] ? (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      <span>UNHIDE THIS FEATURE</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>HIDE THIS FEATURE FOR USERS</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Add New Custom Filter Section */}
          <div className="p-4 rounded-2xl bg-[#020d06] border border-[#1a5c35] space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-['Orbitron'] text-xs font-bold text-[#c8ff00] uppercase tracking-wider flex items-center gap-2">
                <Plus className="w-3.5 h-3.5" />
                <span>ADD CUSTOM WORD OR PROMOTION FOR {currentFeature.name}</span>
              </h4>
              <span className="font-['JetBrains_Mono'] text-[9px] text-[#3d7a52]">
                CASE-INSENSITIVE MATCHING
              </span>
            </div>

            <form onSubmit={handleAddFilter} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                {/* Input Text */}
                <div className="sm:col-span-5">
                  <input
                    type="text"
                    value={newPhrase}
                    onChange={(e) => setNewPhrase(e.target.value)}
                    placeholder={`e.g. blacklist_status, "CLEAN / NOT BLACKLISTED", or "key": "value"...`}
                    className="w-full bg-[#071510] border border-[#1a5c35] focus:border-[#c8ff00] rounded-xl px-3.5 py-2.5 font-['JetBrains_Mono'] text-xs text-[#f0fff4] placeholder-[#3d7a52] outline-none transition-colors"
                  />
                </div>

                {/* Target Feature Selector */}
                <div className="sm:col-span-3">
                  <select
                    value={targetFeatureForNew}
                    onChange={(e) => setTargetFeatureForNew(e.target.value)}
                    className="w-full bg-[#071510] border border-[#1a5c35] focus:border-[#c8ff00] rounded-xl px-2.5 py-2.5 font-['JetBrains_Mono'] text-xs text-[#00ffd5] outline-none cursor-pointer"
                  >
                    {SYSTEM_FEATURES.map(f => (
                      <option key={f.id} value={f.id}>
                        {f.stageBadge}: {f.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Action Selector */}
                <div className="sm:col-span-2">
                  <select
                    value={newAction}
                    onChange={(e) => setNewAction(e.target.value as any)}
                    className="w-full bg-[#071510] border border-[#1a5c35] focus:border-[#c8ff00] rounded-xl px-2.5 py-2.5 font-['JetBrains_Mono'] text-xs text-[#c8ff00] outline-none cursor-pointer"
                  >
                    <option value="hide">HIDE (REMOVE)</option>
                    <option value="replace">REPLACE WITH</option>
                  </select>
                </div>

                {/* Add Submit Button */}
                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    disabled={!newPhrase.trim()}
                    className="w-full py-2.5 rounded-xl bg-[#c8ff00] hover:bg-[#b0e600] disabled:opacity-40 disabled:pointer-events-none text-[#020d06] font-['Orbitron'] font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(200,255,0,0.3)] active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>ADD</span>
                  </button>
                </div>
              </div>

              {newAction === 'replace' && (
                <div className="flex items-center gap-2 pt-1 animate-fade-in">
                  <span className="text-[10px] font-['JetBrains_Mono'] text-[#3d7a52] shrink-0">Replace text with:</span>
                  <input
                    type="text"
                    value={newReplaceWith}
                    onChange={(e) => setNewReplaceWith(e.target.value)}
                    placeholder="Enter replacement string (or leave empty to strip)..."
                    className="flex-1 bg-[#071510] border border-[#1a5c35] focus:border-[#00ffd5] rounded-lg px-2.5 py-1.5 font-['JetBrains_Mono'] text-xs text-[#f0fff4] placeholder-[#3d7a52] outline-none"
                  />
                </div>
              )}

              <div className="text-[10px] font-['JetBrains_Mono'] text-[#7fff50] flex flex-wrap items-center gap-1.5 pt-1 px-1">
                <span className="text-[#c8ff00] font-bold">💡 KEY & VALUE SUPPORT:</span>
                <span>Aap koi bhi key (jaise <span className="text-[#00ffd5] bg-[#071510] border border-[#0f3320] px-1 rounded">blacklist_status</span>), value (<span className="text-[#00ffd5] bg-[#071510] border border-[#0f3320] px-1 rounded">CLEAN / NOT BLACKLISTED</span>), ya pura pair direct enter karke 1-click me hide/unhide kar sakte hain.</span>
              </div>
            </form>
          </div>

          {/* Quick-Add Feature Specific Presets */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-['Orbitron'] text-[11px] font-bold text-[#f0fff4] uppercase flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#00ffd5]" />
                <span>{currentFeature.stageBadge} PRESET FILTERS (1-CLICK HIDE/UNHIDE)</span>
              </span>
              <span className="font-['JetBrains_Mono'] text-[9px] text-[#3d7a52]">
                TAP PRESET TO TOGGLE
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {currentFeature.presets.map((preset) => {
                const isAlreadyAdded = localFilters.some(
                  f => f.phrase.toLowerCase() === preset.phrase.toLowerCase() 
                    && (f.targetFeature || 'all') === currentFeature.id 
                    && f.enabled
                );

                return (
                  <button
                    key={preset.phrase}
                    type="button"
                    onClick={() => handleAddPreset(preset, currentFeature.id)}
                    className={`px-3 py-1.5 rounded-lg font-['JetBrains_Mono'] text-[10px] border transition-all flex items-center gap-1.5 cursor-pointer ${
                      isAlreadyAdded
                        ? 'bg-[#c8ff00]/20 border-[#c8ff00]/60 text-[#c8ff00] shadow-[0_0_10px_rgba(200,255,0,0.2)]'
                        : 'bg-[#020d06] border-[#0f3320] text-[#a0c4ab] hover:text-[#00ffd5] hover:border-[#00ffd5]/40'
                    }`}
                  >
                    {isAlreadyAdded ? <Check className="w-3 h-3 text-[#c8ff00]" /> : <Plus className="w-3 h-3" />}
                    <span>{preset.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* List of Configured Filters */}
          <div className="space-y-2.5">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#c8ff00]" />
                <span className="font-['Orbitron'] text-xs font-bold text-[#f0fff4] uppercase">
                  ACTIVE RULES FOR {currentFeature.stageBadge} ({displayedFilters.length})
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Search within filters */}
                <div className="relative">
                  <Search className="w-3 h-3 text-[#3d7a52] absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={filterSearchQuery}
                    onChange={(e) => setFilterSearchQuery(e.target.value)}
                    placeholder="Search rules..."
                    className="bg-[#020d06] border border-[#0f3320] focus:border-[#1a5c35] rounded-lg pl-7 pr-2 py-1 text-[10px] font-['JetBrains_Mono'] text-[#f0fff4] placeholder-[#3d7a52] outline-none w-32 sm:w-40"
                  />
                </div>

                <button
                  type="button"
                  onClick={onResetFilters}
                  className="text-[10px] font-['JetBrains_Mono'] text-[#ff4060] hover:underline flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <RefreshCw className="w-2.5 h-2.5" />
                  <span>RESET DEFAULTS</span>
                </button>
              </div>
            </div>

            {displayedFilters.length === 0 ? (
              <div className="p-6 rounded-2xl bg-[#020d06] border border-[#0f3320] text-center space-y-2">
                <FileText className="w-8 h-8 text-[#3d7a52] mx-auto" />
                <p className="font-['JetBrains_Mono'] text-xs text-[#3d7a52]">
                  {filterSearchQuery 
                    ? 'Koi filter match nahi hua search query se.' 
                    : `${currentFeature.name} ke liye koi filter configure nahi hai. Upar diye gaye presets chunein ya naya word add karein.`}
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {displayedFilters.map((filter) => {
                  const targetDef = SYSTEM_FEATURES.find(sf => sf.id === (filter.targetFeature || 'all')) || SYSTEM_FEATURES[0];
                  return (
                    <div
                      key={filter.id}
                      className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                        filter.enabled
                          ? 'bg-[#020d06] border-[#1a5c35] text-[#f0fff4]'
                          : 'bg-[#050e08]/40 border-[#0f3320] text-[#3d7a52] opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <button
                          type="button"
                          onClick={() => handleToggleEnabled(filter.id)}
                          className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                            filter.enabled
                              ? 'bg-[#c8ff00]/15 border-[#c8ff00]/40 text-[#c8ff00]'
                              : 'bg-[#071510] border-[#0f3320] text-[#3d7a52]'
                          }`}
                          title={filter.enabled ? 'Click to UNHIDE (Disable Filter)' : 'Click to HIDE (Enable Filter)'}
                        >
                          {filter.enabled ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`font-['JetBrains_Mono'] text-xs font-bold font-mono ${
                              filter.enabled ? 'text-[#c8ff00]' : 'text-[#3d7a52] line-through'
                            }`}>
                              "{filter.phrase}"
                            </span>

                            {/* Target Feature Badge */}
                            <span className="px-1.5 py-0.5 rounded text-[8px] font-bold font-['Orbitron'] uppercase bg-[#00ffd5]/10 text-[#00ffd5] border border-[#00ffd5]/30">
                              {targetDef.stageBadge}
                            </span>

                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold font-['JetBrains_Mono'] uppercase border ${
                              filter.action === 'hide'
                                ? 'bg-[#ff4060]/10 text-[#ff4060] border-[#ff4060]/30'
                                : 'bg-[#c8ff00]/10 text-[#c8ff00] border-[#c8ff00]/30'
                            }`}>
                              {filter.action === 'hide' ? 'HIDDEN' : `REPLACE → "${filter.replaceWith || ''}"`}
                            </span>
                          </div>
                          <div className="text-[10px] font-['JetBrains_Mono'] text-[#3d7a52]">
                            Target: {targetDef.name} • {filter.enabled ? 'Active (Concealed)' : 'Disabled (Visible)'}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleEnabled(filter.id)}
                          className={`px-2 py-1 rounded text-[10px] font-['Orbitron'] font-bold uppercase transition-colors cursor-pointer border ${
                            filter.enabled
                              ? 'bg-[#071510] border-[#1a5c35] text-[#3d7a52] hover:text-[#c8ff00]'
                              : 'bg-[#00ffd5]/15 border-[#00ffd5]/40 text-[#00ffd5] hover:bg-[#00ffd5]/25'
                          }`}
                        >
                          {filter.enabled ? 'UNHIDE' : 'HIDE'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteFilter(filter.id)}
                          className="w-7 h-7 rounded-lg bg-[#071510] hover:bg-[#20080d] border border-[#0f3320] hover:border-[#ff4060] text-[#3d7a52] hover:text-[#ff4060] flex items-center justify-center transition-colors cursor-pointer"
                          title="Delete this filter rule"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 sm:p-4 border-t border-[#0f3320] bg-[#020d06]/85 flex items-center justify-between text-xs font-['JetBrains_Mono'] sticky bottom-0 z-10 backdrop-blur-md">
          <div className="flex items-center gap-2 text-[#3d7a52]">
            <span className="w-2 h-2 rounded-full bg-[#c8ff00] animate-pulse" />
            <span>FEATURE LEVEL OSINT PRIVACY & PROMOTION SHIELD ACTIVE</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-[#c8ff00] hover:bg-[#b0e600] text-[#020d06] text-xs font-['Orbitron'] font-black uppercase tracking-wider transition-all cursor-pointer shadow-[0_0_15px_rgba(200,255,0,0.3)] active:scale-95"
          >
            DONE
          </button>
        </div>
      </div>
    </div>
  );
};
