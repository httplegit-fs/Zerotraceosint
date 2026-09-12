import React, { useState, useEffect, useRef } from 'react';
import { ApiConfigItem, AutoDetectionResult, ApiFieldMapping, ApiPresetItem } from '../types/apiTypes';
import { 
  DEFAULT_API_CONFIGS, 
  autoDetectApiFromUrl, 
  analyzeJsonStructure, 
  buildExecutionUrl,
  saveApiConfigs 
} from '../utils/apiAutoDetector';
import { 
  Cpu, 
  Key, 
  Lock, 
  Unlock, 
  Search, 
  Play, 
  RefreshCw, 
  Check, 
  Copy, 
  Plus, 
  Trash2, 
  RotateCcw, 
  Globe, 
  Server, 
  Database, 
  Code2, 
  Sparkles, 
  Sliders, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  ExternalLink, 
  Eye, 
  EyeOff, 
  Zap, 
  FileJson, 
  Layers, 
  Terminal, 
  X,
  Radio,
  Wifi,
  Wand2
} from 'lucide-react';

interface ApiAutomationModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiConfigs: ApiConfigItem[];
  onSaveConfigs: (configs: ApiConfigItem[]) => void;
  onResetConfigs: () => void;
  onLogTerminal?: (text: string, type?: 'cmd' | 'resp' | 'warn' | 'success') => void;
}

