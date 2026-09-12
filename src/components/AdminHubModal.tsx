import React from 'react';
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
  Server
} from 'lucide-react';

interface AdminHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPinManagement: () => void;
  onSelectApiAutomation: () => void;
  onLockAdmin: () => void;
  apiCount: number;
}

export const AdminHubModal: React.FC<AdminHubModalProps> = ({
  isOpen,
  onClose,
  onSelectPinManagement,
  onSelectApiAutomation,
  onLockAdmin,
  apiCount = 5
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-[#020d06]/85 backdrop-blur-md animate-fade-in overflow-y-auto overscroll-contain min-h-[100dvh]"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-2xl max-h-[92dvh] bg-[#071510] border-2 border-[#1a5c35] rounded-2xl sm:rounded-3xl shadow-[0_0_50px_rgba(0,255,213,0.25)] flex flex-col overflow-y-auto overscroll-contain my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HUD Corners */}
        <span className="hud-corner hud-tl" />
        <span className="hud-corner hud-tr" />
        <span className="hud-corner hud-bl" />
        <span className="hud-corner hud-br" />

        {/* Modal Header */}
        <div className="flex items-center justify-between p-3.5 sm:p-5 border-b border-[#0f3320] bg-[#020d06]/70 sticky top-0 z-10 backdrop-blur-md">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#020d06] border border-[#00ffd5] flex items-center justify-center text-[#00ffd5] shadow-[0_0_15px_rgba(0,255,213,0.3)] shrink-0">
              <ShieldCheck className="w-5 h-5 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h3 className="font-['Orbitron'] text-sm sm:text-lg font-black text-[#f0fff4] uppercase tracking-wider truncate">
                  ADMIN CONTROL HUB
                </h3>
                <span className="px-1.5 sm:px-2 py-0.5 rounded bg-[#00ffd5]/15 border border-[#00ffd5]/40 text-[#00ffd5] font-['JetBrains_Mono'] text-[8px] sm:text-[9px] uppercase font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00ffd5] animate-ping" />
                  <span>ACTIVE</span>
                </span>
              </div>
              <p className="font-['JetBrains_Mono'] text-[9px] sm:text-[11px] text-[#3d7a52] uppercase truncate">
                AUTHENTICATED VIA MONGODB DATABASE
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={onLockAdmin}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-[#020d06] hover:bg-[#1a0509] border border-[#0f3320] hover:border-[#ff4060] text-[#3d7a52] hover:text-[#ff4060] transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-['JetBrains_Mono'] uppercase touch-manipulation min-h-[38px]"
              title="Lock Admin session"
            >
              <Lock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">LOCK</span>
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

        {/* Modal Content - Two Core Admin Options */}
        <div className="p-4 sm:p-6 space-y-4">
          <div className="text-center sm:text-left">
            <h4 className="font-['Orbitron'] text-xs uppercase font-bold text-[#c8ff00] tracking-wider">
              AUTHORIZED OPERATIONS
            </h4>
            <p className="font-['JetBrains_Mono'] text-[11px] text-[#3d7a52] mt-0.5">
              Choose an administrative module to configure security credentials or automated API integrations:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* OPTION 1: PIN MANAGEMENT */}
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
                    KEYS & ACCESS
                  </span>
                </div>

                <div>
                  <h5 className="font-['Orbitron'] text-sm sm:text-base font-bold text-[#f0fff4] group-hover:text-[#c8ff00] transition-colors flex items-center gap-1.5">
                    <span>PIN MANAGEMENT</span>
                  </h5>
                  <p className="font-['JetBrains_Mono'] text-[11px] text-[#7fff50] mt-1.5 leading-relaxed">
                    Issue time-limited expiring security PINs (5m, 15m, 1h, 24h), revoke keys instantly, and monitor permanent system credentials & access gates.
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

            {/* OPTION 2: API AUTOMATION */}
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
                    {apiCount} ACTIVE APIS
                  </span>
                </div>

                <div>
                  <h5 className="font-['Orbitron'] text-sm sm:text-base font-bold text-[#f0fff4] group-hover:text-[#00ffd5] transition-colors flex items-center gap-1.5">
                    <span>API AUTOMATION</span>
                  </h5>
                  <p className="font-['JetBrains_Mono'] text-[11px] text-[#7fff50] mt-1.5 leading-relaxed">
                    Automated JSON structure analysis, dynamic request headers, parameter mappings, live payload test bench, and custom key configuration.
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
          </div>

          {/* Database Security Info Banner */}
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
        <div className="p-3 sm:p-4 border-t border-[#0f3320] bg-[#020d06]/60 flex items-center justify-between text-xs font-['JetBrains_Mono'] text-[#3d7a52]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00ffd5] animate-pulse" />
            <span>SESSION VALIDATED</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-[#020d06] border border-[#1a5c35] hover:border-[#00ffd5] text-[#f0fff4] hover:text-[#00ffd5] text-xs transition-colors cursor-pointer"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
