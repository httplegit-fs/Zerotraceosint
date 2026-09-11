import React, { useState, useEffect } from 'react';
import { Terminal, Shield, Cpu, Wifi, Radio, Server, Database, Lock, Search, Zap } from 'lucide-react';

interface HackerLoadingScreenProps {
  target: string;
}

const HACKER_STAGES = [
  { step: '01', title: 'ESTABLISHING SECURE SS7 / HLR TUNNEL', icon: Wifi, desc: 'Connecting to telecom signaling gateway node...' },
  { step: '02', title: 'INTERCEPTING MSC CARRIER REGISTRY', icon: Server, desc: 'Bypassing carrier rate-limit & querying subscriber node...' },
  { step: '03', title: 'EXTRACTING KYC & IDENTITY METADATA', icon: Database, desc: 'Deciphering name, father name & address hashes...' },
  { step: '04', title: 'MATCHING AADHAAR & ALT LINKAGES', icon: Shield, desc: 'Resolving secondary mobile lines & circle routing...' },
  { step: '05', title: 'ASSEMBLING ENCRYPTED DOSSIER MATRIX', icon: Cpu, desc: 'Formatting verified intelligence payload...' }
];

const HEX_CHARS = '0123456789ABCDEF!@#$%^&*<>[]{}';

export const HackerLoadingScreen: React.FC<HackerLoadingScreenProps> = ({ target }) => {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [hexStream, setHexStream] = useState<string[]>([]);
  const [glitchText, setGlitchText] = useState('DECRYPTING_STREAM');

  // Exact 3-second (3000ms) calibrated progress & stage transition
  useEffect(() => {
    const startTime = Date.now();
    const totalDuration = 3000;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const calculatedProgress = Math.min(Math.floor((elapsed / totalDuration) * 100), 100);
      setProgress(calculatedProgress);
      setElapsedSeconds(Math.min(Number((elapsed / 1000).toFixed(1)), 3.0));

      if (elapsed < 600) {
        setCurrentStageIndex(0);
      } else if (elapsed < 1200) {
        setCurrentStageIndex(1);
      } else if (elapsed < 1850) {
        setCurrentStageIndex(2);
      } else if (elapsed < 2450) {
        setCurrentStageIndex(3);
      } else {
        setCurrentStageIndex(4);
      }

      if (elapsed >= totalDuration) {
        clearInterval(interval);
      }
    }, 40);

    return () => clearInterval(interval);
  }, []);

  // Hex stream generator effect
  useEffect(() => {
    const hexInterval = setInterval(() => {
      const line = Array.from({ length: 8 }, () => {
        const seg = Array.from({ length: 4 }, () => HEX_CHARS[Math.floor(Math.random() * HEX_CHARS.length)]).join('');
        return `0x${seg}`;
      }).join(' ');
      setHexStream((prev) => [line, ...prev.slice(0, 4)]);
    }, 100);

    return () => clearInterval(hexInterval);
  }, []);

  // Glitch text effect
  useEffect(() => {
    const glitchInterval = setInterval(() => {
      const words = [
        'INITIALIZING_SS7_FRAMEWORK',
        'QUERYING_HLR_DATABASE',
        'DECRYPTING_SUBSCRIBER_PAYLOAD',
        'ROUTING_ENCRYPTED_PACKETS',
        'SYNCING_KYC_DOSSIER'
      ];
      const pick = words[Math.floor(Math.random() * words.length)];
      setGlitchText(pick);
    }, 350);

    return () => clearInterval(glitchInterval);
  }, []);

  const activeStage = HACKER_STAGES[currentStageIndex] || HACKER_STAGES[0];
  const StageIcon = activeStage.icon;

  return (
    <div className="relative overflow-hidden bg-[#020d06] border-2 border-[#1a5c35] rounded-2xl p-6 sm:p-8 shadow-[0_0_50px_rgba(0,255,213,0.15)] my-2">
      {/* Background Matrix Scanline Grid */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#00ffd5_1px,transparent_1px)] [background-size:16px_16px]" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#00ffd5]/5 to-transparent animate-pulse pointer-events-none" />

      {/* HUD Corner Accents */}
      <span className="hud-corner hud-tl" />
      <span className="hud-corner hud-tr" />
      <span className="hud-corner hud-bl" />
      <span className="hud-corner hud-br" />

      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#0f3320] relative z-10">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-[#071510] border border-[#00ffd5] text-[#00ffd5] shadow-[0_0_15px_rgba(0,255,213,0.3)]">
            <Radio className="w-5 h-5 animate-spin" style={{ animationDuration: '3s' }} />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#c8ff00] animate-ping" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-[#00ffd5]/10 border border-[#00ffd5]/40 text-[#00ffd5] font-['JetBrains_Mono'] text-[10px] font-bold uppercase tracking-wider">
                LIVE RECON (3.0s PROBE)
              </span>
              <span className="text-[#3d7a52] font-mono text-xs">•</span>
              <span className="font-['JetBrains_Mono'] text-xs text-[#c8ff00] tracking-widest font-bold">
                {glitchText}
              </span>
            </div>
            <h3 className="font-['Orbitron'] text-base sm:text-lg font-bold text-[#f0fff4] uppercase tracking-wide mt-0.5">
              TELECOM OSINT ENGINE // QUERYING TARGET:{' '}
              <span className="text-[#00ffd5] font-mono bg-[#071510] px-2 py-0.5 rounded border border-[#1a5c35]">
                {target || '9876543210'}
              </span>
            </h3>
          </div>
        </div>

        {/* Live Percentage & Countdown */}
        <div className="flex items-center gap-5 text-right">
          <div>
            <div className="font-['JetBrains_Mono'] text-[10px] text-[#3d7a52] uppercase tracking-wider">SCAN DURATION</div>
            <div className="font-['Orbitron'] text-sm font-bold text-[#00ffd5] tracking-wider font-mono">
              {elapsedSeconds.toFixed(1)}s / 3.0s
            </div>
          </div>
          <div>
            <div className="font-['JetBrains_Mono'] text-[10px] text-[#3d7a52] uppercase tracking-wider">COMPLETION</div>
            <div className="font-['Orbitron'] text-2xl font-black text-[#c8ff00] tracking-wider font-mono">
              {progress}%
            </div>
          </div>
        </div>
      </div>

      {/* Main Hacker Visualizer Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-6 relative z-10">
        {/* Left 7 Cols: Active Stage Radar & Step Visualizer */}
        <div className="lg:col-span-7 space-y-4">
          {/* Active Stage Banner */}
          <div className="bg-[#071510] border border-[#1a5c35] rounded-xl p-4 relative overflow-hidden shadow-inner">
            <div className="flex items-start gap-3.5">
              <div className="p-3 rounded-lg bg-[#020d06] border border-[#00ffd5]/40 text-[#00ffd5] shrink-0">
                <StageIcon className="w-6 h-6 animate-pulse text-[#c8ff00]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between text-[11px] font-['JetBrains_Mono'] text-[#3d7a52] mb-1">
                  <span>STAGE {activeStage.step} OF 05</span>
                  <span className="text-[#00ffd5] font-bold animate-pulse">EXECUTING IN SECURE SANDBOX</span>
                </div>
                <h4 className="font-['Orbitron'] text-sm sm:text-base font-bold text-[#f0fff4] uppercase tracking-wide truncate">
                  {activeStage.title}
                </h4>
                <p className="font-['JetBrains_Mono'] text-xs text-[#7fff50] mt-1">
                  {activeStage.desc}
                </p>
              </div>
            </div>
          </div>

          {/* Sequential Stage Step Indicators */}
          <div className="space-y-2">
            {HACKER_STAGES.map((stg, idx) => {
              const isPast = idx < currentStageIndex;
              const isCurrent = idx === currentStageIndex;
              return (
                <div
                  key={stg.step}
                  className={`flex items-center justify-between px-3.5 py-2 rounded-lg border transition-all ${
                    isCurrent
                      ? 'bg-[#0a1e12] border-[#c8ff00] text-[#f0fff4] shadow-[0_0_15px_rgba(200,255,0,0.15)]'
                      : isPast
                      ? 'bg-[#041209] border-[#1a5c35] text-[#3d7a52]'
                      : 'bg-[#020d06] border-[#0f3320] text-[#1f402b]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`font-['Orbitron'] text-xs font-bold ${
                        isCurrent ? 'text-[#c8ff00]' : isPast ? 'text-[#00ffd5]' : 'text-[#1f402b]'
                      }`}
                    >
                      {stg.step}
                    </span>
                    <span className="font-['JetBrains_Mono'] text-xs uppercase font-medium truncate">
                      {stg.title}
                    </span>
                  </div>
                  <span className="font-['JetBrains_Mono'] text-[10px] uppercase font-bold shrink-0">
                    {isPast ? (
                      <span className="text-[#00ffd5]">✓ COMPLETED</span>
                    ) : isCurrent ? (
                      <span className="text-[#c8ff00] animate-pulse">RUNNING...</span>
                    ) : (
                      <span className="text-[#23422e]">PENDING</span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 5 Cols: Live Hex Matrix & Packet Telemetry */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
          {/* Hex Stream Console */}
          <div className="bg-[#020d06] border border-[#0f3320] rounded-xl p-3.5 font-mono text-[11px] space-y-1.5 shadow-inner">
            <div className="flex items-center justify-between pb-1.5 border-b border-[#0f3320] text-[10px] text-[#3d7a52]">
              <span className="flex items-center gap-1.5">
                <Terminal className="w-3 h-3 text-[#00ffd5]" />
                <span>PACKET INTERCEPTION STREAM</span>
              </span>
              <span className="text-[#00ffd5] font-bold">256-BIT AES</span>
            </div>
            <div className="space-y-1 text-[#00ffd5]/80 font-mono tracking-wider overflow-hidden">
              {hexStream.map((line, i) => (
                <div key={i} className={`truncate ${i === 0 ? 'text-[#c8ff00] font-bold' : 'text-[#00ffd5]/60'}`}>
                  &gt; {line}
                </div>
              ))}
            </div>
          </div>

          {/* Target Attribute Radar Box */}
          <div className="bg-[#071510] border border-[#1a5c35] rounded-xl p-3.5 space-y-2 font-['JetBrains_Mono'] text-xs">
            <div className="text-[10px] text-[#3d7a52] uppercase flex items-center justify-between">
              <span>ACTIVE TELECOM PROBE</span>
              <span className="text-[#c8ff00] flex items-center gap-1">
                <Zap className="w-3 h-3 text-[#c8ff00] animate-pulse" /> HLR LIVE
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="bg-[#020d06] p-2 rounded border border-[#0f3320]">
                <div className="text-[#3d7a52] text-[9px]">TARGET NUMBER</div>
                <div className="text-[#00ffd5] font-bold font-mono truncate">{target || '9876543210'}</div>
              </div>
              <div className="bg-[#020d06] p-2 rounded border border-[#0f3320]">
                <div className="text-[#3d7a52] text-[9px]">ROUTING GATEWAY</div>
                <div className="text-[#c8ff00] font-bold font-mono">DADDY_KEY_V2</div>
              </div>
              <div className="bg-[#020d06] p-2 rounded border border-[#0f3320]">
                <div className="text-[#3d7a52] text-[9px]">ENCRYPTION</div>
                <div className="text-[#7fff50] font-bold font-mono">SSL/TLS 1.3</div>
              </div>
              <div className="bg-[#020d06] p-2 rounded border border-[#0f3320]">
                <div className="text-[#3d7a52] text-[9px]">PROXY TUNNEL</div>
                <div className="text-[#00ffd5] font-bold font-mono">ENCRYPTED</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cyber Progress Bar with Neon Glow */}
      <div className="space-y-2 relative z-10 pt-2 border-t border-[#0f3320]">
        <div className="flex items-center justify-between text-xs font-['JetBrains_Mono']">
          <span className="text-[#3d7a52] flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-[#00ffd5]" />
            <span>DECRYPTING TELECOM DOSSIER PAYLOAD...</span>
          </span>
          <span className="text-[#c8ff00] font-mono font-bold">
            {progress}% / 100%
          </span>
        </div>
        <div className="w-full h-2.5 bg-[#020d06] rounded-full overflow-hidden border border-[#1a5c35] p-0.5">
          <div
            className="h-full bg-gradient-to-r from-[#00ffd5] via-[#7fff50] to-[#c8ff00] rounded-full transition-all duration-200 shadow-[0_0_12px_rgba(200,255,0,0.6)]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