export const ApiAutomationModal: React.FC<ApiAutomationModalProps> = ({
  isOpen,
  onClose,
  apiConfigs,
  onSaveConfigs,
  onResetConfigs,
  onLogTerminal
}) => {
  const [configs, setConfigs] = useState<ApiConfigItem[]>(apiConfigs);
  const [selectedId, setSelectedId] = useState<string>(apiConfigs[0]?.id || 'phone-osint');
  
  // Magic Auto-Detector state
  const [magicUrlInput, setMagicUrlInput] = useState('');
  const [detectionResult, setDetectionResult] = useState<AutoDetectionResult | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  
  // Live Sandbox state
  const [testInput, setTestInput] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResponse, setTestResponse] = useState<any | null>(null);
  const [testRawText, setTestRawText] = useState<string>('');
  const [testError, setTestError] = useState<string | null>(null);
  const [testLatency, setTestLatency] = useState<number | null>(null);
  const [analyzedFields, setAnalyzedFields] = useState<any[]>([]);
  const [analyzedSummary, setAnalyzedSummary] = useState<string>('');
  
  // Key reveal toggle
  const [revealKey, setRevealKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [saveToast, setSaveToast] = useState(false);

  // Synchronize when apiConfigs changes from outside
  useEffect(() => {
    setConfigs(apiConfigs);
  }, [apiConfigs]);

  const activeConfig = configs.find(c => c.id === selectedId) || configs[0];

  // Update testInput when activeConfig changes
  useEffect(() => {
    if (activeConfig) {
      setTestInput(activeConfig.sampleInput || '9999883039');
      setTestResponse(null);
      setTestError(null);
      setTestLatency(null);
    }
  }, [selectedId]);

  if (!isOpen || !activeConfig) return null;

  // Handle Magic Auto-Detection
  const handleAutoDetect = (overrideUrl?: string) => {
    const urlToDetect = (overrideUrl || magicUrlInput).trim();
    if (!urlToDetect) return;
    setIsDetecting(true);
    setDetectionResult(null);

    setTimeout(() => {
      const result = autoDetectApiFromUrl(urlToDetect);
      setDetectionResult(result);
      setIsDetecting(false);
    }, 200);
  };

  // Quick load template link and run detection
  const handleQuickLoadFormat = (url: string) => {
    setMagicUrlInput(url);
    handleAutoDetect(url);
  };

  // Arrange & apply detected schema directly to target module (or active module)
  const handleArrangeAndApplyToTargetModule = (targetId?: string) => {
    if (!detectionResult) return;
    const destId = targetId || detectionResult.suggestedModuleId || selectedId;
    
    // Build descriptive preset name
    const presetName = detectionResult.detectedUrl.includes('cloudflare')
      ? 'Cloudflare Daddy API'
      : (detectionResult.suggestedName || 'Arranged Custom API');

    const newPreset: ApiPresetItem = {
      id: 'preset-arranged-' + Date.now(),
      name: presetName,
      targetUrl: detectionResult.detectedUrl,
      method: detectionResult.detectedMethod || 'GET',
      keyParamName: detectionResult.detectedKeyParam,
      keyValue: detectionResult.detectedKeyValue,
      actionParamName: detectionResult.detectedActionParam,
      actionValue: detectionResult.detectedActionValue,
      queryParamName: detectionResult.detectedQueryParam
    };

    const updatedConfigs = configs.map(c => {
      if (c.id === destId) {
        const existingPresets = c.presets || [];
        // Replace if preset with same targetUrl and queryParam already exists
        const remaining = existingPresets.filter(p => p.targetUrl !== detectionResult.detectedUrl);
        const nextPresets = [newPreset, ...remaining];

        return {
          ...c,
          targetUrl: detectionResult.detectedUrl,
          method: detectionResult.detectedMethod || 'GET',
          keyParamName: detectionResult.detectedKeyParam,
          keyValue: detectionResult.detectedKeyValue,
          actionParamName: detectionResult.detectedActionParam,
          actionValue: detectionResult.detectedActionValue,
          queryParamName: detectionResult.detectedQueryParam,
          sampleInput: detectionResult.detectedQueryValue || c.sampleInput,
          presets: nextPresets,
          activePresetId: newPreset.id
        };
      }
      return c;
    });

    setConfigs(updatedConfigs);
    saveApiConfigs(updatedConfigs);
    onSaveConfigs(updatedConfigs);
    setSelectedId(destId);
    if (detectionResult.detectedQueryValue) {
      setTestInput(detectionResult.detectedQueryValue);
    }
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2400);

    const targetModule = configs.find(c => c.id === destId);
    onLogTerminal?.(`[API_AUTO_ARRANGED] Arranged API into [${targetModule?.name || destId}]! Base="${detectionResult.detectedUrl}", Param="${detectionResult.detectedQueryParam}=${detectionResult.detectedQueryValue}", Key="${detectionResult.detectedKeyValue}"`, 'success');
  };

  // Apply detected values to active config
  const handleApplyDetectionToActive = () => {
    if (!detectionResult) return;
    handleArrangeAndApplyToTargetModule(selectedId);
  };

  // Create new custom API from detected URL
  const handleCreateNewFromDetection = () => {
    if (!detectionResult) return;
    const newId = 'custom-' + Date.now();
    const newConfig: ApiConfigItem = {
      id: newId,
      name: detectionResult.suggestedName || 'CUSTOM API GATEWAY',
      category: detectionResult.suggestedCategory || 'NETWORK',
      subtitle: 'Dynamic Automated API Gateway',
      badge: 'CUSTOM',
      severity: 'high',
      targetUrl: detectionResult.detectedUrl,
      method: detectionResult.detectedMethod,
      keyParamName: detectionResult.detectedKeyParam,
      keyValue: detectionResult.detectedKeyValue,
      actionParamName: detectionResult.detectedActionParam,
      actionValue: detectionResult.detectedActionValue,
      queryParamName: detectionResult.detectedQueryParam,
      sampleInput: detectionResult.detectedQueryValue || '12345678',
      enabled: true,
      useProxy: true,
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
    setConfigs(prev => [...prev, newConfig]);
    setSelectedId(newId);
    setDetectionResult(null);
    setMagicUrlInput('');
    onLogTerminal?.(`[AUTO_API] Created new custom module: "${newConfig.name}"`, 'success');
  };

  // Modify active config fields
  const handleUpdateActiveConfig = (updates: Partial<ApiConfigItem>) => {
    setConfigs(prev => prev.map(c => {
      if (c.id === selectedId) {
        return { ...c, ...updates };
      }
      return c;
    }));
  };

  // Run live test of active configuration & analyze response structure
  const handleRunTest = async () => {
    setIsTesting(true);
    setTestError(null);
    setTestResponse(null);
    setTestRawText('');
    setTestLatency(null);
    setAnalyzedFields([]);
    setAnalyzedSummary('');

    const startTime = performance.now();
    const execUrl = buildExecutionUrl(activeConfig, testInput);

    onLogTerminal?.(`[API_TEST_INIT] Testing endpoint: ${execUrl}`, 'cmd');

    try {
      let finalUrl = execUrl;
      // If useProxy is enabled, use our server proxy endpoint to prevent CORS restrictions
      if (activeConfig.useProxy) {
        if (activeConfig.id === 'phone-osint') {
          finalUrl = `/api/phone-lookup?number=${encodeURIComponent(testInput)}&key=${encodeURIComponent(activeConfig.keyValue || 'DADDY')}&action=${encodeURIComponent(activeConfig.actionValue || '')}&targetUrl=${encodeURIComponent(activeConfig.targetUrl)}&queryParam=${encodeURIComponent(activeConfig.queryParamName || 'number')}`;
        } else if (activeConfig.id === 'aadhar-search') {
          finalUrl = `/api/aadhar-lookup?aadhar=${encodeURIComponent(testInput)}&key=${encodeURIComponent(activeConfig.keyValue || 'INDIAN_HACKER_BRO')}&action=${encodeURIComponent(activeConfig.actionValue || '')}&targetUrl=${encodeURIComponent(activeConfig.targetUrl)}&queryParam=${encodeURIComponent(activeConfig.queryParamName || 'aadhar')}`;
        } else if (activeConfig.id === 'upi-search') {
          finalUrl = `/api/upi-lookup?upi=${encodeURIComponent(testInput)}&key=${encodeURIComponent(activeConfig.keyValue || 'INDIAN_HACKER_BRO')}&action=${encodeURIComponent(activeConfig.actionValue || '')}&targetUrl=${encodeURIComponent(activeConfig.targetUrl)}&queryParam=${encodeURIComponent(activeConfig.queryParamName || 'upi')}`;
        } else if (activeConfig.id === 'email-search') {
          finalUrl = `/api/email-lookup?email=${encodeURIComponent(testInput)}&key=${encodeURIComponent(activeConfig.keyValue || 'DADDY')}&action=${encodeURIComponent(activeConfig.actionValue || '')}&targetUrl=${encodeURIComponent(activeConfig.targetUrl)}&queryParam=${encodeURIComponent(activeConfig.queryParamName || 'value')}`;
        } else if (activeConfig.id === 'vehicle-search') {
          finalUrl = `/api/vehicle-lookup?rc=${encodeURIComponent(testInput)}&key=${encodeURIComponent(activeConfig.keyValue || 'INDIAN_HACKER_BRO')}&action=${encodeURIComponent(activeConfig.actionValue || '')}&targetUrl=${encodeURIComponent(activeConfig.targetUrl)}&queryParam=${encodeURIComponent(activeConfig.queryParamName || 'rc')}`;
        } else if (activeConfig.id === 'imei-search') {
          finalUrl = `/api/imei-lookup?imei=${encodeURIComponent(testInput)}&key=${encodeURIComponent(activeConfig.keyValue || 'INDIAN_HACKER_BRO')}&action=${encodeURIComponent(activeConfig.actionValue || '')}&targetUrl=${encodeURIComponent(activeConfig.targetUrl)}&queryParam=${encodeURIComponent(activeConfig.queryParamName || 'imei_num')}`;
        } else if (activeConfig.id === 'telegram-search') {
          finalUrl = `/api/tgid-lookup?id=${encodeURIComponent(testInput)}&key=${encodeURIComponent(activeConfig.keyValue || 'Tgid_num')}&action=${encodeURIComponent(activeConfig.actionValue || '')}&targetUrl=${encodeURIComponent(activeConfig.targetUrl)}&queryParam=${encodeURIComponent(activeConfig.queryParamName || 'id')}`;
        } else {
          finalUrl = execUrl;
        }
      }

      const res = await fetch(finalUrl, {
        method: activeConfig.method || 'GET',
        headers: {
          'Accept': 'application/json, text/plain, */*',
          ...(activeConfig.headers || {})
        }
      });

      const latency = Math.round(performance.now() - startTime);
      setTestLatency(latency);

      const rawText = await res.text();
      setTestRawText(rawText);

      try {
        const parsed = JSON.parse(rawText);
        setTestResponse(parsed);

        // Run automatic JSON structure analyzer on the response!
        const analysis = analyzeJsonStructure(parsed);
        setAnalyzedFields(analysis.detectedFields);
        setAnalyzedSummary(analysis.summary);

        // Automatically update active config status
        handleUpdateActiveConfig({
          lastStatus: 'online',
          latencyMs: latency,
          lastTestedAt: new Date().toISOString(),
          detectedStructure: parsed
        });

        onLogTerminal?.(`[API_TEST_SUCCESS] Status: ${res.status} OK | Latency: ${latency}ms | Auto-mapped ${analysis.detectedFields.length} properties`, 'success');
      } catch {
        setTestError(`Non-JSON response received (HTTP ${res.status}). Payload preview:\n${rawText.substring(0, 200)}`);
        handleUpdateActiveConfig({
          lastStatus: 'error',
          lastTestedAt: new Date().toISOString(),
          lastErrorMessage: 'Non-JSON response'
        });
      }
    } catch (err: any) {
      const latency = Math.round(performance.now() - startTime);
      setTestLatency(latency);
      setTestError(`Connection Failed: ${err?.message || 'Network error or CORS restriction'}`);
      handleUpdateActiveConfig({
        lastStatus: 'offline',
        lastTestedAt: new Date().toISOString(),
        lastErrorMessage: err?.message
      });
      onLogTerminal?.(`[API_TEST_ERROR] ${err?.message}`, 'warn');
    } finally {
      setIsTesting(false);
    }
  };

  // Switch to a preset
  const handleSelectPreset = (preset: ApiPresetItem) => {
    const updatedActiveConfig: ApiConfigItem = {
      ...activeConfig,
      activePresetId: preset.id,
      targetUrl: preset.targetUrl,
      method: preset.method || 'GET',
      keyParamName: preset.keyParamName,
      keyValue: preset.keyValue,
      actionParamName: preset.actionParamName || '',
      actionValue: preset.actionValue || '',
      queryParamName: preset.queryParamName
    };
    const updatedConfigs = configs.map(c => c.id === activeConfig.id ? updatedActiveConfig : c);
    setConfigs(updatedConfigs);
    saveApiConfigs(updatedConfigs);
    onSaveConfigs(updatedConfigs);
    onLogTerminal?.(`[PRESET_ACTIVATED] Switched [${activeConfig.name}] to preset "${preset.name}". URL: ${preset.targetUrl}`, 'success');
  };

  // Delete preset API and automatically apply the remaining preset for this module!
  const handleDeletePreset = (presetId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const currentPresets = activeConfig.presets || [];
    const presetToDelete = currentPresets.find(p => p.id === presetId);
    const remainingPresets = currentPresets.filter(p => p.id !== presetId);

    if (remainingPresets.length === 0) {
      // If user deletes all presets, maintain a clean custom endpoint so module remains fully operational
      const fallbackPreset: ApiPresetItem = {
        id: 'preset-custom-' + Date.now(),
        name: 'Custom Endpoint',
        targetUrl: 'https://api-src.alonepatel.shop/api',
        method: 'GET',
        keyParamName: 'key',
        keyValue: 'INDIAN_HACKER_BRO',
        actionParamName: activeConfig.actionParamName || 'action',
        actionValue: activeConfig.actionValue || '',
        queryParamName: activeConfig.queryParamName || 'query'
      };
      const updatedActiveConfig: ApiConfigItem = {
        ...activeConfig,
        presets: [fallbackPreset],
        activePresetId: fallbackPreset.id,
        targetUrl: fallbackPreset.targetUrl,
        keyParamName: fallbackPreset.keyParamName,
        keyValue: fallbackPreset.keyValue,
        actionParamName: fallbackPreset.actionParamName || '',
        actionValue: fallbackPreset.actionValue || '',
        queryParamName: fallbackPreset.queryParamName
      };
      const updatedConfigs = configs.map(c => c.id === activeConfig.id ? updatedActiveConfig : c);
      setConfigs(updatedConfigs);
      saveApiConfigs(updatedConfigs);
      onSaveConfigs(updatedConfigs);
      onLogTerminal?.(`[PRESET_DELETED] Deleted preset "${presetToDelete?.name || presetId}". Reset to clean customizable endpoint.`, 'warn');
      return;
    }

    // "fir jo present bachega wahi module ke liye use hona chaiye"
    // Whichever preset remains, that alone must be used for the module!
    const nextPreset = remainingPresets[0];

    const updatedActiveConfig: ApiConfigItem = {
      ...activeConfig,
      presets: remainingPresets,
      activePresetId: nextPreset.id,
      targetUrl: nextPreset.targetUrl,
      method: nextPreset.method || 'GET',
      keyParamName: nextPreset.keyParamName,
      keyValue: nextPreset.keyValue,
      actionParamName: nextPreset.actionParamName || '',
      actionValue: nextPreset.actionValue || '',
      queryParamName: nextPreset.queryParamName
    };

    const updatedConfigs = configs.map(c => c.id === activeConfig.id ? updatedActiveConfig : c);
    setConfigs(updatedConfigs);
    saveApiConfigs(updatedConfigs);
    onSaveConfigs(updatedConfigs);

    onLogTerminal?.(`[PRESET_DELETED] Preset "${presetToDelete?.name || presetId}" deleted. Module [${activeConfig.name}] updated to remaining preset: "${nextPreset.name}" (${nextPreset.targetUrl})`, 'warn');
  };

  // Save current active config as a new preset
  const handleSaveCurrentAsPreset = () => {
    const defaultName = `Preset ${((activeConfig.presets || []).length + 1)}`;
    const name = window.prompt('Enter a name for this API preset:', defaultName);
    if (!name || !name.trim()) return;

    const newPreset: ApiPresetItem = {
      id: 'preset-' + Date.now(),
      name: name.trim(),
      targetUrl: activeConfig.targetUrl,
      method: activeConfig.method || 'GET',
      keyParamName: activeConfig.keyParamName,
      keyValue: activeConfig.keyValue,
      actionParamName: activeConfig.actionParamName,
      actionValue: activeConfig.actionValue,
      queryParamName: activeConfig.queryParamName
    };

    const updatedPresets = [...(activeConfig.presets || []), newPreset];
    const updatedActiveConfig: ApiConfigItem = {
      ...activeConfig,
      presets: updatedPresets,
      activePresetId: newPreset.id
    };

    const updatedConfigs = configs.map(c => c.id === activeConfig.id ? updatedActiveConfig : c);
    setConfigs(updatedConfigs);
    saveApiConfigs(updatedConfigs);
    onSaveConfigs(updatedConfigs);

    onLogTerminal?.(`[PRESET_SAVED] Saved new preset "${newPreset.name}" for module [${activeConfig.name}]`, 'success');
  };

  // Save all changes
  const handleSaveAll = () => {
    saveApiConfigs(configs);
    onSaveConfigs(configs);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2200);
    onLogTerminal?.(`[SYSTEM_CONFIG] Saved ${configs.length} API configurations successfully to storage.`, 'success');
  };

  // Delete custom API
  const handleDeleteCustomApi = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = configs.filter(c => c.id !== id);
    setConfigs(updated);
    if (selectedId === id) {
      setSelectedId(updated[0]?.id || 'phone-osint');
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5 bg-[#020d06]/90 backdrop-blur-xl select-none overflow-y-auto overscroll-contain min-h-[100dvh]"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-5xl bg-[#071510] border-2 border-[#1a5c35] rounded-2xl sm:rounded-3xl p-3 sm:p-7 shadow-[0_0_60px_rgba(0,255,213,0.25)] flex flex-col max-h-[92dvh] overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HUD Corners */}
        <span className="hud-corner hud-tl" />
        <span className="hud-corner hud-tr" />
        <span className="hud-corner hud-bl" />
        <span className="hud-corner hud-br" />

        {/* Top Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 sm:pb-4 border-b border-[#0f3320] shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#020d06] border-2 border-[#00ffd5] flex items-center justify-center text-[#00ffd5] shadow-[0_0_15px_rgba(0,255,213,0.3)] shrink-0">
              <Cpu className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse text-[#c8ff00]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 rounded bg-[#00ffd5]/15 border border-[#00ffd5]/40 text-[#00ffd5] font-['JetBrains_Mono'] text-[9px] sm:text-[10px] font-bold uppercase">
                  V2.4 AUTO
                </span>
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#c8ff00] animate-ping" />
              </div>
              <h2 className="font-['Orbitron'] text-xs sm:text-lg lg:text-xl font-black text-[#f0fff4] uppercase tracking-wider mt-0.5 truncate">
                AUTOMATED API MANAGER
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={handleSaveAll}
              className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-[#c8ff00] hover:bg-[#d8ff33] text-[#020d06] font-['Orbitron'] font-black text-[11px] sm:text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(200,255,0,0.4)] cursor-pointer active:scale-95 touch-manipulation min-h-[38px]"
            >
              <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>SAVE & APPLY</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-xl bg-[#020d06] hover:bg-[#1a0509] border border-[#0f3320] hover:border-[#ff4060] text-[#3d7a52] hover:text-[#ff4060] transition-colors cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center touch-manipulation"
              title="Close manager"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Save Confirmation Toast */}
        {saveToast && (
          <div className="my-2 p-2 rounded-xl bg-[#c8ff00]/15 border border-[#c8ff00] text-[#c8ff00] font-['JetBrains_Mono'] text-[11px] sm:text-xs flex items-center justify-center gap-2 animate-bounce shrink-0">
            <CheckCircle2 className="w-4 h-4" />
            <span>API CONFIGURATIONS APPLIED & PERSISTED!</span>
          </div>
        )}

        {/* Scrollable Main Area */}
        <div className="overflow-y-auto overscroll-contain space-y-4 sm:space-y-5 pr-1 my-2 sm:my-4 flex-1">
          
          {/* ========================================================================= */}
          {/* SECTION 1: MAGIC AUTO-DETECT API TOOL (URL / JSON SCHEMA SYNTHESIZER)      */}
          {/* ========================================================================= */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-[#020d06] via-[#041209] to-[#071510] border-2 border-[#00ffd5]/40 shadow-[0_0_25px_rgba(0,255,213,0.15)] relative overflow-hidden">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-1.5 sm:gap-2 text-[#00ffd5] font-['Orbitron'] text-xs sm:text-sm font-bold uppercase">
                <Wand2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#c8ff00] animate-bounce shrink-0" />
                <span>MAGIC AUTO-DETECT & STRUCTURE ADAPTER</span>
              </div>
            </div>

            <p className="font-['JetBrains_Mono'] text-[11px] sm:text-xs text-[#7fff50] mb-2.5">
              Paste any API link with key, action, or parameters. The system automatically reads the structure, extracts the secret key, adjusts actions, and binds parameters!
            </p>

            <div className="flex flex-col sm:flex-row items-stretch gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={magicUrlInput}
                  onChange={(e) => setMagicUrlInput(e.target.value)}
                  placeholder="e.g. https://storage-deutschland-don-patterns.trycloudflare.com/email?value=rajkumar58@gmail.com&key=DADDY"
                  className="w-full px-3.5 py-2.5 sm:py-3 rounded-xl bg-[#020d06] border border-[#1a5c35] focus:border-[#00ffd5] focus:shadow-[0_0_15px_rgba(0,255,213,0.3)] text-[#f0fff4] font-['JetBrains_Mono'] text-xs outline-none transition-all placeholder:text-[#2a5038]"
                />
              </div>
              <button
                type="button"
                onClick={() => handleAutoDetect()}
                disabled={!magicUrlInput.trim() || isDetecting}
                className="px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-[#00ffd5] hover:bg-[#33ffe0] text-[#020d06] font-['Orbitron'] font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 shrink-0 shadow-[0_0_15px_rgba(0,255,213,0.3)] active:scale-95 touch-manipulation min-h-[40px]"
              >
                {isDetecting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                <span>AUTO-SCAN & ARRANGE</span>
              </button>
            </div>

            {/* Quick Format Shortcuts - Horizontally Scrollable on Android */}
            <div className="flex items-center gap-1.5 pt-2 overflow-x-auto no-scrollbar touch-pan-x -mx-1 px-1">
              <span className="text-[10px] font-['JetBrains_Mono'] text-[#3d7a52] uppercase font-bold shrink-0">
                SHORTCUTS:
              </span>
              <button
                type="button"
                onClick={() => handleQuickLoadFormat('https://storage-deutschland-don-patterns.trycloudflare.com/email?value=rajkumar58@gmail.com&key=DADDY')}
                className="px-2.5 py-1.5 rounded-lg bg-[#00ffd5]/10 hover:bg-[#00ffd5]/20 border border-[#00ffd5]/40 text-[#00ffd5] text-[10px] font-['JetBrains_Mono'] font-bold flex items-center gap-1 cursor-pointer transition-colors shrink-0 whitespace-nowrap active:scale-95"
                title="Cloudflare Daddy Email API (value=email&key=DADDY)"
              >
                <span>📧 Cloudflare Email (/email?value=...&key=DADDY)</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLoadFormat('https://storage-deutschland-don-patterns.trycloudflare.com/num?number=9999883039&key=DADDY')}
                className="px-2.5 py-1.5 rounded-lg bg-[#c8ff00]/10 hover:bg-[#c8ff00]/20 border border-[#c8ff00]/40 text-[#c8ff00] text-[10px] font-['JetBrains_Mono'] font-bold flex items-center gap-1 cursor-pointer transition-colors shrink-0 whitespace-nowrap active:scale-95"
                title="Cloudflare Daddy Phone API (number=...&key=DADDY)"
              >
                <span>📱 Cloudflare Phone (/num?number=...&key=DADDY)</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLoadFormat('https://api-src.alonepatel.shop/api?key=INDIAN_HACKER_BRO&action=email&email=rajkumar58@gmail.com')}
                className="px-2.5 py-1.5 rounded-lg bg-[#0a1e12] hover:bg-[#163824] border border-[#1a5c35] text-[#3d7a52] hover:text-[#f0fff4] text-[10px] font-['JetBrains_Mono'] flex items-center gap-1 cursor-pointer transition-colors shrink-0 whitespace-nowrap active:scale-95"
                title="AlonePatel Email Action"
              >
                <span>⚡ AlonePatel Email (?action=email)</span>
              </button>
            </div>

            {/* Detection Results Bar */}
            {detectionResult && (
              <div className="mt-3 p-3.5 rounded-xl bg-[#041209] border-2 border-[#00ffd5] text-xs font-['JetBrains_Mono'] space-y-3 animate-fadeIn shadow-[0_0_20px_rgba(0,255,213,0.2)]">
                <div className="flex flex-wrap items-center justify-between gap-2 text-[#00ffd5] font-bold border-b border-[#0f3320] pb-2">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#c8ff00] animate-pulse" />
                    <span className="tracking-wider">API STRUCTURE DETECTED & ARRANGEABLE ({detectionResult.confidence}% MATCH)</span>
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded bg-[#c8ff00]/15 text-[#c8ff00] border border-[#c8ff00]/40 text-[10px] font-bold">
                      {detectionResult.suggestedName}
                    </span>
                    {detectionResult.suggestedModuleId && (
                      <span className="px-2 py-0.5 rounded bg-[#00ffd5]/15 text-[#00ffd5] border border-[#00ffd5]/40 text-[10px] font-bold uppercase">
                        TARGET: {configs.find(c => c.id === detectionResult.suggestedModuleId)?.name || detectionResult.suggestedModuleId}
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div className="bg-[#020d06] p-2.5 rounded-lg border border-[#0f3320]">
                    <div className="text-[#3d7a52] text-[9px] uppercase font-bold">EXTRACTED KEY ({detectionResult.detectedKeyParam || 'key'})</div>
                    <div className="text-[#c8ff00] font-bold font-['JetBrains_Mono'] truncate mt-0.5">{detectionResult.detectedKeyValue || '(None)'}</div>
                  </div>
                  <div className="bg-[#020d06] p-2.5 rounded-lg border border-[#0f3320]">
                    <div className="text-[#3d7a52] text-[9px] uppercase font-bold">DETECTED ACTION ({detectionResult.detectedActionParam || 'None'})</div>
                    <div className="text-[#00ffd5] font-bold font-['JetBrains_Mono'] truncate mt-0.5">{detectionResult.detectedActionValue || '(None)'}</div>
                  </div>
                  <div className="bg-[#020d06] p-2.5 rounded-lg border border-[#0f3320]">
                    <div className="text-[#3d7a52] text-[9px] uppercase font-bold">QUERY PARAM NAME</div>
                    <div className="text-[#7fff50] font-bold font-['JetBrains_Mono'] truncate mt-0.5">
                      {detectionResult.detectedQueryParam}
                      {detectionResult.detectedQueryValue ? ` ("${detectionResult.detectedQueryValue}")` : ''}
                    </div>
                  </div>
                  <div className="bg-[#020d06] p-2.5 rounded-lg border border-[#0f3320]">
                    <div className="text-[#3d7a52] text-[9px] uppercase font-bold">BASE ENDPOINT</div>
                    <div className="text-[#f0fff4] font-bold font-['JetBrains_Mono'] truncate mt-0.5" title={detectionResult.detectedUrl}>
                      {detectionResult.detectedUrl}
                    </div>
                  </div>
                </div>

                {/* Arranged Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {detectionResult.suggestedModuleId && (
                    <button
                      type="button"
                      onClick={() => handleArrangeAndApplyToTargetModule(detectionResult.suggestedModuleId)}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#c8ff00] to-[#7fff50] text-[#020d06] font-['Orbitron'] font-black text-xs flex items-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(200,255,0,0.5)] hover:scale-[1.02] active:scale-95 transition-all"
                    >
                      <Zap className="w-4 h-4 fill-current text-[#020d06]" />
                      <span>
                        ARRANGE & APPLY TO {configs.find(c => c.id === detectionResult.suggestedModuleId)?.name || 'EMAIL SEARCH'}
                      </span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleArrangeAndApplyToTargetModule(activeConfig.id)}
                    className="px-3.5 py-2 rounded-xl bg-[#0a1e12] hover:bg-[#163824] border border-[#1a5c35] text-[#f0fff4] font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <span>APPLY TO CURRENT [{activeConfig.name}]</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCreateNewFromDetection}
                    className="px-3.5 py-2 rounded-xl bg-[#020d06] border border-[#00ffd5]/50 text-[#00ffd5] font-bold text-xs flex items-center gap-1.5 cursor-pointer hover:bg-[#00ffd5] hover:text-[#020d06] transition-colors ml-auto"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>CREATE AS NEW CUSTOM MODULE</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* SECTION 2: MODULE TABS (PHONE, AADHAAR, UPI, EMAIL, VEHICLE, IMEI, TGID)   */}
          {/* ========================================================================= */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-['Orbitron'] text-xs text-[#c8ff00] font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                <span>SELECT API MODULE TO CONFIGURE:</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  const newId = 'custom-' + Date.now();
                  const newApi: ApiConfigItem = {
                    id: newId,
                    name: 'NEW CUSTOM API',
                    category: 'NETWORK',
                    subtitle: 'Custom Endpoint',
                    badge: 'CUSTOM',
                    severity: 'high',
                    targetUrl: 'https://api-src.alonepatel.shop/api',
                    method: 'GET',
                    keyParamName: 'key',
                    keyValue: 'INDIAN_HACKER_BRO',
                    actionParamName: 'action',
                    actionValue: 'custom',
                    queryParamName: 'query',
                    sampleInput: 'sample_query',
                    enabled: true,
                    useProxy: true,
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
                  setConfigs(prev => [...prev, newApi]);
                  setSelectedId(newId);
                }}
                className="text-[10px] font-['JetBrains_Mono'] px-2 py-1 rounded bg-[#0a1e12] hover:bg-[#163824] border border-[#1a5c35] text-[#00ffd5] flex items-center gap-1 cursor-pointer font-bold"
              >
                <Plus className="w-3 h-3" />
                <span>+ ADD CUSTOM API</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-[#020d06] border border-[#0f3320] overflow-x-auto no-scrollbar touch-pan-x">
              {configs.map((c) => {
                const isSelected = selectedId === c.id;
                const isCustom = c.id.startsWith('custom-');
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedId(c.id)}
                    className={`group px-3 py-2 rounded-xl text-xs font-['JetBrains_Mono'] font-bold border transition-all flex items-center gap-2 cursor-pointer shrink-0 whitespace-nowrap active:scale-95 touch-manipulation ${
                      isSelected
                        ? 'bg-[#c8ff00] text-[#020d06] border-[#c8ff00] shadow-[0_0_15px_rgba(200,255,0,0.35)]'
                        : 'bg-[#071510] text-[#3d7a52] hover:text-[#00ffd5] border-[#0f3320] hover:border-[#1a5c35]'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full shrink-0 ${
                      c.lastStatus === 'online' ? 'bg-[#7fff50]' :
                      c.lastStatus === 'offline' ? 'bg-[#ff4060]' :
                      isSelected ? 'bg-[#020d06]' : 'bg-[#1a5c35]'
                    }`} />
                    <span>{c.name.replace(' SEARCH', '')}</span>
                    {isCustom && (
                      <span
                        onClick={(e) => handleDeleteCustomApi(c.id, e)}
                        className="text-[#ff4060] hover:scale-125 ml-1 p-0.5 transition-transform"
                        title="Delete custom module"
                      >
                        <Trash2 className="w-3 h-3" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 3: ACTIVE API CONFIGURATION FORM                                   */}
          {/* ========================================================================= */}
          <div className="bg-[#020d06] border-2 border-[#1a5c35] rounded-2xl p-5 space-y-4 shadow-inner">
            {/* Header of Section 3 with Presets Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#0f3320]">
              <div className="flex items-center gap-2">
                <span className="text-xs font-['Orbitron'] font-bold text-[#00ffd5] uppercase">
                  EDITING: [{activeConfig.name}]
                </span>
                <span className="text-[10px] font-['JetBrains_Mono'] px-2 py-0.5 rounded bg-[#071510] border border-[#0f3320] text-[#3d7a52]">
                  ID: {activeConfig.id}
                </span>
                <span className="text-[10px] font-['JetBrains_Mono'] px-2 py-0.5 rounded bg-[#071510] border border-[#1a5c35] text-[#c8ff00]">
                  {(activeConfig.presets || []).length} PRESET{(activeConfig.presets || []).length === 1 ? '' : 'S'}
                </span>
              </div>

              {/* Save current config as new preset button */}
              <button
                type="button"
                onClick={handleSaveCurrentAsPreset}
                className="px-2.5 py-1 rounded-lg bg-[#071510] hover:bg-[#0a2214] border border-[#1a5c35] hover:border-[#c8ff00] text-[#c8ff00] text-[10px] font-['JetBrains_Mono'] font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Save the current URL, parameters, and settings as a new preset for this module"
              >
                <Plus className="w-3 h-3" />
                <span>+ ADD / SAVE PRESET</span>
              </button>
            </div>

            {/* PRESETS BAR WITH DELETE BUTTONS & REMAINING AUTO-SWITCH */}
            <div className="p-3 rounded-xl bg-[#041009] border border-[#0f3320] space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-['JetBrains_Mono']">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[#3d7a52] uppercase font-bold tracking-wider flex items-center gap-1">
                    <Sliders className="w-3 h-3 text-[#00ffd5]" />
                    ACTIVE PRESETS:
                  </span>
                </div>
                <div className="text-[10px] text-[#3d7a52]">
                  <span>Delete an API preset with </span>
                  <span className="text-[#ff4060] font-bold">Trash [✕]</span>
                  <span> to remove it & auto-use remaining preset</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1 overflow-x-auto no-scrollbar touch-pan-x -mx-1 px-1">
                {(activeConfig.presets && activeConfig.presets.length > 0) ? (
                  activeConfig.presets.map((preset) => {
                    const isActive = activeConfig.activePresetId === preset.id || activeConfig.targetUrl === preset.targetUrl;
                    return (
                      <div
                        key={preset.id}
                        className={`group relative flex items-center rounded-lg border text-xs transition-all shrink-0 whitespace-nowrap ${
                          isActive
                            ? 'bg-[#00ffd5]/15 border-[#00ffd5] text-[#f0fff4] shadow-[0_0_12px_rgba(0,255,213,0.25)] ring-1 ring-[#00ffd5]/50'
                            : 'bg-[#071510] border-[#1a5c35] text-[#a3e635] hover:border-[#3d7a52] hover:bg-[#0a1e12]'
                        }`}
                      >
                        {/* Select Preset Button */}
                        <button
                          type="button"
                          onClick={() => handleSelectPreset(preset)}
                          className="px-3 py-1.5 flex items-center gap-2 cursor-pointer text-left"
                          title={`Click to activate preset: ${preset.name} (${preset.targetUrl})`}
                        >
                          <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-[#00ffd5] shadow-[0_0_8px_#00ffd5]' : 'bg-[#1a5c35]'}`} />
                          <span className="font-bold font-['JetBrains_Mono']">{preset.name}</span>
                          <span className="text-[9px] opacity-70 font-mono hidden sm:inline">
                            [{preset.targetUrl.includes('cloudflare') ? 'Cloudflare' : preset.targetUrl.includes('alonepatel') ? 'AlonePatel' : 'Custom'}]
                          </span>
                          {isActive && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-[#00ffd5]/20 text-[#00ffd5] font-bold">
                              ACTIVE
                            </span>
                          )}
                        </button>

                        {/* Delete Preset Button */}
                        <button
                          type="button"
                          onClick={(e) => handleDeletePreset(preset.id, e)}
                          className="px-2 py-1.5 text-[#ff4060] hover:bg-[#ff4060]/20 hover:text-[#ff6b85] rounded-r-lg border-l border-inherit transition-colors cursor-pointer flex items-center justify-center"
                          title={`Delete preset "${preset.name}". The remaining preset will immediately be used for this module.`}
                          aria-label={`Delete preset ${preset.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex items-center gap-2 text-xs font-['JetBrains_Mono'] text-[#3d7a52]">
                    <span>No presets defined.</span>
                    <button
                      type="button"
                      onClick={handleSaveCurrentAsPreset}
                      className="text-[#c8ff00] underline hover:text-[#00ffd5] cursor-pointer"
                    >
                      Save current config as preset
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Endpoint URL */}
              <div className="md:col-span-8 space-y-1">
                <label className="block text-[11px] font-['JetBrains_Mono'] text-[#c8ff00] font-bold uppercase">
                  API Target Base URL:
                </label>
                <input
                  type="text"
                  value={activeConfig.targetUrl}
                  onChange={(e) => handleUpdateActiveConfig({ targetUrl: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#071510] border border-[#1a5c35] focus:border-[#c8ff00] text-[#f0fff4] font-['JetBrains_Mono'] text-xs outline-none"
                  placeholder="https://api.example.com/endpoint"
                />
              </div>

              {/* Method */}
              <div className="md:col-span-4 space-y-1">
                <label className="block text-[11px] font-['JetBrains_Mono'] text-[#3d7a52] uppercase">
                  HTTP Method:
                </label>
                <select
                  value={activeConfig.method || 'GET'}
                  onChange={(e) => handleUpdateActiveConfig({ method: e.target.value as 'GET' | 'POST' })}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#071510] border border-[#1a5c35] text-[#00ffd5] font-['JetBrains_Mono'] text-xs outline-none"
                >
                  <option value="GET">GET Request</option>
                  <option value="POST">POST Request</option>
                </select>
              </div>

              {/* Key Parameter & Value */}
              <div className="md:col-span-4 space-y-1">
                <label className="block text-[11px] font-['JetBrains_Mono'] text-[#00ffd5] font-bold uppercase">
                  Key Parameter Name:
                </label>
                <input
                  type="text"
                  value={activeConfig.keyParamName}
                  onChange={(e) => handleUpdateActiveConfig({ keyParamName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#071510] border border-[#1a5c35] text-[#f0fff4] font-['JetBrains_Mono'] text-xs outline-none"
                  placeholder="key (or leave empty)"
                />
              </div>

              <div className="md:col-span-8 space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-['JetBrains_Mono'] text-[#00ffd5] font-bold uppercase">
                    API Key Value:
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setRevealKey(!revealKey)}
                      className="text-[10px] text-[#3d7a52] hover:text-[#00ffd5] flex items-center gap-1 cursor-pointer"
                    >
                      {revealKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      <span>{revealKey ? 'MASK' : 'REVEAL'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(activeConfig.keyValue);
                        setCopiedKey(true);
                        setTimeout(() => setCopiedKey(false), 1500);
                      }}
                      className="text-[10px] text-[#3d7a52] hover:text-[#c8ff00] flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey ? <Check className="w-3 h-3 text-[#c8ff00]" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey ? 'COPIED' : 'COPY'}</span>
                    </button>
                  </div>
                </div>
                <input
                  type={revealKey ? 'text' : 'password'}
                  value={activeConfig.keyValue}
                  onChange={(e) => handleUpdateActiveConfig({ keyValue: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#071510] border border-[#1a5c35] text-[#c8ff00] font-['JetBrains_Mono'] text-xs font-bold outline-none"
                  placeholder="e.g. INDIAN_HACKER_BRO or DADDY"
                />
              </div>

              {/* Action Parameter & Action Value */}
              <div className="md:col-span-4 space-y-1">
                <label className="block text-[11px] font-['JetBrains_Mono'] text-[#ffe600] font-bold uppercase">
                  Action Param Name:
                </label>
                <input
                  type="text"
                  value={activeConfig.actionParamName}
                  onChange={(e) => handleUpdateActiveConfig({ actionParamName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#071510] border border-[#1a5c35] text-[#f0fff4] font-['JetBrains_Mono'] text-xs outline-none"
                  placeholder="action (or empty)"
                />
              </div>

              <div className="md:col-span-4 space-y-1">
                <label className="block text-[11px] font-['JetBrains_Mono'] text-[#ffe600] font-bold uppercase">
                  Action Value:
                </label>
                <input
                  type="text"
                  value={activeConfig.actionValue}
                  onChange={(e) => handleUpdateActiveConfig({ actionValue: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#071510] border border-[#1a5c35] text-[#ffe600] font-['JetBrains_Mono'] text-xs font-bold outline-none"
                  placeholder="num / aadhar / upiinfo"
                />
              </div>

              {/* Target Query Param Name */}
              <div className="md:col-span-4 space-y-1">
                <label className="block text-[11px] font-['JetBrains_Mono'] text-[#7fff50] font-bold uppercase">
                  Query Param Name:
                </label>
                <input
                  type="text"
                  value={activeConfig.queryParamName}
                  onChange={(e) => handleUpdateActiveConfig({ queryParamName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#071510] border border-[#1a5c35] text-[#7fff50] font-['JetBrains_Mono'] text-xs font-bold outline-none"
                  placeholder="number / aadhar / rc / upi"
                />
              </div>
            </div>

            {/* Generated Query URL Preview */}
            <div className="p-3 rounded-xl bg-[#071510] border border-[#0f3320] text-xs font-['JetBrains_Mono']">
              <div className="text-[10px] text-[#3d7a52] uppercase mb-1 flex items-center justify-between">
                <span>CONSTRUCTED EXECUTION PREVIEW:</span>
                <span className="text-[#00ffd5]">DYNAMIC URL ENGINE</span>
              </div>
              <div className="text-[#00ffd5] break-all font-mono text-[11px]">
                {buildExecutionUrl(activeConfig, `{${activeConfig.queryParamName || 'query'}}`)}
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 4: LIVE SANDBOX TESTER & STRUCTURE ANALYZER                        */}
          {/* ========================================================================= */}
          <div className="bg-[#020d06] border-2 border-[#00ffd5]/30 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#00ffd5]" />
                <h3 className="font-['Orbitron'] text-xs sm:text-sm font-bold text-[#f0fff4] uppercase">
                  LIVE API SANDBOX & SCHEMA DISCOVERY
                </h3>
              </div>
              {testLatency !== null && (
                <div className="flex items-center gap-2 text-xs font-['JetBrains_Mono']">
                  <span className="text-[#3d7a52]">LATENCY:</span>
                  <span className={`font-bold ${testLatency < 300 ? 'text-[#7fff50]' : 'text-[#ffe600]'}`}>
                    {testLatency}ms
                  </span>
                </div>
              )}
            </div>

            {/* Test Input Bar */}
            <div className="flex flex-col sm:flex-row items-stretch gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  placeholder={`Enter test query (e.g. ${activeConfig.sampleInput || '9999883039'})...`}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#071510] border border-[#1a5c35] text-[#f0fff4] font-['JetBrains_Mono'] text-xs outline-none"
                />
              </div>
              <button
                type="button"
                onClick={handleRunTest}
                disabled={isTesting || !testInput.trim()}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00ffd5] to-[#c8ff00] text-[#020d06] font-['Orbitron'] font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 shrink-0"
              >
                {isTesting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                <span>RUN LIVE TEST</span>
              </button>
            </div>

            {/* Test Error display */}
            {testError && (
              <div className="p-3 rounded-xl bg-[#ff4060]/10 border border-[#ff4060]/40 text-[#ff4060] font-['JetBrains_Mono'] text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="whitespace-pre-wrap">{testError}</div>
              </div>
            )}

            {/* Auto-Analyzed Schema Summary */}
            {analyzedSummary && (
              <div className="p-3 rounded-xl bg-[#071510] border border-[#7fff50]/40 text-[#7fff50] font-['JetBrains_Mono'] text-xs flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#c8ff00]" />
                  <span>{analyzedSummary}</span>
                </span>
                <span className="text-[10px] text-[#3d7a52]">AUTO-ALIGNED</span>
              </div>
            )}

            {/* Response JSON Viewer */}
            {testResponse && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-['JetBrains_Mono'] text-[#3d7a52]">
                  <span>RESPONSE PAYLOAD (JSON):</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(testResponse, null, 2));
                    }}
                    className="text-[#00ffd5] hover:text-[#c8ff00] flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>COPY RAW JSON</span>
                  </button>
                </div>
                <pre className="p-3 rounded-xl bg-[#040f08] border border-[#0f3320] text-[#00ffd5] font-mono text-[11px] max-h-52 overflow-y-auto overflow-x-auto whitespace-pre-wrap break-all overscroll-contain leading-relaxed">
                  {JSON.stringify(testResponse, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-[#0f3320] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs font-['JetBrains_Mono'] text-[#3d7a52]">
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Reset all API configurations to system defaults?')) {
                  onResetConfigs();
                  setConfigs(DEFAULT_API_CONFIGS);
                  saveApiConfigs(DEFAULT_API_CONFIGS);
                  onLogTerminal?.('[SYSTEM] All API endpoints restored to defaults.', 'warn');
                }
              }}
              className="px-3 py-1.5 rounded-lg bg-[#020d06] hover:bg-[#1a0509] border border-[#0f3320] hover:border-[#ff4060] text-[#3d7a52] hover:text-[#ff4060] transition-colors cursor-pointer flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>RESTORE DEFAULTS</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#020d06] hover:bg-[#071510] border border-[#0f3320] text-xs font-['JetBrains_Mono'] text-[#3d7a52] hover:text-[#f0fff4] transition-colors cursor-pointer"
            >
              CLOSE
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              className="px-5 py-2 rounded-xl bg-[#c8ff00] hover:bg-[#d8ff33] text-[#020d06] font-['Orbitron'] font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-[0_0_20px_rgba(200,255,0,0.4)] cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>APPLY ALL APIS</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
