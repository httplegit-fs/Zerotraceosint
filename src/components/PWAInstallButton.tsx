import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-2 rounded-lg bg-[#c8ff00] hover:bg-[#d8ff33] px-4 py-2 text-sm font-['Orbitron'] font-bold uppercase text-[#020d06] shadow-[0_0_15px_rgba(200,255,0,0.3)] transition-all"
      >
        <Download className="w-4 h-4" />
        Install App
      </button>
    );
  }

  // iOS Safari flow (beforeinstallprompt is not supported by WebKit)
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-2 rounded-lg bg-[#071510] border border-[#00ffd5]/40 hover:border-[#00ffd5] px-4 py-2 text-sm font-['Orbitron'] font-bold uppercase text-[#00ffd5] transition-all"
        >
          <Smartphone className="w-4 h-4" />
          Install iOS App
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#010804]/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-2xl border border-[#1a5c35] bg-[#020d06] p-6 shadow-[0_0_30px_rgba(0,255,213,0.15)] text-center relative">
               <span className="hud-corner hud-tl" />
               <span className="hud-corner hud-tr" />
               <span className="hud-corner hud-bl" />
               <span className="hud-corner hud-br" />
              <h3 className="font-['Orbitron'] text-lg font-bold text-[#f0fff4] mb-3">Install on iPhone / iPad</h3>
              <div className="text-sm font-['JetBrains_Mono'] text-[#3d7a52] text-left bg-[#041209] p-4 rounded-xl border border-[#0f3320] space-y-3">
                <p>1. Tap the <strong className="text-[#00ffd5]">Share</strong> button in Safari toolbar.</p>
                <p>2. Scroll down and tap <strong className="text-[#c8ff00]">Add to Home Screen</strong>.</p>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-[#00ffd5] py-2.5 text-sm font-['Orbitron'] font-bold text-[#020d06] hover:shadow-[0_0_15px_rgba(0,255,213,0.4)] transition-all uppercase"
              >
                Close Guide
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
