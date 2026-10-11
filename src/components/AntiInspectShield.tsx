import React, { useEffect, useState } from 'react';
import { ShieldAlert, Lock, AlertTriangle, X } from 'lucide-react';

interface AntiInspectShieldProps {
  enabled?: boolean;
}

export const AntiInspectShield: React.FC<AntiInspectShieldProps> = ({ enabled = true }) => {
  const [shieldTriggered, setShieldTriggered] = useState(false);
  const [alertReason, setAlertReason] = useState<string>('');

  useEffect(() => {
    if (!enabled) return;

    // 1. Block Context Menu (Right Click)
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      triggerAlert('RIGHT_CLICK_INSPECT_BLOCKED');
      return false;
    };

    // 2. Clear console silently to prevent data dumping (does not trigger UI alert)
    const consoleClearInterval = setInterval(() => {
      try {
        console.clear();
      } catch {}
    }, 4000);

    window.addEventListener('contextmenu', handleContextMenu, { capture: true });

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu, { capture: true });
      clearInterval(consoleClearInterval);
    };
  }, [enabled]);

  const triggerAlert = (reason: string) => {
    setAlertReason(reason);
    setShieldTriggered(true);
  };

  if (!shieldTriggered) return null;

  return (
    <div className="fixed bottom-6 right-4 sm:right-6 z-[100] max-w-sm w-[calc(100vw-2rem)] animate-fade-in select-none">
      <div className="relative rounded-2xl bg-[#071510]/95 border-2 border-[#ff4060] p-4 shadow-[0_0_40px_rgba(255,64,96,0.5)] backdrop-blur-xl">
        <span className="hud-corner hud-tl !border-[#ff4060]" />
        <span className="hud-corner hud-tr !border-[#ff4060]" />
        <span className="hud-corner hud-bl !border-[#ff4060]" />
        <span className="hud-corner hud-br !border-[#ff4060]" />

        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#1a0509] border border-[#ff4060] flex items-center justify-center text-[#ff4060] shrink-0 animate-pulse">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-['Orbitron'] text-xs sm:text-sm font-bold text-[#ff4060] uppercase tracking-wider">
                  ANTI-INSPECT SHIELD
                </h4>
                <span className="px-1.5 py-0.5 rounded bg-[#ff4060]/20 text-[#ff4060] border border-[#ff4060]/50 text-[9px] font-['JetBrains_Mono'] font-bold">
                  ACTIVE
                </span>
              </div>
              <p className="font-['JetBrains_Mono'] text-[11px] text-[#f0fff4] mt-1 leading-snug">
                Source inspect & API scraping are strictly prohibited by ZeroTrace defense protocol.
              </p>
              <div className="flex items-center gap-2 mt-2 font-['JetBrains_Mono'] text-[10px] text-[#ff4060]">
                <Lock className="w-3 h-3" />
                <span>VIOLATION: {alertReason}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShieldTriggered(false)}
            className="p-1 rounded-lg bg-[#020d06] hover:bg-[#1a0509] border border-[#ff4060]/50 text-[#ff4060] transition-colors cursor-pointer shrink-0"
            title="Dismiss security warning"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
