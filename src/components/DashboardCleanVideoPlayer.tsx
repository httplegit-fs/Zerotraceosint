import React, { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX, Radio, AlertCircle, Upload } from 'lucide-react';

interface DashboardCleanVideoPlayerProps {
  customSrc?: string;
}

export const DashboardCleanVideoPlayer: React.FC<DashboardCleanVideoPlayerProps> = ({
  customSrc = 'https://res.cloudinary.com/qkmxsd52/video/upload/v1789422703/lv_0_20260915031453.mp4',
}) => {
  const [videoSrc, setVideoSrc] = useState<string>(() => {
    return localStorage.getItem('zerotrace_custom_video_url') || customSrc;
  });
  const [isMuted, setIsMuted] = useState(true);
  const [, setIsPlaying] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [videoRatio, setVideoRatio] = useState<'landscape' | 'portrait' | 'square' | 'unknown'>('unknown');
  const [showQuickSourceMenu, setShowQuickSourceMenu] = useState(false);
  const [inputUrl, setInputUrl] = useState('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const bgVideoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Attempt autoplay safely
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = isMuted;
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsPlaying(true);
          setHasError(false);
        })
        .catch(() => {
          setIsPlaying(false);
        });
    }
  }, [videoSrc, isMuted]);

  // Handle Mute/Unmute Toggle
  const toggleMute = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!videoRef.current) return;

    const nextMuted = !isMuted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);

    if (bgVideoRef.current) {
      bgVideoRef.current.muted = true; // Background ambient stays muted
    }

    if (!nextMuted) {
      videoRef.current.play().catch(() => {});
    }
  };

  // Video Loaded Metadata to detect aspect ratio
  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    const { videoWidth, videoHeight } = videoRef.current;
    if (videoWidth > 0 && videoHeight > 0) {
      const ratio = videoWidth / videoHeight;
      if (ratio > 1.2) {
        setVideoRatio('landscape');
      } else if (ratio < 0.85) {
        setVideoRatio('portrait');
      } else {
        setVideoRatio('square');
      }
    }
    setHasError(false);
  };

  // Handle file upload preview directly in browser before GitHub commit
  const handleLocalFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setVideoSrc(objectUrl);
      setHasError(false);
      setShowQuickSourceMenu(false);
    }
  };

  const handleApplyCustomUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputUrl.trim()) {
      setVideoSrc(inputUrl.trim());
      localStorage.setItem('zerotrace_custom_video_url', inputUrl.trim());
      setHasError(false);
      setShowQuickSourceMenu(false);
    }
  };

  const handleResetToDefault = () => {
    localStorage.removeItem('zerotrace_custom_video_url');
    setVideoSrc('/video.mp4');
    setHasError(false);
    setShowQuickSourceMenu(false);
  };

  return (
    <div className="cyber-edge-beam-card rounded-2xl relative shadow-2xl overflow-hidden group select-none border-2 border-[#1a5c35] bg-[#020d06]">
      {/* Cyber HUD Corner Accents */}
      <span className="hud-corner hud-tl" />
      <span className="hud-corner hud-tr" />
      <span className="hud-corner hud-bl" />
      <span className="hud-corner hud-br" />

      {/* Main Video Viewport (No timeline, No native controls, Clean UI, Any Ratio) */}
      <div 
        className="relative w-full h-[240px] sm:h-[320px] md:h-[380px] lg:h-[440px] flex items-center justify-center overflow-hidden cursor-pointer bg-[#010804]"
        onClick={() => toggleMute()}
        title="Tap anywhere to toggle audio"
      >
        {/* Ambient Blur Layer for any aspect ratio (Landscape, Portrait, Square) */}
        {!hasError && (
          <video
            ref={bgVideoRef}
            src={videoSrc}
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-25 scale-110 pointer-events-none"
            aria-hidden="true"
          />
        )}

        {/* Scanline Grid Background Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.1)_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] pointer-events-none z-[2]" />

        {/* Primary Foreground Video: object-contain guarantees NO cropping on ANY ratio */}
        <video
          ref={videoRef}
          src={videoSrc}
          autoPlay
          loop
          muted={isMuted}
          playsInline
          onLoadedMetadata={handleLoadedMetadata}
          onError={() => setHasError(true)}
          className="relative z-10 max-h-full max-w-full object-contain mx-auto transition-transform duration-300 pointer-events-auto"
        />

        {/* Subtle Cyberpunk HUD Corner Badges & Ratio Telemetry */}
        <div className="absolute top-3 left-3 z-20 flex items-center gap-2 pointer-events-none">
          <div className="px-2.5 py-1 rounded-lg bg-[#020d06]/85 border border-[#00ffd5]/40 backdrop-blur-md flex items-center gap-1.5 shadow-lg">
            <Radio className="w-3 h-3 text-[#00ffd5] animate-pulse" />
            <span className="font-['Orbitron'] text-[10px] sm:text-[11px] font-bold tracking-wider text-[#00ffd5]">
              LIVE FEED
            </span>
          </div>

          <div className="hidden sm:flex items-center px-2 py-1 rounded-lg bg-[#020d06]/75 border border-[#1a5c35] text-[#3d7a52] font-['JetBrains_Mono'] text-[9px] uppercase backdrop-blur-md">
            <span>RATIO: {videoRatio.toUpperCase()}</span>
          </div>
        </div>

        {/* THE ONLY REQUIRED CONTROL: MUTE / UNMUTE BUTTON (MINIMAL ICON) */}
        <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 z-20">
          <button
            type="button"
            onClick={toggleMute}
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center backdrop-blur-md transition-all duration-300 cursor-pointer shadow-lg active:scale-95 touch-manipulation ${
              isMuted
                ? 'bg-[#020d06]/60 hover:bg-[#020d06]/80 border border-[#ff4060]/50 hover:border-[#ff4060] text-[#ff4060]'
                : 'bg-[#c8ff00]/90 hover:bg-[#c8ff00] border border-[#c8ff00] text-[#020d06]'
            }`}
            title={isMuted ? "Click to Unmute Audio" : "Click to Mute Audio"}
            aria-label={isMuted ? "Unmute video" : "Mute video"}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 animate-pulse" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Fallback Display if /public/video.mp4 is not yet committed to GitHub */}
        {hasError && (
          <div className="absolute inset-0 z-15 flex flex-col items-center justify-center p-6 bg-[#020d06]/95 backdrop-blur-md text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#071510] border border-[#c8ff00]/40 flex items-center justify-center text-[#c8ff00] mb-3 shadow-[0_0_20px_rgba(200,255,0,0.2)]">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h4 className="font-['Orbitron'] text-sm sm:text-base font-bold text-[#f0fff4] uppercase tracking-wider mb-1">
              READY FOR /public/video.mp4
            </h4>
            <p className="font-['JetBrains_Mono'] text-xs text-[#3d7a52] max-w-md mb-4">
              Apni video file ko GitHub repo ke <span className="text-[#00ffd5] font-bold">public/video.mp4</span> path par dalein. Live hote hi wo bina kisi code change ke yahan automatically chalne lagegi!
            </p>
            
            <div className="flex flex-wrap items-center justify-center gap-2">
              <label className="px-3.5 py-2 rounded-xl bg-[#c8ff00] hover:bg-[#d8ff33] text-[#020d06] font-['Orbitron'] font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(200,255,0,0.3)] cursor-pointer active:scale-95 touch-manipulation min-h-[40px]">
                <Upload className="w-3.5 h-3.5" />
                <span>SELECT LOCAL VIDEO TO TEST</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleLocalFileSelect}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={() => {
                  setVideoSrc('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');
                  setHasError(false);
                }}
                className="px-3 py-2 rounded-xl bg-[#071510] hover:bg-[#0a1e12] border border-[#00ffd5]/40 text-[#00ffd5] font-['JetBrains_Mono'] text-xs font-bold uppercase transition-all cursor-pointer active:scale-95 touch-manipulation min-h-[40px]"
              >
                TEST WITH SAMPLE STREAM
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Quick Source Modal / Popover */}
      {showQuickSourceMenu && (
        <div 
          className="p-4 border-t border-[#0f3320] bg-[#071510] space-y-3 animate-fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between">
            <span className="font-['Orbitron'] text-xs font-bold text-[#c8ff00] uppercase tracking-wider">
              VIDEO SOURCE CONFIGURATION
            </span>
            <button
              type="button"
              onClick={() => setShowQuickSourceMenu(false)}
              className="text-[#3d7a52] hover:text-[#ff4060] font-mono text-xs cursor-pointer"
            >
              [CLOSE]
            </button>
          </div>

          <form onSubmit={handleApplyCustomUrl} className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="Paste direct MP4 video URL or path (e.g. /video.mp4)"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl bg-[#020d06] border border-[#1a5c35] focus:border-[#00ffd5] text-xs text-[#f0fff4] font-mono outline-none"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[#00ffd5] text-[#020d06] font-['Orbitron'] text-xs font-bold uppercase hover:shadow-[0_0_15px_rgba(0,255,213,0.4)] cursor-pointer"
            >
              APPLY
            </button>
          </form>

          <div className="flex items-center gap-3 pt-1 text-[11px] font-['JetBrains_Mono'] text-[#3d7a52]">
            <span>Current: <span className="text-[#00ffd5] font-mono">{videoSrc}</span></span>
            {videoSrc !== '/video.mp4' && (
              <button
                type="button"
                onClick={handleResetToDefault}
                className="text-[#c8ff00] underline hover:text-[#d8ff33] cursor-pointer ml-auto"
              >
                Reset to /video.mp4
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
