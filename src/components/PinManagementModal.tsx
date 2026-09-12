import React, { useState, useEffect } from 'react';
import { 
  Key, 
  Clock, 
  ShieldCheck, 
  Timer, 
  Copy, 
  Check, 
  Trash2, 
  Ban, 
  X, 
  RefreshCw, 
  Sparkles, 
  Search, 
  Wand2, 
  Plus, 
  AlertCircle,
  Database
} from 'lucide-react';

export interface TemporaryPinItem {
  id: string;
  pin: string;
  label?: string;
  scope: 'search' | 'api_automation' | 'all';
  durationMinutes: number;
  createdAt: string;
  expiresAt: string;
  revoked?: boolean;
  isExpired?: boolean;
  remainingSeconds?: number;
  remainingMinutes?: number;
}

interface PinManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  masterPin: string;
  searchSecurityPin: string;
  apiAutomationPin: string;
  onRefreshPins?: () => void;
}

export const PinManagementModal: React.FC<PinManagementModalProps> = ({
  isOpen,
  onClose,
  masterPin,
  searchSecurityPin = '9242',
  apiAutomationPin = '9264',
  onRefreshPins
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'temporary_list' | 'permanent_keys'>('create');
  
  // Temporary PIN creation form
  const [pinInput, setPinInput] = useState('');
  const [labelInput, setLabelInput] = useState('');
  const [durationMinutes, setDurationMinutes] = useState<number>(15);
  const [customMinutes, setCustomMinutes] = useState<string>('');
  const [isCustomDuration, setIsCustomDuration] = useState(false);
  const [scope, setScope] = useState<'search' | 'api_automation' | 'all'>('search');
  
  // Action states
  const [isCreating, setIsCreating] = useState(false);
  const [formFeedback, setFormFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [copiedPinId, setCopiedPinId] = useState<string | null>(null);

  // Temporary PINs state
  const [temporaryPins, setTemporaryPins] = useState<TemporaryPinItem[]>([]);
  const [isLoadingPins, setIsLoadingPins] = useState(false);

  // Load temporary pins from backend
  const fetchTemporaryPins = async () => {
    setIsLoadingPins(true);
    try {
      const res = await fetch('/api/temporary-pins');
      if (res.ok) {
        const data = await res.json();
        if (data.pins) {
          setTemporaryPins(data.pins);
        }
      }
    } catch (e) {
      console.warn('[PinManagement] Error fetching temporary pins:', e);
    } finally {
      setIsLoadingPins(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setFormFeedback(null);
      fetchTemporaryPins();
    }
  }, [isOpen]);

  // Live countdown timer ticking every second
  useEffect(() => {
    if (!isOpen || temporaryPins.length === 0) return;

    const interval = setInterval(() => {
      const now = Date.now();
      setTemporaryPins(prevPins =>
        prevPins.map(p => {
          const expMs = new Date(p.expiresAt).getTime();
          const remainingSec = Math.max(0, Math.floor((expMs - now) / 1000));
          const isExpired = Boolean(p.revoked) || remainingSec <= 0;
          return {
            ...p,
            remainingSeconds: remainingSec,
            remainingMinutes: Math.ceil(remainingSec / 60),
            isExpired
          };
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, temporaryPins.length]);

  if (!isOpen) return null;

  // Generate random 4-digit numeric PIN
  const handleGenerateRandomPin = () => {
    const randomPin = String(Math.floor(1000 + Math.random() * 9000));
    setPinInput(randomPin);
  };

  // Format seconds to MM:SS or HH:MM:SS
  const formatTimeLeft = (seconds?: number) => {
    if (seconds === undefined || seconds <= 0) return '00:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Copy PIN helper
  const handleCopyPin = (pinValue: string, id: string) => {
    navigator.clipboard.writeText(pinValue);
    setCopiedPinId(id);
    setTimeout(() => setCopiedPinId(null), 2000);
  };

  // Handle temporary PIN creation
  const handleCreatePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormFeedback(null);

    const finalPin = pinInput.trim() || String(Math.floor(1000 + Math.random() * 9000));
    const effectiveMinutes = isCustomDuration 
      ? Math.max(1, parseInt(customMinutes, 10) || 15)
      : durationMinutes;

    if (finalPin.length < 4) {
      setFormFeedback({ type: 'error', message: 'PIN must be at least 4 digits.' });
      return;
    }

    if (finalPin === '9242' || finalPin === '9264' || finalPin === '2007' || finalPin === masterPin) {
      setFormFeedback({ type: 'error', message: `Cannot use ${finalPin} because it is reserved as a Permanent Key.` });
      return;
    }

    setIsCreating(true);
    try {
      const res = await fetch('/api/temporary-pins/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pin: finalPin,
          label: labelInput.trim(),
          scope,
          durationMinutes: effectiveMinutes
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setFormFeedback({
          type: 'success',
          message: `Success! Created time-limited PIN [${finalPin}]. Valid for ${effectiveMinutes} minutes.`
        });
        setPinInput('');
        setLabelInput('');
        await fetchTemporaryPins();
        if (onRefreshPins) onRefreshPins();
        setActiveTab('temporary_list');
      } else {
        setFormFeedback({
          type: 'error',
          message: data.error || 'Failed to create time-limited PIN.'
        });
      }
    } catch (err: any) {
      setFormFeedback({
        type: 'error',
        message: 'Error communicating with server: ' + err.message
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Handle revoking temporary PIN
  const handleRevokePin = async (id: string) => {
    try {
      const res = await fetch('/api/temporary-pins/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        await fetchTemporaryPins();
      }
    } catch (err) {
      console.error('Failed to revoke temporary pin:', err);
    }
  };

  // Handle deleting temporary PIN record
  const handleDeletePin = async (id: string) => {
    try {
      const res = await fetch(`/api/temporary-pins/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        await fetchTemporaryPins();
      }
    } catch (err) {
      console.error('Failed to delete temporary pin:', err);
    }
  };

  const activeTemporaryCount = temporaryPins.filter(p => !p.isExpired && !p.revoked).length;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-[#020d06]/85 backdrop-blur-md animate-fade-in overflow-y-auto overscroll-contain min-h-[100dvh]"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-2xl max-h-[92dvh] bg-[#071510] border-2 border-[#1a5c35] rounded-2xl sm:rounded-3xl shadow-[0_0_50px_rgba(200,255,0,0.2)] flex flex-col overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HUD Corners */}
        <span className="hud-corner hud-tl" />
        <span className="hud-corner hud-tr" />
        <span className="hud-corner hud-bl" />
        <span className="hud-corner hud-br" />

        {/* Modal Header */}
        <div className="flex items-center justify-between p-3.5 sm:p-5 border-b border-[#0f3320] bg-[#020d06]/60 sticky top-0 z-10 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#020d06] border border-[#c8ff00] flex items-center justify-center text-[#c8ff00] shadow-[0_0_15px_rgba(200,255,0,0.3)] shrink-0">
              <Key className="w-5 h-5 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h3 className="font-['Orbitron'] text-xs sm:text-base font-bold text-[#f0fff4] uppercase tracking-wider truncate">
                  PIN MANAGEMENT SYSTEM
                </h3>
                <span className="px-1.5 sm:px-2 py-0.5 rounded bg-[#c8ff00]/15 border border-[#c8ff00]/40 text-[#c8ff00] font-['JetBrains_Mono'] text-[8px] sm:text-[9px] uppercase font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#c8ff00] animate-ping" />
                  <span>{activeTemporaryCount} ACTIVE</span>
                </span>
              </div>
              <p className="font-['JetBrains_Mono'] text-[9px] sm:text-[11px] text-[#3d7a52] uppercase truncate">
                TIME-LIMITED EXPIRING KEYS & ACCESS CONTROL
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-[#020d06] hover:bg-[#1a0509] border border-[#0f3320] hover:border-[#ff4060] text-[#3d7a52] hover:text-[#ff4060] transition-colors cursor-pointer touch-manipulation min-h-[38px] min-w-[38px] flex items-center justify-center shrink-0"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 pt-2 sm:pt-3 border-b border-[#0f3320] bg-[#020d06]/40 overflow-x-auto no-scrollbar touch-pan-x shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`px-3 sm:px-4 py-2 text-[11px] sm:text-xs font-['Orbitron'] font-bold uppercase transition-all flex items-center gap-1.5 sm:gap-2 border-b-2 cursor-pointer shrink-0 touch-manipulation whitespace-nowrap ${
              activeTab === 'create'
                ? 'border-[#c8ff00] text-[#c8ff00] bg-[#c8ff00]/10 rounded-t-lg'
                : 'border-transparent text-[#3d7a52] hover:text-[#a3e635]'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>CREATE TIME-LIMITED PIN</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('temporary_list');
              fetchTemporaryPins();
            }}
            className={`px-3 sm:px-4 py-2 text-[11px] sm:text-xs font-['Orbitron'] font-bold uppercase transition-all flex items-center gap-1.5 sm:gap-2 border-b-2 cursor-pointer shrink-0 touch-manipulation whitespace-nowrap ${
              activeTab === 'temporary_list'
                ? 'border-[#00ffd5] text-[#00ffd5] bg-[#00ffd5]/10 rounded-t-lg'
                : 'border-transparent text-[#3d7a52] hover:text-[#00ffd5]'
            }`}
          >
            <Timer className="w-3.5 h-3.5" />
            <span>EXPIRING KEYS ({temporaryPins.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('permanent_keys')}
            className={`px-3 sm:px-4 py-2 text-[11px] sm:text-xs font-['Orbitron'] font-bold uppercase transition-all flex items-center gap-1.5 sm:gap-2 border-b-2 cursor-pointer shrink-0 touch-manipulation whitespace-nowrap ${
              activeTab === 'permanent_keys'
                ? 'border-[#38bdf8] text-[#38bdf8] bg-[#38bdf8]/10 rounded-t-lg'
                : 'border-transparent text-[#3d7a52] hover:text-[#38bdf8]'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>PERMANENT KEYS (3)</span>
          </button>

          <button
            type="button"
            onClick={fetchTemporaryPins}
            disabled={isLoadingPins}
            className="ml-auto p-2 rounded-lg bg-[#020d06] border border-[#0f3320] text-[#3d7a52] hover:text-[#c8ff00] hover:border-[#c8ff00] transition-colors cursor-pointer touch-manipulation shrink-0"
            title="Refresh temporary keys"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingPins ? 'animate-spin text-[#c8ff00]' : ''}`} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-3.5 sm:p-6 overflow-y-auto overscroll-contain space-y-4 flex-1">
          
          {/* TAB 1: CREATE TIME-LIMITED PIN */}
          {activeTab === 'create' && (
            <form onSubmit={handleCreatePin} className="space-y-4">
              <div className="p-3 sm:p-4 rounded-xl bg-[#020d06] border border-[#1a5c35] space-y-1">
                <div className="flex items-center gap-2 text-xs font-['Orbitron'] text-[#c8ff00] font-bold uppercase">
                  <Clock className="w-4 h-4" />
                  <span>Time-Limited Access Key Engine</span>
                </div>
                <p className="font-['JetBrains_Mono'] text-[11px] text-[#7fff50]">
                  Create a temporary security PIN with an automatic expiration time. Once the countdown expires, this PIN is instantly deactivated and will no longer grant access.
                </p>
              </div>

              {formFeedback && (
                <div className={`p-3 rounded-xl border flex items-start gap-2 text-xs font-['JetBrains_Mono'] ${
                  formFeedback.type === 'success'
                    ? 'bg-[#c8ff00]/10 border-[#c8ff00] text-[#c8ff00]'
                    : 'bg-[#ff4060]/10 border-[#ff4060] text-[#ff4060]'
                }`}>
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>{formFeedback.message}</p>
                </div>
              )}

              {/* PIN Code Input & Random Generator */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-['Orbitron'] text-[#3d7a52] uppercase font-bold">
                    SECURITY PIN CODE (4-8 DIGITS)
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateRandomPin}
                    className="text-[10px] font-['JetBrains_Mono'] text-[#c8ff00] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>GENERATE RANDOM PIN</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value.replace(/\D/g, '').slice(0, 8))}
                    placeholder="Enter or generate PIN (e.g. 7482)"
                    className="w-full bg-[#020d06] border border-[#1a5c35] focus:border-[#c8ff00] rounded-xl px-3.5 py-2.5 text-sm font-['JetBrains_Mono'] text-[#c8ff00] font-bold tracking-widest outline-none transition-all placeholder:text-[#2a5038]"
                    required
                  />
                  {pinInput && (
                    <span className="absolute right-3 top-2.5 text-[10px] font-['JetBrains_Mono'] text-[#3d7a52]">
                      {pinInput.length} DIGITS
                    </span>
                  )}
                </div>
              </div>

              {/* Duration Presets */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-['Orbitron'] text-[#3d7a52] uppercase font-bold">
                  EXPIRATION DURATION (AFTER WHICH IT STOPS WORKING)
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {[
                    { label: '5 Mins', val: 5 },
                    { label: '15 Mins', val: 15 },
                    { label: '1 Hour', val: 60 },
                    { label: '6 Hours', val: 360 },
                    { label: '24 Hours', val: 1440 },
                  ].map((preset) => (
                    <button
                      key={preset.val}
                      type="button"
                      onClick={() => {
                        setDurationMinutes(preset.val);
                        setIsCustomDuration(false);
                      }}
                      className={`py-2 px-2 text-[11px] font-['Orbitron'] font-bold rounded-xl border transition-all cursor-pointer text-center ${
                        !isCustomDuration && durationMinutes === preset.val
                          ? 'bg-[#c8ff00]/20 border-[#c8ff00] text-[#c8ff00] shadow-[0_0_12px_rgba(200,255,0,0.3)]'
                          : 'bg-[#020d06] border-[#1a5c35] text-[#3d7a52] hover:text-[#f0fff4]'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => setIsCustomDuration(true)}
                    className={`py-2 px-2 text-[11px] font-['Orbitron'] font-bold rounded-xl border transition-all cursor-pointer text-center ${
                      isCustomDuration
                        ? 'bg-[#00ffd5]/20 border-[#00ffd5] text-[#00ffd5] shadow-[0_0_12px_rgba(0,255,213,0.3)]'
                        : 'bg-[#020d06] border-[#1a5c35] text-[#3d7a52] hover:text-[#f0fff4]'
                    }`}
                  >
                    Custom
                  </button>
                </div>

                {isCustomDuration && (
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={43200}
                      value={customMinutes}
                      onChange={(e) => setCustomMinutes(e.target.value)}
                      placeholder="Duration in minutes (e.g. 45)"
                      className="flex-1 bg-[#020d06] border border-[#00ffd5] rounded-xl px-3 py-2 text-xs font-['JetBrains_Mono'] text-[#00ffd5] outline-none"
                    />
                    <span className="text-xs font-['JetBrains_Mono'] text-[#3d7a52]">MINUTES</span>
                  </div>
                )}
              </div>

              {/* Target Access Scope */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-['Orbitron'] text-[#3d7a52] uppercase font-bold">
                  AUTHORIZED ACCESS SCOPE
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setScope('search')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                      scope === 'search'
                        ? 'bg-[#00ffd5]/15 border-[#00ffd5] text-[#00ffd5]'
                        : 'bg-[#020d06] border-[#1a5c35] text-[#3d7a52] hover:text-[#f0fff4]'
                    }`}
                  >
                    <Search className="w-4 h-4 shrink-0" />
                    <div>
                      <div className="text-xs font-['Orbitron'] font-bold">SEARCH GATE</div>
                      <div className="text-[9px] font-['JetBrains_Mono'] opacity-75">Unlocks search operations</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setScope('api_automation')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                      scope === 'api_automation'
                        ? 'bg-[#c8ff00]/15 border-[#c8ff00] text-[#c8ff00]'
                        : 'bg-[#020d06] border-[#1a5c35] text-[#3d7a52] hover:text-[#f0fff4]'
                    }`}
                  >
                    <Wand2 className="w-4 h-4 shrink-0" />
                    <div>
                      <div className="text-xs font-['Orbitron'] font-bold">API AUTOMATION</div>
                      <div className="text-[9px] font-['JetBrains_Mono'] opacity-75">Unlocks API configuration</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setScope('all')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                      scope === 'all'
                        ? 'bg-[#38bdf8]/15 border-[#38bdf8] text-[#38bdf8]'
                        : 'bg-[#020d06] border-[#1a5c35] text-[#3d7a52] hover:text-[#f0fff4]'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <div>
                      <div className="text-xs font-['Orbitron'] font-bold">ALL ACCESS</div>
                      <div className="text-[9px] font-['JetBrains_Mono'] opacity-75">Search + API Automation</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Optional Label */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-['Orbitron'] text-[#3d7a52] uppercase font-bold">
                  OPTIONAL PURPOSE / RECIPIENT NOTE
                </label>
                <input
                  type="text"
                  value={labelInput}
                  onChange={(e) => setLabelInput(e.target.value)}
                  placeholder="e.g. Temporary Client Audit, 1-Hour Verification Pass"
                  maxLength={40}
                  className="w-full bg-[#020d06] border border-[#1a5c35] focus:border-[#c8ff00] rounded-xl px-3.5 py-2 text-xs font-['JetBrains_Mono'] text-[#f0fff4] outline-none placeholder:text-[#2a5038]"
                />
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isCreating}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#c8ff00]/20 via-[#c8ff00]/30 to-[#00ffd5]/20 hover:from-[#c8ff00]/30 hover:to-[#00ffd5]/30 border-2 border-[#c8ff00] text-[#c8ff00] font-['Orbitron'] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_0_20px_rgba(200,255,0,0.25)] disabled:opacity-50 mt-2"
              >
                {isCreating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>GENERATING & SAVING TIME-LIMITED PIN...</span>
                  </>
                ) : (
                  <>
                    <Key className="w-4 h-4" />
                    <span>ISSUE TIME-LIMITED SECURITY PIN</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 2: ACTIVE & EXPIRED TEMPORARY KEYS LIST */}
          {activeTab === 'temporary_list' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-['JetBrains_Mono'] text-[#3d7a52]">
                <span>RECORDED TIME-LIMITED KEYS: <strong className="text-[#c8ff00]">{temporaryPins.length}</strong></span>
                <span className="text-[#00ffd5]">ACTIVE: {activeTemporaryCount}</span>
              </div>

              {temporaryPins.length === 0 ? (
                <div className="p-8 text-center bg-[#020d06] border border-[#0f3320] rounded-2xl text-xs font-['JetBrains_Mono'] text-[#3d7a52] space-y-2">
                  <Timer className="w-8 h-8 text-[#3d7a52] mx-auto mb-1 opacity-50" />
                  <p>NO TIME-LIMITED PINS ISSUED YET.</p>
                  <p className="text-[10px] text-[#2a5038]">
                    Click "CREATE TIME-LIMITED PIN" to issue temporary keys that automatically expire.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {temporaryPins.map((temp) => {
                    const isLive = !temp.isExpired && !temp.revoked;
                    return (
                      <div
                        key={temp.id}
                        className={`p-3.5 rounded-xl border transition-all ${
                          isLive
                            ? 'bg-[#020d06] border-[#1a5c35] hover:border-[#c8ff00] shadow-[0_0_15px_rgba(200,255,0,0.08)]'
                            : 'bg-[#020d06]/60 border-[#1a1f1a] opacity-75'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#0f3320] pb-2">
                          <div className="flex items-center gap-2">
                            {/* Status indicator */}
                            <span className={`px-2 py-0.5 rounded font-['JetBrains_Mono'] text-[10px] font-bold flex items-center gap-1.5 ${
                              isLive
                                ? 'bg-[#c8ff00]/15 border border-[#c8ff00]/40 text-[#c8ff00]'
                                : temp.revoked
                                ? 'bg-[#ff4060]/15 border border-[#ff4060]/40 text-[#ff4060]'
                                : 'bg-[#ff4060]/10 border border-[#ff4060]/30 text-[#ff4060]'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-[#c8ff00] animate-ping' : 'bg-[#ff4060]'}`} />
                              <span>{isLive ? 'ACTIVE' : temp.revoked ? 'REVOKED' : 'EXPIRED'}</span>
                            </span>

                            {/* Scope pill */}
                            <span className="px-1.5 py-0.5 rounded bg-[#071510] border border-[#1a5c35] text-[#3d7a52] font-['Orbitron'] text-[9px] uppercase font-bold">
                              {temp.scope === 'search' ? '🔍 SEARCH ONLY' : temp.scope === 'api_automation' ? '⚡ API ONLY' : '🌐 UNIVERSAL'}
                            </span>
                          </div>

                          {/* Countdown Timer */}
                          <div className={`flex items-center gap-1.5 font-['JetBrains_Mono'] text-xs font-bold ${
                            isLive ? 'text-[#c8ff00]' : 'text-[#ff4060]'
                          }`}>
                            <Clock className="w-3.5 h-3.5" />
                            <span>{isLive ? `${formatTimeLeft(temp.remainingSeconds)} LEFT` : 'INACTIVE / EXPIRED'}</span>
                          </div>
                        </div>

                        {/* PIN Code & Action Controls */}
                        <div className="flex items-center justify-between pt-2.5">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <span className="font-['Orbitron'] text-xs text-[#3d7a52]">PIN:</span>
                              <span className="font-['JetBrains_Mono'] text-base sm:text-lg font-black tracking-widest text-[#f0fff4] px-2 py-0.5 rounded bg-[#071510] border border-[#0f3320]">
                                {temp.pin}
                              </span>
                            </div>

                            {temp.label && (
                              <span className="text-[11px] font-['JetBrains_Mono'] text-[#7fff50] max-w-[160px] sm:max-w-[220px] truncate">
                                "{temp.label}"
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            {/* Copy button */}
                            <button
                              type="button"
                              onClick={() => handleCopyPin(temp.pin, temp.id)}
                              className="p-1.5 rounded-lg bg-[#071510] border border-[#0f3320] hover:border-[#00ffd5] text-[#3d7a52] hover:text-[#00ffd5] transition-colors cursor-pointer"
                              title="Copy PIN"
                            >
                              {copiedPinId === temp.id ? (
                                <Check className="w-3.5 h-3.5 text-[#00ffd5]" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>

                            {/* Revoke button if live */}
                            {isLive && (
                              <button
                                type="button"
                                onClick={() => handleRevokePin(temp.id)}
                                className="p-1.5 rounded-lg bg-[#071510] border border-[#0f3320] hover:border-[#ff4060] text-[#3d7a52] hover:text-[#ff4060] transition-colors cursor-pointer"
                                title="Revoke immediately"
                              >
                                <Ban className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Delete button */}
                            <button
                              type="button"
                              onClick={() => handleDeletePin(temp.id)}
                              className="p-1.5 rounded-lg bg-[#071510] border border-[#0f3320] hover:border-[#ff4060] text-[#3d7a52] hover:text-[#ff4060] transition-colors cursor-pointer"
                              title="Delete record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Expiry Timestamp Details */}
                        <div className="mt-2 pt-1 border-t border-[#0f3320]/40 flex items-center justify-between text-[10px] font-['JetBrains_Mono'] text-[#3d7a52]">
                          <span>Issued: {new Date(temp.createdAt).toLocaleTimeString()}</span>
                          <span>Expires: {new Date(temp.expiresAt).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PERMANENT SYSTEM KEYS OVERVIEW */}
          {activeTab === 'permanent_keys' && (
            <div className="space-y-3">
              <div className="p-3 sm:p-4 rounded-xl bg-[#020d06] border border-[#1a5c35] space-y-1">
                <div className="flex items-center gap-2 text-xs font-['Orbitron'] text-[#38bdf8] font-bold uppercase">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Permanent Keys (Never Expire)</span>
                </div>
                <p className="font-['JetBrains_Mono'] text-[11px] text-[#7fff50]">
                  These are fixed, permanent system keys. They are active permanently and do not expire.
                </p>
              </div>

              {/* Permanent Key 1: Search Gate Key (9242) */}
              <div className="p-3.5 rounded-xl bg-[#020d06] border border-[#00ffd5]/40 text-xs font-['JetBrains_Mono'] space-y-2">
                <div className="flex items-center justify-between border-b border-[#0f3320] pb-2">
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-[#00ffd5]" />
                    <span className="font-['Orbitron'] font-bold text-[#f0fff4]">SEARCH GATE KEY</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-[#00ffd5]/15 border border-[#00ffd5]/40 text-[#00ffd5] text-[10px] font-bold">
                    PERMANENT KEY
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-[#3d7a52] uppercase">Permanent Security PIN:</div>
                    <div className="font-['Orbitron'] text-lg font-black text-[#00ffd5] tracking-widest">
                      {searchSecurityPin || '9242'}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopyPin(searchSecurityPin || '9242', 'perm_search')}
                    className="p-2 rounded-lg bg-[#071510] border border-[#00ffd5]/40 text-[#00ffd5] hover:bg-[#00ffd5]/10 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                  >
                    {copiedPinId === 'perm_search' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedPinId === 'perm_search' ? 'COPIED' : 'COPY PIN'}</span>
                  </button>
                </div>
                <p className="text-[10px] text-[#3d7a52]">
                  Configured permanent PIN for OSINT Search Gate operations.
                </p>
              </div>

              {/* Permanent Key 2: API Automation Key (9264) */}
              <div className="p-3.5 rounded-xl bg-[#020d06] border border-[#c8ff00]/40 text-xs font-['JetBrains_Mono'] space-y-2">
                <div className="flex items-center justify-between border-b border-[#0f3320] pb-2">
                  <div className="flex items-center gap-2">
                    <Wand2 className="w-4 h-4 text-[#c8ff00]" />
                    <span className="font-['Orbitron'] font-bold text-[#f0fff4]">API AUTOMATION KEY</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-[#c8ff00]/15 border border-[#c8ff00]/40 text-[#c8ff00] text-[10px] font-bold">
                    PERMANENT KEY
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-[#3d7a52] uppercase">Permanent Security PIN:</div>
                    <div className="font-['Orbitron'] text-lg font-black text-[#c8ff00] tracking-widest">
                      {apiAutomationPin || '9264'}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopyPin(apiAutomationPin || '9264', 'perm_api')}
                    className="p-2 rounded-lg bg-[#071510] border border-[#c8ff00]/40 text-[#c8ff00] hover:bg-[#c8ff00]/10 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                  >
                    {copiedPinId === 'perm_api' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedPinId === 'perm_api' ? 'COPIED' : 'COPY PIN'}</span>
                  </button>
                </div>
                <p className="text-[10px] text-[#3d7a52]">
                  Enforced permanent PIN for automated API Structure & Dynamic Keys engine.
                </p>
              </div>

              {/* Permanent Key 3: Master Portal Login Key */}
              <div className="p-3.5 rounded-xl bg-[#020d06] border border-[#38bdf8]/40 text-xs font-['JetBrains_Mono'] space-y-2">
                <div className="flex items-center justify-between border-b border-[#0f3320] pb-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#38bdf8]" />
                    <span className="font-['Orbitron'] font-bold text-[#f0fff4]">MASTER SYSTEM LOGIN PIN</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-[#38bdf8]/15 border border-[#38bdf8]/40 text-[#38bdf8] text-[10px] font-bold">
                    PERMANENT MASTER
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-[#3d7a52] uppercase">Master PIN Code:</div>
                    <div className="font-['Orbitron'] text-lg font-black text-[#38bdf8] tracking-widest">
                      {masterPin}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopyPin(masterPin, 'perm_master')}
                    className="p-2 rounded-lg bg-[#071510] border border-[#38bdf8]/40 text-[#38bdf8] hover:bg-[#38bdf8]/10 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                  >
                    {copiedPinId === 'perm_master' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedPinId === 'perm_master' ? 'COPIED' : 'COPY PIN'}</span>
                  </button>
                </div>
                <p className="text-[10px] text-[#3d7a52]">
                  Master system login key stored securely in MongoDB.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 border-t border-[#0f3320] bg-[#020d06]/60 flex items-center justify-between text-xs font-['JetBrains_Mono'] text-[#3d7a52]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#c8ff00] animate-pulse" />
            <span>EXPIRED KEYS AUTOMATICALLY LOSE AUTHORIZATION</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-[#020d06] border border-[#1a5c35] hover:border-[#c8ff00] text-[#f0fff4] hover:text-[#c8ff00] text-xs transition-colors cursor-pointer"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
