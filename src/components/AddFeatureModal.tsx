import React, { useState } from 'react';
import { ApiConfigItem } from '../types/apiTypes';
import { saveApiConfigs } from '../utils/apiAutoDetector';
import { 
  Plus, 
  X, 
  Sparkles, 
  Sliders, 
  Key, 
  Globe, 
  Layers, 
  ShieldCheck, 
  Check, 
  Wand2, 
  Cpu, 
  Search,
  Zap,
  ArrowRight
} from 'lucide-react';

interface AddFeatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiConfigs: ApiConfigItem[];
  onSaveConfigs: (configs: ApiConfigItem[]) => void;
  onSelectNewModule: (id: string) => void;
  onOpenApiManager?: () => void;
  onLogTerminal?: (text: string, type?: 'cmd' | 'resp' | 'warn' | 'success') => void;
}

export const AddFeatureModal: React.FC<AddFeatureModalProps> = ({
  isOpen,
  onClose,
  apiConfigs,
  onSaveConfigs,
  onSelectNewModule,
  onOpenApiManager,
  onLogTerminal
}) => {
  // Form state for creating a new card
  const [featureName, setFeatureName] = useState('');
  const [category, setCategory] = useState('OSINT');
  const [badgeText, setBadgeText] = useState('CUSTOM');
  const [sampleInput, setSampleInput] = useState('9999883039');
  const [targetUrl, setTargetUrl] = useState('');
  const [keyParamName, setKeyParamName] = useState('key');
  const [keyValue, setKeyValue] = useState('DADDY');
  const [queryParamName, setQueryParamName] = useState('query');
  const [actionParamName, setActionParamName] = useState('action');
  const [actionValue, setActionValue] = useState('');
  const [httpMethod, setHttpMethod] = useState<'GET' | 'POST'>('GET');
  const [openApiManagerAfter, setOpenApiManagerAfter] = useState(true);

  if (!isOpen) return null;

  // Preset templates to speed up card creation
  const quickTemplates = [
    {
      name: 'PAN CARD SEARCH',
      category: 'FINANCE',
      badge: 'PAN',
      sampleInput: 'ABCDE1234F',
      queryParam: 'pan',
      keyParam: 'key',
      keyValue: 'INDIAN_HACKER_BRO',
      targetUrl: 'https://api.example.com/pan-search'
    },
    {
      name: 'PASSPORT LOOKUP',
      category: 'GOVERNMENT',
      badge: 'PASSPORT',
      sampleInput: 'Z1234567',
      queryParam: 'passport_num',
      keyParam: 'key',
      keyValue: 'DADDY',
      targetUrl: 'https://api.example.com/passport'
    },
    {
      name: 'BANK ACCOUNT LOOKUP',
      category: 'FINANCE',
      badge: 'BANK',
      sampleInput: '918237192837',
      queryParam: 'account_num',
      keyParam: 'key',
      keyValue: 'INDIAN_HACKER_BRO',
      targetUrl: 'https://api.example.com/bank-lookup'
    },
    {
      name: 'IP TELEMETRY OSINT',
      category: 'NETWORK',
      badge: 'IP',
      sampleInput: '8.8.8.8',
      queryParam: 'ip',
      keyParam: 'key',
      keyValue: 'DADDY',
      targetUrl: 'https://api.example.com/ip-geo'
    }
  ];

  const handleApplyTemplate = (tmpl: typeof quickTemplates[0]) => {
    setFeatureName(tmpl.name);
    setCategory(tmpl.category);
    setBadge: setBadgeText(tmpl.badge);
    setSampleInput(tmpl.sampleInput);
    setQueryParamName(tmpl.queryParam);
    setKeyParamName(tmpl.keyParam);
    setKeyValue(tmpl.keyValue);
    setTargetUrl(tmpl.targetUrl);
  };

  const handleCreateFeature = (e: React.FormEvent) => {
    e.preventDefault();
    if (!featureName.trim()) return;

    const newId = 'custom-feature-' + Date.now();
    const finalName = featureName.trim().toUpperCase();

    const newCardConfig: ApiConfigItem = {
      id: newId,
      name: finalName.endsWith('SEARCH') || finalName.endsWith('LOOKUP') ? finalName : `${finalName} SEARCH`,
      category: category.toUpperCase(),
      subtitle: `Automated Custom OSINT & API Gateway`,
      badge: badgeText.trim().toUpperCase() || 'CUSTOM',
      severity: 'high',
      targetUrl: targetUrl.trim() || 'https://api.example.com/lookup',
      method: httpMethod,
      keyParamName: keyParamName.trim() || 'key',
      keyValue: keyValue.trim() || 'DADDY',
      actionParamName: actionParamName.trim() || 'action',
      actionValue: actionValue.trim() || '',
      queryParamName: queryParamName.trim() || 'query',
      sampleInput: sampleInput.trim() || '12345678',
      enabled: true,
      useProxy: true,
      presets: [
        {
          id: 'preset-' + Date.now(),
          name: `${finalName} Primary Endpoint`,
          targetUrl: targetUrl.trim() || 'https://api.example.com/lookup',
          method: httpMethod,
          keyParamName: keyParamName.trim() || 'key',
          keyValue: keyValue.trim() || 'DADDY',
          actionParamName: actionParamName.trim() || 'action',
          actionValue: actionValue.trim() || '',
          queryParamName: queryParamName.trim() || 'query',
          isDefault: true
        }
      ],
      responseMapping: {
        nameField: 'name',
        fatherNameField: 'father_name',
        mobileField: 'mobile',
        altMobileField: 'alt_number',
        aadhaarField: 'aadhar',
        addressField: 'address',
        circleField: 'circle',
        pincodeField: 'pincode',
        emailField: 'email'
      }
    };

    const updated = [...apiConfigs, newCardConfig];
    saveApiConfigs(updated);
    onSaveConfigs(updated);
    onSelectNewModule(newId);

    onLogTerminal?.(`[ADD_FEATURE_CARD] Added new feature card "${newCardConfig.name}" (${newId})`, 'success');

    onClose();

    if (openApiManagerAfter && onOpenApiManager) {
      setTimeout(() => {
        onOpenApiManager();
      }, 250);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 animate-fade-in overflow-y-auto">
      <div className="cyber-edge-beam-card bg-[#020d06]/95 border-2 border-[#c8ff00] rounded-2xl w-full max-w-2xl overflow-hidden shadow-[0_0_50px_rgba(200,255,0,0.25)] relative my-auto">
        <span className="hud-corner hud-tl" />
        <span className="hud-corner hud-tr" />
        <span className="hud-corner hud-bl" />
        <span className="hud-corner hud-br" />

        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#0f3320] bg-black/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#071d12] border border-[#c8ff00]/50 flex items-center justify-center text-[#c8ff00] shadow-[0_0_15px_rgba(200,255,0,0.3)]">
              <Plus className="w-6 h-6 stroke-[3]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-[#c8ff00]/15 text-[#c8ff00] border border-[#c8ff00]/40 font-['JetBrains_Mono'] text-[9px] font-bold uppercase">
                  NEW OSINT CARD CREATOR
                </span>
              </div>
              <h2 className="font-['Orbitron'] text-base sm:text-lg font-black text-[#f0fff4] uppercase tracking-wide mt-0.5">
                ADD NEW FEATURE CARD
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-black/50 hover:bg-[#ff4060]/20 hover:text-[#ff4060] text-[#3d7a52] border border-[#0f3320] hover:border-[#ff4060] transition-all cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center touch-manipulation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleCreateFeature} className="p-4 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto custom-scrollbar">
          
          {/* Quick Presets Bar */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-['JetBrains_Mono'] text-[#7fff50] font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-[#c8ff00]" />
              <span>QUICK TEMPLATE PRESETS (TAP TO FILL):</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {quickTemplates.map((tmpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyTemplate(tmpl)}
                  className="p-2 rounded-xl bg-[#05180f] hover:bg-[#0c2a1c] border border-[#0f3320] hover:border-[#c8ff00]/60 text-left transition-all cursor-pointer active:scale-95 group"
                >
                  <div className="text-[10px] font-['Orbitron'] font-bold text-[#f0fff4] group-hover:text-[#c8ff00] truncate">
                    {tmpl.name}
                  </div>
                  <div className="text-[8px] font-['JetBrains_Mono'] text-[#3d7a52] mt-0.5 flex items-center justify-between">
                    <span>{tmpl.category}</span>
                    <span className="text-[#00ffd5]">{tmpl.badge}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Feature Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-['JetBrains_Mono'] text-[#c8ff00] font-bold uppercase">
                FEATURE CARD NAME *
              </label>
              <input
                type="text"
                required
                value={featureName}
                onChange={(e) => setFeatureName(e.target.value)}
                placeholder="e.g. PAN CARD SEARCH, PASSPORT LOOKUP"
                className="w-full rounded-xl bg-[#04120a] border border-[#0f3320] focus:border-[#c8ff00] py-2.5 px-3.5 text-[#f0fff4] font-['JetBrains_Mono'] text-xs outline-none transition-all placeholder:text-[#20402e]"
              />
            </div>

            {/* Category & Badge */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <label className="block text-xs font-['JetBrains_Mono'] text-[#00ffd5] font-bold uppercase">
                  CATEGORY
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl bg-[#04120a] border border-[#0f3320] focus:border-[#00ffd5] py-2.5 px-3 text-[#f0fff4] font-['JetBrains_Mono'] text-xs outline-none transition-all"
                >
                  <option value="OSINT">OSINT</option>
                  <option value="FINANCE">FINANCE</option>
                  <option value="GOVERNMENT">GOVERNMENT</option>
                  <option value="IDENTITY">IDENTITY</option>
                  <option value="NETWORK">NETWORK</option>
                  <option value="CUSTOM">CUSTOM</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-['JetBrains_Mono'] text-[#00ffd5] font-bold uppercase">
                  CARD BADGE
                </label>
                <input
                  type="text"
                  value={badgeText}
                  onChange={(e) => setBadgeText(e.target.value)}
                  placeholder="e.g. PAN, LIVE, NEW"
                  className="w-full rounded-xl bg-[#04120a] border border-[#0f3320] focus:border-[#00ffd5] py-2.5 px-3 text-[#f0fff4] font-['JetBrains_Mono'] text-xs outline-none transition-all placeholder:text-[#20402e]"
                />
              </div>
            </div>

            {/* Target API URL */}
            <div className="sm:col-span-2 space-y-1.5">
              <label className="block text-xs font-['JetBrains_Mono'] text-[#c8ff00] font-bold uppercase flex items-center justify-between">
                <span>TARGET API ENDPOINT URL (PASTE OR CONFIGURE IN API MGR)</span>
                <span className="text-[10px] text-[#3d7a52] font-normal">HTTP / HTTPS</span>
              </label>
              <input
                type="text"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="e.g. https://api.example.com/lookup or leave default to configure in API Mgr"
                className="w-full rounded-xl bg-[#04120a] border border-[#0f3320] focus:border-[#c8ff00] py-2.5 px-3.5 text-[#f0fff4] font-['JetBrains_Mono'] text-xs outline-none transition-all placeholder:text-[#20402e]"
              />
            </div>

            {/* Key Parameter & Value */}
            <div className="space-y-1.5">
              <label className="block text-xs font-['JetBrains_Mono'] text-[#7fff50] font-bold uppercase">
                API KEY PARAM & VALUE
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={keyParamName}
                  onChange={(e) => setKeyParamName(e.target.value)}
                  placeholder="Param (key)"
                  className="w-full rounded-xl bg-[#04120a] border border-[#0f3320] focus:border-[#7fff50] py-2.5 px-3 text-[#f0fff4] font-['JetBrains_Mono'] text-xs outline-none transition-all"
                />
                <input
                  type="text"
                  value={keyValue}
                  onChange={(e) => setKeyValue(e.target.value)}
                  placeholder="Value (DADDY)"
                  className="w-full rounded-xl bg-[#04120a] border border-[#0f3320] focus:border-[#7fff50] py-2.5 px-3 text-[#f0fff4] font-['JetBrains_Mono'] text-xs outline-none transition-all"
                />
              </div>
            </div>

            {/* Query Parameter & Sample Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-['JetBrains_Mono'] text-[#7fff50] font-bold uppercase">
                QUERY PARAM & SAMPLE INPUT
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={queryParamName}
                  onChange={(e) => setQueryParamName(e.target.value)}
                  placeholder="Param (query/number)"
                  className="w-full rounded-xl bg-[#04120a] border border-[#0f3320] focus:border-[#7fff50] py-2.5 px-3 text-[#f0fff4] font-['JetBrains_Mono'] text-xs outline-none transition-all"
                />
                <input
                  type="text"
                  value={sampleInput}
                  onChange={(e) => setSampleInput(e.target.value)}
                  placeholder="Sample (9999883039)"
                  className="w-full rounded-xl bg-[#04120a] border border-[#0f3320] focus:border-[#7fff50] py-2.5 px-3 text-[#f0fff4] font-['JetBrains_Mono'] text-xs outline-none transition-all"
                />
              </div>
            </div>

          </div>

          {/* Option: Automatically open API Manager after creation */}
          <div className="p-3 rounded-xl bg-black/40 border border-[#0f3320] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <Sliders className="w-4 h-4 text-[#c8ff00] shrink-0" />
              <span className="font-['JetBrains_Mono'] text-xs text-[#f0fff4] font-semibold truncate">
                Open API Management after creating card
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={openApiManagerAfter}
                onChange={(e) => setOpenApiManagerAfter(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-[#0f3320] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#c8ff00]"></div>
            </label>
          </div>

          {/* Modal Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-3 border-t border-[#0f3320]">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-black/50 hover:bg-black/80 text-[#3d7a52] hover:text-[#f0fff4] border border-[#0f3320] font-['Orbitron'] font-bold text-xs uppercase tracking-wider transition-all cursor-pointer min-h-[42px]"
            >
              CANCEL
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#c8ff00] hover:bg-[#d8ff33] text-[#020d06] font-['Orbitron'] font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(200,255,0,0.4)] cursor-pointer active:scale-98 min-h-[42px] touch-manipulation"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>CREATE FEATURE CARD</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
