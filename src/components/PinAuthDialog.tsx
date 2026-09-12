import React, { useState, useRef, useEffect } from 'react';
import { Lock, Unlock, Key, X, AlertTriangle, CheckCircle2, RefreshCw, Cpu, ShieldCheck } from 'lucide-react';

interface PinAuthDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  masterPin?: string;
  searchPin?: string;
  apiAutomationPin?: string;
  title?: string;
  subtitle?: string;
}

export const PinAuthDialog: React.FC<PinAuthDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
  masterPin = '2007',
  searchPin = '9242',
  apiAutomationPin = '9264',
  title = 'ADMIN PORTAL // PIN AUTH',
  subtitle = 'ENTER ADMIN PIN • VERIFIED VIA MONGODB'
}) => {
  const [pinInput, setPinInput] = useState('');
  const [status, setStatus] = useState<'idle' | 'verifying' | 'granted' | 'denied'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPinInput('');
      setStatus('idle');
      setErrorMessage(null);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleVerify = async (pinToTest: string) => {
    const clean = pinToTest.trim();
    if (!clean) {
      setErrorMessage('PLEASE ENTER SECURITY PIN');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      return;
    }

    setStatus('verifying');
    setErrorMessage(null);

    // Try backend verification with MongoDB
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: clean, type: 'api_automation' })
      });
      const data = await res.json();
      if (data && data.granted) {
        setStatus('granted');
        setTimeout(() => {
          onSuccess();
        }, 500);
        return;
      } else if (data && data.isExpired) {
        // Explicit expiration feedback
        setStatus('denied');
        setIsShaking(true);
        setErrorMessage(data.message || 'ACCESS DENIED: TIME-LIMITED PIN HAS EXPIRED');
        setTimeout(() => {
          setIsShaking(false);
          setPinInput('');
          setStatus('idle');
          inputRef.current?.focus();
        }, 2000);
        return;
      } else if (data && data.scopeMismatch) {
        setStatus('denied');
        setIsShaking(true);
        setErrorMessage(data.message || 'ACCESS DENIED: SCOPE RESTRICTED');
        setTimeout(() => {
          setIsShaking(false);
          setPinInput('');
          setStatus('idle');
          inputRef.current?.focus();
        }, 2000);
        return;
      }
    } catch {
      // Offline fallback
    }

    // STRICT RULE: Only PIN 9264 or active permanent key can unlock API Automation
    const isExactPermanentMatch = clean === '9264' || (apiAutomationPin ? clean === apiAutomationPin : false);

    if (isExactPermanentMatch) {
      setStatus('granted');
      setTimeout(() => {
        onSuccess();
      }, 500);
    } else {
      setStatus('denied');
      setIsShaking(true);
      setErrorMessage('ACCESS DENIED: INVALID SECURITY PIN');
      setTimeout(() => {
        setIsShaking(false);
        setPinInput('');
        setStatus('idle');
        inputRef.current?.focus();
      }, 1200);
    }
  };

  const handleKeyPress = (digit: string) => {
    if (status === 'verifying' || status === 'granted') return;
    if (pinInput.length < 8) {
      const next = pinInput + digit;
      setPinInput(next);
      setErrorMessage(null);
      if (next.length === 4) {
        handleVerify(next);
      }
    }
  };

  const handleDelete = () => {
    if (status === 'verifying' || status === 'granted') return;
    setPinInput(prev => prev.slice(0, -1));
    setErrorMessage(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key >= '0' && e.key <= '9') {
      e.preventDefault();
      handleKeyPress(e.key);
    } else if (e.key === 'Backspace') {
      e.preventDefault();
      handleDelete();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleVerify(pinInput);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#020d06]/85 backdrop-blur-md select-none overflow-y-auto overscroll-contain min-h-[100dvh]"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div 
        className={`relative w-full max-w-md bg-[#071510] border-2 border-[#1a5c35] rounded-2xl sm:rounded-3xl p-5 sm:p-6 my-auto shadow-[0_0_50px_rgba(0,255,213,0.2)] transition-all ${
          isShaking ? 'animate-shake !border-[#ff4060] !shadow-[0_0_40px_rgba(255,64,96,0.4)]' : ''
        } ${status === 'granted' ? '!border-[#c8ff00] !shadow-[0_0_50px_rgba(200,255,0,0.5)]' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          inputRef.current?.focus();
        }}
      >
        {/* HUD Corners */}
        <span className="hud-corner hud-tl" />
        <span className="hud-corner hud-tr" />
        <span className="hud-corner hud-bl" />
        <span className="hud-corner hud-br" />

        {/* Top Header */}
        <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-[#0f3320]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#020d06] border border-[#00ffd5] flex items-center justify-center text-[#00ffd5] shrink-0">
              <Cpu className="w-4 h-4 animate-pulse" />
            </div>
            <div className="min-w-0">
              <h3 className="font-['Orbitron'] text-xs sm:text-sm font-bold text-[#f0fff4] uppercase tracking-wider truncate">
                {title}
              </h3>
              <p className="font-['JetBrains_Mono'] text-[9px] sm:text-[10px] text-[#3d7a52] uppercase truncate">
                {subtitle}
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-lg bg-[#020d06] hover:bg-[#1a0509] border border-[#0f3320] hover:border-[#ff4060] text-[#3d7a52] hover:text-[#ff4060] transition-colors cursor-pointer touch-manipulation min-h-[36px] min-w-[36px] flex items-center justify-center shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Hidden focus input */}
        <input 
          ref={inputRef}
          type="password"
          value={pinInput}
          onChange={(e) => {
            const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 8);
            setPinInput(val);
            if (val.length >= 4) {
              handleVerify(val);
            }
          }}
          className="sr-only opacity-0 absolute"
          autoFocus
        />

        {/* Pin Slots */}
        <div className="text-center my-5">
          <div className="flex items-center justify-center gap-3 mb-3">
            {[0, 1, 2, 3].map((idx) => {
              const isFilled = pinInput.length > idx;
              return (
                <div 
                  key={idx}
                  className={`w-12 h-14 rounded-2xl bg-[#020d06] border-2 flex items-center justify-center transition-all ${
                    status === 'denied' 
                      ? 'border-[#ff4060] bg-[#ff4060]/15' 
                      : status === 'granted' 
                      ? 'border-[#c8ff00] bg-[#c8ff00]/20' 
                      : isFilled 
                      ? 'border-[#00ffd5] shadow-[0_0_15px_rgba(0,255,213,0.3)]' 
                      : 'border-[#1a5c35]'
                  }`}
                >
                  {isFilled ? (
                    <span className="w-3 h-3 rounded-full bg-[#00ffd5] shadow-[0_0_8px_#00ffd5] animate-pulse" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1a5c35]" />
                  )}
                </div>
              );
            })}
          </div>

          <div className="h-6 flex items-center justify-center">
            {status === 'verifying' ? (
              <span className="font-['JetBrains_Mono'] text-xs text-[#00ffd5] flex items-center gap-1.5 animate-pulse">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>AUTHENTICATING PIN...</span>
              </span>
            ) : status === 'granted' ? (
              <span className="font-['JetBrains_Mono'] text-xs text-[#c8ff00] font-bold flex items-center gap-1.5 animate-pulse">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>ACCESS GRANTED // AUTHORIZED</span>
              </span>
            ) : errorMessage ? (
              <span className="font-['JetBrains_Mono'] text-[11px] text-[#ff4060] font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{errorMessage}</span>
              </span>
            ) : (
              <span className="font-['JetBrains_Mono'] text-[11px] text-[#3d7a52]">
                ENTER YOUR AUTHORIZED SECURITY PIN
              </span>
            )}
          </div>
        </div>

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => handleKeyPress(d)}
              disabled={status === 'verifying' || status === 'granted'}
              className="h-12 rounded-xl bg-[#020d06] hover:bg-[#0a1e12] active:bg-[#00ffd5]/20 border border-[#1a5c35] hover:border-[#00ffd5] text-base font-['Orbitron'] font-bold text-[#f0fff4] hover:text-[#00ffd5] transition-all cursor-pointer disabled:opacity-50 touch-manipulation active:scale-95"
            >
              {d}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setPinInput('');
              setErrorMessage(null);
            }}
            className="h-12 rounded-xl bg-[#020d06] hover:bg-[#1a0509] border border-[#0f3320] text-xs font-['JetBrains_Mono'] font-bold text-[#3d7a52] hover:text-[#ff4060] transition-colors cursor-pointer touch-manipulation active:scale-95"
          >
            CLEAR
          </button>
          <button
            type="button"
            onClick={() => handleKeyPress('0')}
            disabled={status === 'verifying' || status === 'granted'}
            className="h-12 rounded-xl bg-[#020d06] hover:bg-[#0a1e12] active:bg-[#00ffd5]/20 border border-[#1a5c35] hover:border-[#00ffd5] text-base font-['Orbitron'] font-bold text-[#f0fff4] hover:text-[#00ffd5] transition-all cursor-pointer disabled:opacity-50 touch-manipulation active:scale-95"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="h-12 rounded-xl bg-[#020d06] hover:bg-[#0a1e12] border border-[#0f3320] text-xs font-['JetBrains_Mono'] font-bold text-[#3d7a52] hover:text-[#00ffd5] transition-colors cursor-pointer touch-manipulation active:scale-95"
          >
            DEL
          </button>
        </div>

        {/* Submit */}
        <button
          type="button"
          onClick={() => handleVerify(pinInput)}
          disabled={status === 'verifying' || status === 'granted' || pinInput.length === 0}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#00ffd5] to-[#c8ff00] text-[#020d06] font-['Orbitron'] font-black text-xs uppercase tracking-wider hover:shadow-[0_0_25px_rgba(0,255,213,0.5)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 touch-manipulation active:scale-[0.98]"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>VERIFY & ACCESS</span>
        </button>
      </div>
    </div>
  );
};
