import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Unlock, 
  Key, 
  Delete, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle, 
  ArrowLeft, 
  ArrowRight, 
  KeyRound, 
  Sparkles,
  ExternalLink 
} from 'lucide-react';

interface LiquidGlassLockScreenProps {
  onUnlock: (pin: string) => void;
  requiredPin?: string;
  onUpdatePin?: (newPin: string, oldPin?: string) => void;
}

export const LiquidGlassLockScreen: React.FC<LiquidGlassLockScreenProps> = ({
  onUnlock,
  requiredPin = '2007',
  onUpdatePin
}) => {
  // Main PIN input state
  const [pin, setPin] = useState('');
  const [currentMasterPin, setCurrentMasterPin] = useState(requiredPin);
  const [status, setStatus] = useState<'idle' | 'verifying' | 'granted' | 'denied'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPin, setShowPin] = useState(false);
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const [isDbConnected, setIsDbConnected] = useState(false);

  // Sync requiredPin changes
  useEffect(() => {
    setCurrentMasterPin(requiredPin);
  }, [requiredPin]);

  // Sync with backend MongoDB PIN on mount
  useEffect(() => {
    fetch('/api/pin')
      .then(res => res.json())
      .then(data => {
        if (data) {
          if (data.currentPin) {
            setCurrentMasterPin(data.currentPin);
          }
          if (typeof data.isDbConnected === 'boolean') {
            setIsDbConnected(data.isDbConnected);
          }
        }
      })
      .catch(() => {});
  }, []);

  // Forgot Password Flow State
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState<'question' | 'reset' | 'success'>('question');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [securityError, setSecurityError] = useState<string | null>(null);
  
  // New Password State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [isResetSuccess, setIsResetSuccess] = useState(false);

  const answerInputRef = useRef<HTMLInputElement>(null);
  const newPassInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input on mount or step change
  useEffect(() => {
    if (!isForgotOpen) {
      inputRef.current?.focus();
    } else if (forgotStep === 'question') {
      setTimeout(() => answerInputRef.current?.focus(), 100);
    } else if (forgotStep === 'reset') {
      setTimeout(() => newPassInputRef.current?.focus(), 100);
    }
  }, [isForgotOpen, forgotStep]);

  // Standard PIN authentication (authenticated against MongoDB)
  const handleVerify = async (inputPin: string) => {
    const cleanPin = inputPin.trim();
    if (!cleanPin) {
      setErrorMessage('PLEASE ENTER SECURITY PIN');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    setStatus('verifying');
    setErrorMessage(null);

    try {
      // Direct verification with MongoDB backend
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: cleanPin })
      });
      const data = await res.json();

      if (data && data.granted) {
        setStatus('granted');
        if (data.currentPin) setCurrentMasterPin(data.currentPin);
        setTimeout(() => {
          onUnlock(cleanPin);
        }, 600);
        return;
      }

      // If backend says denied or expired
      setStatus('denied');
      setShake(true);
      if (data?.isExpired) {
        setErrorMessage('ACCESS DENIED: OLD PIN HAS EXPIRED. ENTER NEW PIN.');
      } else {
        setErrorMessage(data?.message || 'ACCESS DENIED: INVALID SECURITY PIN');
      }
      setTimeout(() => {
        setShake(false);
        setPin('');
        setStatus('idle');
        inputRef.current?.focus();
      }, 1600);
    } catch (err) {
      // Local fallback in case network error occurs - strictly check against current active PIN
      const isLocalMatch = cleanPin.toLowerCase() === currentMasterPin.toLowerCase();

      // Check if entered PIN is a known expired PIN
      let isExpired = false;
      try {
        const expiredList: string[] = JSON.parse(localStorage.getItem('zerotrace_expired_pins') || '[]');
        if (expiredList.map(p => p.toLowerCase()).includes(cleanPin.toLowerCase()) ||
           (cleanPin === '2007' && currentMasterPin.toLowerCase() !== '2007')) {
          isExpired = true;
        }
      } catch {}

      if (isLocalMatch) {
        setStatus('granted');
        setTimeout(() => {
          onUnlock(cleanPin);
        }, 600);
        return;
      }

      setStatus('denied');
      setShake(true);
      if (isExpired) {
        setErrorMessage('ACCESS DENIED: OLD PIN HAS EXPIRED. ENTER NEW PIN.');
      } else {
        setErrorMessage('ACCESS DENIED: INVALID SECURITY PIN');
      }
      setTimeout(() => {
        setShake(false);
        setPin('');
        setStatus('idle');
        inputRef.current?.focus();
      }, 1600);
    }
  };

  const handleKeyPress = (digit: string) => {
    if (status === 'verifying' || status === 'granted') return;
    if (pin.length < 8) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setErrorMessage(null);
      // Auto verify when 4 digits are entered (or length of current PIN)
      const targetLen = currentMasterPin.length >= 4 ? currentMasterPin.length : 4;
      if (nextPin.length === targetLen) {
        handleVerify(nextPin);
      }
    }
  };

  const handleDelete = () => {
    if (status === 'verifying' || status === 'granted') return;
    setPin(prev => prev.slice(0, -1));
    setErrorMessage(null);
  };

  const handleClear = () => {
    if (status === 'verifying' || status === 'granted') return;
    setPin('');
    setErrorMessage(null);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isForgotOpen) return;
    if (e.key >= '0' && e.key <= '9') {
      e.preventDefault();
      handleKeyPress(e.key);
    } else if (e.key === 'Backspace') {
      e.preventDefault();
      handleDelete();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleVerify(pin);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleClear();
    }
  };

  // Step 1: Verify Security Question
  const handleVerifySecurityQuestion = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = securityAnswer.trim().toLowerCase().replace(/\s+/g, ' ');

    // Match "5 February" and reasonable variants
    const isCorrect = (
      clean === '5 february' ||
      clean === '5th february' ||
      clean === '05 february' ||
      clean === '5 feb' ||
      clean === '05 feb' ||
      clean === '5th feb' ||
      clean === '5/2' ||
      clean === '05/02' ||
      clean === '5-2' ||
      clean === '05-02' ||
      clean.includes('5 feb')
    );

    if (isCorrect) {
      setSecurityError(null);
      setForgotStep('reset');
    } else {
      setSecurityError('INCORRECT ANSWER. SECURITY VERIFICATION FAILED.');
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  // Step 2: Set & Confirm New Password
  const handleResetPassword = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const newPass = newPassword.trim();
    const confirmPass = confirmPassword.trim();

    if (!newPass) {
      setResetError('PLEASE ENTER A NEW PASSWORD / PIN');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    if (newPass !== confirmPass) {
      setResetError('PASSWORDS DO NOT MATCH. PLEASE CONFIRM EXACT MATCH.');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    // Successfully update the password to be the MAIN password
    const oldPass = currentMasterPin;
    setResetError(null);
    setCurrentMasterPin(newPass);

    // Save old password into expired pins registry in localStorage
    try {
      const expiredList: string[] = JSON.parse(localStorage.getItem('zerotrace_expired_pins') || '[]');
      if (oldPass && !expiredList.includes(oldPass)) {
        expiredList.push(oldPass);
      }
      if (!expiredList.includes('2007') && newPass !== '2007') {
        expiredList.push('2007');
      }
      localStorage.setItem('zerotrace_expired_pins', JSON.stringify(expiredList));
    } catch (e) {
      console.warn(e);
    }

    // Sync to MongoDB backend
    fetch('/api/pin/change', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        oldPassword: oldPass,
        newPassword: newPass,
        source: 'forgot_question_recovery'
      })
    })
      .then(res => res.json())
      .catch(err => console.warn('[Auth] Server sync fallback:', err));

    if (onUpdatePin) {
      onUpdatePin(newPass, oldPass);
    } else {
      try {
        localStorage.setItem('zerotrace_master_pin', newPass);
      } catch (err) {
        console.warn(err);
      }
    }

    setIsResetSuccess(true);
    setForgotStep('success');
  };

  const handleReturnToLogin = (autoEnter = false) => {
    setIsForgotOpen(false);
    setForgotStep('question');
    setSecurityAnswer('');
    setSecurityError(null);
    setResetError(null);

    if (autoEnter && newPassword.trim()) {
      const updated = newPassword.trim();
      setPin(updated);
      handleVerify(updated);
    } else {
      setPin('');
      setStatus('idle');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-hidden select-none bg-[#020d06]"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onClick={() => {
        if (!isForgotOpen) inputRef.current?.focus();
      }}
    >
      {/* Background Cyber Grid */}
      <div className="cyber-grid-bg opacity-40" />

      {/* Fluid Liquid Glass Glow Orbs */}
      <div 
        className="liquid-orb w-[450px] h-[450px] -top-32 -left-32 bg-gradient-to-tr from-[#c8ff00]/25 via-[#00ffd5]/20 to-transparent" 
        style={{ animationDuration: '14s' }}
      />
      <div 
        className="liquid-orb liquid-orb-2 w-[550px] h-[550px] -bottom-40 -right-40 bg-gradient-to-bl from-[#00ffd5]/25 via-[#7fff50]/15 to-[#1a5c35]/20" 
        style={{ animationDuration: '18s' }}
      />
      <div 
        className="liquid-orb w-[380px] h-[380px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-[#0f3320]/40 via-[#c8ff00]/10 to-[#00ffd5]/15" 
        style={{ animationDuration: '10s' }}
      />

      {/* Ambient chromatic light streaks */}
      <div className="absolute inset-0 bg-radial from-transparent via-[#020d06]/60 to-[#020d06] pointer-events-none" />

      {/* Hidden input for hardware keyboard focus when in keypad mode */}
      {!isForgotOpen && (
        <input
          ref={inputRef}
          type="password"
          value={pin}
          onChange={(e) => {
            const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 8);
            setPin(val);
            const targetLen = currentMasterPin.length >= 4 ? currentMasterPin.length : 4;
            if (val.length === targetLen) {
              handleVerify(val);
            }
          }}
          className="sr-only opacity-0 absolute pointer-events-none"
          autoFocus
        />
      )}

      {/* Centered Liquid Glassmorphism Card */}
      <div 
        className={`relative z-10 w-full max-w-[460px] liquid-glass-card rounded-3xl p-6 sm:p-8 transition-all duration-300 backdrop-blur-xl ${
          shake ? 'animate-shake !border-[#ff4060] !shadow-[0_0_50px_rgba(255,64,96,0.4)]' : ''
        } ${
          status === 'granted' ? '!border-[#c8ff00] !shadow-[0_0_60px_rgba(200,255,0,0.5)] scale-[1.02]' : ''
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* HUD Precision Corner Accents */}
        <span className="hud-corner hud-tl" style={{ borderColor: status === 'denied' || securityError || resetError ? '#ff4060' : '#c8ff00' }} />
        <span className="hud-corner hud-tr" style={{ borderColor: status === 'denied' || securityError || resetError ? '#ff4060' : '#c8ff00' }} />
        <span className="hud-corner hud-bl" style={{ borderColor: status === 'denied' || securityError || resetError ? '#ff4060' : '#c8ff00' }} />
        <span className="hud-corner hud-br" style={{ borderColor: status === 'denied' || securityError || resetError ? '#ff4060' : '#c8ff00' }} />

        {/* Top Header Badge */}
        <div className="flex items-center justify-between gap-2 mb-6">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${status === 'denied' ? 'bg-[#ff4060]' : 'bg-[#c8ff00]'} animate-ping`} />
            <span className="font-['JetBrains_Mono'] text-[11px] font-bold tracking-widest text-[#00ffd5] uppercase">
              {isForgotOpen ? 'GATEWAY RECOVERY // PROTOCOL' : 'SECURE GATEWAY // STRICT KEY'}
            </span>
          </div>
          <div className="px-2.5 py-1 rounded-full bg-[#020d06]/80 border border-[#0f3320] text-[10px] font-['JetBrains_Mono'] text-[#c8ff00] flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${isDbConnected ? 'bg-[#00ffd5] shadow-[0_0_8px_#00ffd5]' : 'bg-[#c8ff00]'}`} />
            <span>{isDbConnected ? 'MONGO STRICT AUTH' : 'STRICT ENFORCED'}</span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* VIEW 1: FORGOT PASSWORD RECOVERY FLOW                                      */}
        {/* ========================================================================= */}
        {isForgotOpen ? (
          <div className="space-y-5">
            {/* Header / Sub-title */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#071510] to-[#0a1e12] border-2 border-[#1a5c35] shadow-[0_0_25px_rgba(255,189,46,0.2)] mb-3">
                {forgotStep === 'success' ? (
                  <CheckCircle2 className="w-7 h-7 text-[#c8ff00] animate-bounce" />
                ) : forgotStep === 'reset' ? (
                  <KeyRound className="w-7 h-7 text-[#00ffd5]" />
                ) : (
                  <HelpCircle className="w-7 h-7 text-[#ffbd2e]" />
                )}
              </div>

              <h2 className="font-['Orbitron'] text-lg sm:text-xl font-black text-[#f0fff4] uppercase tracking-wider">
                {forgotStep === 'success'
                  ? 'PASSWORD CHANGED'
                  : forgotStep === 'reset'
                  ? 'SET NEW PASSWORD'
                  : 'PASSWORD RECOVERY'}
              </h2>
              <p className="font-['JetBrains_Mono'] text-xs text-[#3d7a52] mt-1 tracking-wider uppercase">
                {forgotStep === 'success'
                  ? 'YOUR NEW PASSWORD IS NOW THE MAIN SECURITY KEY'
                  : forgotStep === 'reset'
                  ? 'ENTER AND CONFIRM YOUR NEW MASTER PASSWORD'
                  : 'ANSWER SECURITY QUESTION TO UNLOCK RESET'}
              </p>
            </div>

            {/* STEP 1: SECURITY QUESTION */}
            {forgotStep === 'question' && (
              <form onSubmit={handleVerifySecurityQuestion} className="space-y-4">
                <div className="p-4 rounded-2xl bg-[#020d06]/90 border-2 border-[#1a5c35] shadow-inner space-y-2">
                  <div className="flex items-center gap-2 text-[#ffbd2e] text-xs font-['JetBrains_Mono'] font-bold">
                    <Key className="w-3.5 h-3.5" />
                    <span>SECURITY QUESTION:</span>
                  </div>
                  <p className="font-['JetBrains_Mono'] text-sm sm:text-base font-semibold text-[#f0fff4] pl-1 select-text">
                    "what is your bros birth date?"
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-['JetBrains_Mono'] text-[#3d7a52] uppercase">
                    Your Answer:
                  </label>
                  <input
                    ref={answerInputRef}
                    type="text"
                    value={securityAnswer}
                    onChange={(e) => {
                      setSecurityAnswer(e.target.value);
                      if (securityError) setSecurityError(null);
                    }}
                    placeholder="Enter security answer..."
                    className="w-full px-4 py-3.5 rounded-2xl bg-[#020d06] border-2 border-[#1a5c35] focus:border-[#c8ff00] focus:shadow-[0_0_20px_rgba(200,255,0,0.25)] text-[#f0fff4] font-['JetBrains_Mono'] text-sm outline-none transition-all placeholder:text-[#2a5038]"
                    autoFocus
                  />
                </div>

                {/* Error Banner */}
                {securityError && (
                  <div className="p-3 rounded-xl bg-[#ff4060]/10 border border-[#ff4060]/40 flex items-center gap-2 text-xs font-['JetBrains_Mono'] text-[#ff4060]">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{securityError}</span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-2 pt-2">
                  <button
                    type="submit"
                    disabled={!securityAnswer.trim()}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#c8ff00] via-[#7fff50] to-[#00ffd5] text-[#020d06] font-['Orbitron'] font-black text-sm tracking-wider hover:shadow-[0_0_30px_rgba(200,255,0,0.5)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:hover:shadow-none"
                  >
                    <span>VERIFY ANSWER</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleReturnToLogin(false)}
                    className="w-full py-2.5 rounded-2xl bg-[#071510] hover:bg-[#0a1e12] border border-[#0f3320] text-xs font-['JetBrains_Mono'] text-[#3d7a52] hover:text-[#f0fff4] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>BACK TO LOGIN</span>
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: NEW PASSWORD & CONFIRM PASSWORD */}
            {forgotStep === 'reset' && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="p-3 rounded-xl bg-[#c8ff00]/10 border border-[#c8ff00]/30 flex items-center gap-2 text-xs font-['JetBrains_Mono'] text-[#c8ff00]">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>IDENTITY VERIFIED. CREATE YOUR NEW PASSWORD.</span>
                </div>

                {/* New Password Input */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-['JetBrains_Mono'] text-[#3d7a52] uppercase">
                    New Password / PIN:
                  </label>
                  <div className="relative flex items-center">
                    <input
                      ref={newPassInputRef}
                      type={showNewPass ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        if (resetError) setResetError(null);
                      }}
                      placeholder="Enter new password / PIN..."
                      className="w-full px-4 py-3.5 pr-11 rounded-2xl bg-[#020d06] border-2 border-[#1a5c35] focus:border-[#00ffd5] focus:shadow-[0_0_20px_rgba(0,255,213,0.25)] text-[#f0fff4] font-['JetBrains_Mono'] text-sm outline-none transition-all placeholder:text-[#2a5038]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-3.5 text-[#3d7a52] hover:text-[#00ffd5] transition-colors p-1"
                    >
                      {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password Input */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-['JetBrains_Mono'] text-[#3d7a52] uppercase">
                    Confirm Password:
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type={showConfirmPass ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (resetError) setResetError(null);
                      }}
                      placeholder="Re-enter to confirm password..."
                      className="w-full px-4 py-3.5 pr-11 rounded-2xl bg-[#020d06] border-2 border-[#1a5c35] focus:border-[#00ffd5] focus:shadow-[0_0_20px_rgba(0,255,213,0.25)] text-[#f0fff4] font-['JetBrains_Mono'] text-sm outline-none transition-all placeholder:text-[#2a5038]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      className="absolute right-3.5 text-[#3d7a52] hover:text-[#00ffd5] transition-colors p-1"
                    >
                      {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Match indicator */}
                {newPassword && confirmPassword && (
                  <div className="text-xs font-['JetBrains_Mono']">
                    {newPassword === confirmPassword ? (
                      <span className="text-[#c8ff00] flex items-center gap-1 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        PASSWORDS MATCH — READY TO UPDATE
                      </span>
                    ) : (
                      <span className="text-[#ff4060] flex items-center gap-1 font-bold">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        PASSWORDS DO NOT MATCH
                      </span>
                    )}
                  </div>
                )}

                {/* Error Banner */}
                {resetError && (
                  <div className="p-3 rounded-xl bg-[#ff4060]/10 border border-[#ff4060]/40 flex items-center gap-2 text-xs font-['JetBrains_Mono'] text-[#ff4060]">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{resetError}</span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-2 pt-2">
                  <button
                    type="submit"
                    disabled={!newPassword.trim() || newPassword !== confirmPassword}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#c8ff00] via-[#7fff50] to-[#00ffd5] text-[#020d06] font-['Orbitron'] font-black text-sm tracking-wider hover:shadow-[0_0_30px_rgba(200,255,0,0.5)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:hover:shadow-none"
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>CHANGE PASSWORD</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleReturnToLogin(false)}
                    className="w-full py-2.5 rounded-2xl bg-[#071510] hover:bg-[#0a1e12] border border-[#0f3320] text-xs font-['JetBrains_Mono'] text-[#3d7a52] hover:text-[#f0fff4] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>CANCEL</span>
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: SUCCESS CONFIRMATION */}
            {forgotStep === 'success' && (
              <div className="space-y-5 text-center">
                <div className="p-4 rounded-2xl bg-[#c8ff00]/10 border-2 border-[#c8ff00]/40 text-[#c8ff00] font-['JetBrains_Mono'] text-xs space-y-1 shadow-[0_0_30px_rgba(200,255,0,0.15)]">
                  <div className="font-bold flex items-center justify-center gap-1.5 text-sm">
                    <Sparkles className="w-4 h-4" />
                    <span>PASSWORD UPDATED SUCCESSFULLY!</span>
                  </div>
                  <p className="text-[#f0fff4]/80 text-[11px] pt-1">
                    Your new passcode has been activated as the primary portal key.
                  </p>
                </div>

                <div className="space-y-2.5">
                  <button
                    type="button"
                    onClick={() => handleReturnToLogin(true)}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#c8ff00] via-[#7fff50] to-[#00ffd5] text-[#020d06] font-['Orbitron'] font-black text-sm tracking-wider hover:shadow-[0_0_35px_rgba(200,255,0,0.6)] transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>LOGIN NOW WITH NEW PASSWORD</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleReturnToLogin(false)}
                    className="w-full py-2.5 rounded-2xl bg-[#071510] hover:bg-[#0a1e12] border border-[#0f3320] text-xs font-['JetBrains_Mono'] text-[#3d7a52] hover:text-[#f0fff4] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>BACK TO KEYPAD LOGIN</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ========================================================================= */
          /* VIEW 2: STANDARD PIN / KEYPAD LOGIN SCREEN                                */
          /* ========================================================================= */
          <>
            {/* Emblem & Portal Identity */}
            <div className="text-center mb-6">
              <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl rgb-edge-badge mb-3 group">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#c8ff00]/10 via-[#00ffd5]/10 to-transparent animate-pulse pointer-events-none" />
                {status === 'granted' ? (
                  <Unlock className="w-8 h-8 text-[#c8ff00] animate-bounce" />
                ) : status === 'denied' ? (
                  <AlertTriangle className="w-8 h-8 text-[#ff4060] animate-pulse" />
                ) : (
                  <Lock className="w-8 h-8 text-[#c8ff00] group-hover:scale-110 transition-transform" />
                )}
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
                className="font-['Orbitron'] text-xl sm:text-2xl font-black tracking-wider text-[#f0fff4] uppercase flex items-center justify-center gap-1.5 cursor-pointer hover:text-[#c8ff00] active:scale-95 transition-all group select-none"
              >
                <span className="group-hover:text-[#c8ff00] transition-colors">ZeroTrace</span>
                <span className="text-[#c8ff00] glow-text group-hover:drop-shadow-[0_0_12px_#c8ff00]">.Legit</span>
                <ExternalLink className="w-4 h-4 text-[#3d7a52] group-hover:text-[#c8ff00] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all opacity-60 group-hover:opacity-100 shrink-0" />
              </h1>
              <p className="font-['JetBrains_Mono'] text-xs text-[#3d7a52] mt-1 tracking-wider uppercase">
                ENTER SECURITY PIN TO UNLOCK SYSTEM
              </p>
            </div>

            {/* PIN Liquid Indicator Slots */}
            <div className="mb-6">
              <div className="flex items-center justify-center gap-3.5 mb-3">
                {[0, 1, 2, 3].map((idx) => {
                  const isFilled = pin.length > idx;
                  const char = pin[idx];
                  return (
                    <div
                      key={idx}
                      onClick={() => inputRef.current?.focus()}
                      className={`w-12 h-14 sm:w-14 sm:h-16 rounded-2xl flex items-center justify-center transition-all duration-200 cursor-pointer rgb-edge-slot ${
                        isFilled
                          ? 'shadow-[0_0_25px_rgba(200,255,0,0.45)]'
                          : ''
                      } ${
                        status === 'denied'
                          ? '!border-[#ff4060] !bg-[#ff4060]/20 !shadow-[0_0_20px_rgba(255,64,96,0.5)]'
                          : ''
                      } ${
                        status === 'granted'
                          ? '!border-[#c8ff00] !bg-[#c8ff00]/30 !shadow-[0_0_30px_rgba(200,255,0,0.6)]'
                          : ''
                      }`}
                    >
                      {isFilled ? (
                        showPin ? (
                          <span className="font-['Orbitron'] font-bold text-lg sm:text-xl text-[#c8ff00]">
                            {char}
                          </span>
                        ) : (
                          <span className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-[#c8ff00] shadow-[0_0_12px_#c8ff00] animate-pulse" />
                        )
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0f3320]" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Status / Error feedback */}
              <div className="h-6 flex items-center justify-center text-center">
                {status === 'verifying' ? (
                  <div className="flex items-center gap-2 font-['JetBrains_Mono'] text-xs text-[#00ffd5] animate-pulse">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>DECRYPTING CLEARANCE PROTOCOLS...</span>
                  </div>
                ) : status === 'granted' ? (
                  <div className="flex items-center gap-1.5 font-['JetBrains_Mono'] text-xs font-bold text-[#c8ff00] animate-pulse">
                    <CheckCircle2 className="w-4 h-4 text-[#c8ff00]" />
                    <span>ACCESS GRANTED // INITIALIZING CONSOLE...</span>
                  </div>
                ) : errorMessage ? (
                  <div className="flex items-center gap-1.5 font-['JetBrains_Mono'] text-[11px] font-bold text-[#ff4060] bg-[#ff4060]/10 border border-[#ff4060]/30 px-3 py-1.5 rounded-xl shadow-[0_0_20px_rgba(255,64,96,0.3)] animate-pulse">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-[#ff4060]" />
                    <span className="truncate">{errorMessage}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-[11px] font-['JetBrains_Mono'] text-[#3d7a52]">
                    <Key className="w-3 h-3 text-[#c8ff00]" />
                    <span>ENTER ACTIVE SECURITY PIN (OLD PINS EXPIRED)</span>
                  </div>
                )}
              </div>
            </div>

            {/* Liquid Glass Keypad Grid */}
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3 mb-5">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleKeyPress(digit)}
                  disabled={status === 'verifying' || status === 'granted'}
                  className="liquid-glass-button h-12 sm:h-14 rounded-2xl flex items-center justify-center font-['Orbitron'] font-bold text-base sm:text-lg text-[#f0fff4] hover:text-[#c8ff00] cursor-pointer disabled:opacity-50"
                >
                  {digit}
                </button>
              ))}

              {/* Clear Button */}
              <button
                type="button"
                onClick={handleClear}
                disabled={status === 'verifying' || status === 'granted' || pin.length === 0}
                className="liquid-glass-button h-12 sm:h-14 rounded-2xl flex items-center justify-center font-['JetBrains_Mono'] text-[11px] font-bold text-[#3d7a52] hover:text-[#ff4060] cursor-pointer disabled:opacity-40"
              >
                CLEAR
              </button>

              {/* 0 Button */}
              <button
                type="button"
                onClick={() => handleKeyPress('0')}
                disabled={status === 'verifying' || status === 'granted'}
                className="liquid-glass-button h-12 sm:h-14 rounded-2xl flex items-center justify-center font-['Orbitron'] font-bold text-base sm:text-lg text-[#f0fff4] hover:text-[#c8ff00] cursor-pointer disabled:opacity-50"
              >
                0
              </button>

              {/* Backspace Button */}
              <button
                type="button"
                onClick={handleDelete}
                disabled={status === 'verifying' || status === 'granted' || pin.length === 0}
                className="liquid-glass-button h-12 sm:h-14 rounded-2xl flex items-center justify-center text-[#3d7a52] hover:text-[#00ffd5] cursor-pointer disabled:opacity-40"
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>

            {/* Action Controls: Submit Button & Mask/Reveal & Forgot PIN */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => handleVerify(pin)}
                disabled={status === 'verifying' || status === 'granted' || pin.length === 0}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#c8ff00] via-[#7fff50] to-[#00ffd5] text-[#020d06] font-['Orbitron'] font-black text-sm tracking-wider hover:shadow-[0_0_35px_rgba(200,255,0,0.6)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:hover:shadow-none"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>AUTHENTICATE & ENTER</span>
              </button>

              <div className="flex items-center justify-between pt-1 text-[11px] font-['JetBrains_Mono']">
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="text-[#3d7a52] hover:text-[#00ffd5] transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showPin ? 'MASK INPUT' : 'SHOW INPUT'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsForgotOpen(true);
                    setForgotStep('question');
                    setSecurityAnswer('');
                    setSecurityError(null);
                  }}
                  className="text-[#ffbd2e] hover:text-[#c8ff00] transition-colors flex items-center gap-1.5 cursor-pointer font-bold"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>FORGOT PIN?</span>
                </button>
              </div>
            </div>
          </>
        )}

        {/* Footer Security Watermark */}
        <div className="mt-6 pt-4 border-t border-[#0f3320]/60 flex items-center justify-between text-[9px] font-['JetBrains_Mono'] text-[#2a5038]">
          <span>GATEWAY: ZERO-TRACE SEC-L4</span>
          <span>SYSTEM VER: 4.2.0</span>
        </div>
      </div>
    </div>
  );
};
