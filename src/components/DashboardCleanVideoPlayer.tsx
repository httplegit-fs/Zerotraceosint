import React, { useState, useRef, useEffect } from 'react';
import { 
  Volume2, 
  VolumeX, 
  Radio, 
  ChevronLeft, 
  ChevronRight,
  AlertCircle
} from 'lucide-react';

export interface CloudinaryVideoItem {
  id: string;
  title: string;
  url: string;
}

export const DEFAULT_CLOUDINARY_VIDEOS: CloudinaryVideoItem[] = [
  {
    id: 'vid-1',
    title: 'STREAM 01',
    url: 'https://res.cloudinary.com/qkmxsd52/video/upload/v1789227656/video_2026-09-12_15-31-19.mp4'
  },
  {
    id: 'vid-2',
    title: 'STREAM 02',
    url: 'https://res.cloudinary.com/demo/video/upload/v1689083321/samples/cld-sample-video.mp4'
  },
  {
    id: 'vid-3',
    title: 'STREAM 03',
    url: 'https://res.cloudinary.com/demo/video/upload/sea_turtle.mp4'
  }
];

export const DashboardCleanVideoPlayer: React.FC = () => {
  // 3 Cloudinary Videos Playlist
  const [videos] = useState<CloudinaryVideoItem[]>(DEFAULT_CLOUDINARY_VIDEOS);

  // Current video index (0, 1, or 2)
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  // Default page open = UNMUTED (isMuted: false)
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const bgVideoRef = useRef<HTMLVideoElement | null>(null);

  const activeVideo = videos[currentIndex] || videos[0];

  // Global Audio Unlock Listener (bypasses browser autoplay policy on first user gesture)
  useEffect(() => {
    const handleFirstUserGesture = () => {
      const video = videoRef.current;
      if (video) {
        video.muted = false;
        setIsMuted(false);
        setAutoplayBlocked(false);
        video.play().catch(() => {});
      }
      window.removeEventListener('click', handleFirstUserGesture);
      window.removeEventListener('touchstart', handleFirstUserGesture);
      window.removeEventListener('keydown', handleFirstUserGesture);
    };

    window.addEventListener('click', handleFirstUserGesture, { once: true });
    window.addEventListener('touchstart', handleFirstUserGesture, { once: true });
    window.addEventListener('keydown', handleFirstUserGesture, { once: true });

    return () => {
      window.removeEventListener('click', handleFirstUserGesture);
      window.removeEventListener('touchstart', handleFirstUserGesture);
      window.removeEventListener('keydown', handleFirstUserGesture);
    };
  }, []);

  // Play video with UNMUTED default audio whenever active video changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setHasError(false);
    video.muted = isMuted;

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setAutoplayBlocked(false);
        })
        .catch(() => {
          // If browser policy temporarily holds unmuted autoplay, fallback to muted until first gesture
          if (!isMuted) {
            video.muted = true;
            video.play()
              .then(() => {
                setAutoplayBlocked(true);
              })
              .catch(() => {});
          }
        });
    }

    if (bgVideoRef.current) {
      bgVideoRef.current.muted = true;
      bgVideoRef.current.play().catch(() => {});
    }
  }, [activeVideo.url, currentIndex]);

  // Handle Mute/Unmute Toggle
  const toggleMute = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!videoRef.current) return;

    const nextMuted = !isMuted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
    setAutoplayBlocked(false);

    if (bgVideoRef.current) {
      bgVideoRef.current.muted = true;
    }

    if (!nextMuted) {
      videoRef.current.play().catch(() => {});
    }
  };

  // Next Video Handler
  const handleNextVideo = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % videos.length);
  };

  // Previous Video Handler
  const handlePrevVideo = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + videos.length) % videos.length);
  };

  return (
    <div className="cyber-edge-beam-card rounded-2xl relative shadow-2xl overflow-hidden group select-none border-2 border-[#1a5c35] bg-[#020d06]">
      {/* Cyber HUD Corner Accents */}
      <span className="hud-corner hud-tl" />
      <span className="hud-corner hud-tr" />
      <span className="hud-corner hud-bl" />
      <span className="hud-corner hud-br" />

      {/* Main Video Viewport - Completely Clean */}
      <div 
        className="relative w-full h-[250px] sm:h-[340px] md:h-[400px] lg:h-[460px] flex items-center justify-center overflow-hidden cursor-pointer bg-[#010804]"
        onClick={() => toggleMute()}
        title="Tap to toggle audio"
      >
        {/* Ambient Blur Layer */}
        {!hasError && (
          <video
            ref={bgVideoRef}
            src={activeVideo.url}
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-25 scale-110 pointer-events-none"
            aria-hidden="true"
          />
        )}

        {/* Scanline Grid Background Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.1)_50%,rgba(0,0,0,0.45)_50%)] bg-[length:100%_4px] pointer-events-none z-[2]" />

        {/* Primary Foreground Video */}
        <video
          ref={videoRef}
          src={activeVideo.url}
          autoPlay
          loop
          muted={isMuted}
          playsInline
          onEnded={handleNextVideo}
          onError={() => setHasError(true)}
          className="relative z-10 max-h-full max-w-full object-contain mx-auto transition-transform duration-300 pointer-events-auto"
        />

        {/* Side Overlay Arrow Buttons for Fast Desktop/Mobile Navigation */}
        <button
          type="button"
          onClick={handlePrevVideo}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-9 h-12 sm:w-10 sm:h-14 rounded-xl bg-[#020d06]/70 hover:bg-[#020d06]/90 border border-[#00ffd5]/40 hover:border-[#00ffd5] text-[#00ffd5] flex items-center justify-center backdrop-blur-md transition-all duration-200 cursor-pointer shadow-xl opacity-80 hover:opacity-100 active:scale-95 touch-manipulation group/prev"
          title="Previous Video"
          aria-label="Previous video"
        >
          <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 group-hover/prev:-translate-x-0.5 transition-transform" />
        </button>

        <button
          type="button"
          onClick={handleNextVideo}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-9 h-12 sm:w-10 sm:h-14 rounded-xl bg-[#020d06]/70 hover:bg-[#020d06]/90 border border-[#00ffd5]/40 hover:border-[#00ffd5] text-[#00ffd5] flex items-center justify-center backdrop-blur-md transition-all duration-200 cursor-pointer shadow-xl opacity-80 hover:opacity-100 active:scale-95 touch-manipulation group/next"
          title="Next Video"
          aria-label="Next video"
        >
          <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 group-hover/next:translate-x-0.5 transition-transform" />
        </button>

        {/* Minimal Clean Live Feed Badge */}
        <div className="absolute top-3 left-3 z-20 flex items-center gap-2 pointer-events-none">
          <div className="px-2.5 py-1 rounded-lg bg-[#020d06]/85 border border-[#00ffd5]/40 backdrop-blur-md flex items-center gap-1.5 shadow-lg">
            <Radio className="w-3 h-3 text-[#00ffd5] animate-pulse" />
            <span className="font-['Orbitron'] text-[10px] sm:text-[11px] font-bold tracking-wider text-[#00ffd5]">
              LIVE STREAM {currentIndex + 1}/{videos.length}
            </span>
          </div>
        </div>



        {/* Minimal Bottom Right Volume Button (Default: UNMUTED) */}
        <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 z-20 flex items-center gap-2 pointer-events-auto">
          {autoplayBlocked && (
            <div className="animate-pulse px-2 py-1 rounded-lg bg-[#c8ff00]/20 border border-[#c8ff00]/50 text-[#c8ff00] font-['JetBrains_Mono'] text-[9px] uppercase font-bold flex items-center gap-1">
              <span>TAP TO UNMUTE</span>
            </div>
          )}

          <button
            type="button"
            onClick={toggleMute}
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center backdrop-blur-md transition-all duration-300 cursor-pointer shadow-lg active:scale-95 touch-manipulation ${
              isMuted
                ? 'bg-[#020d06]/70 hover:bg-[#020d06]/90 border border-[#ff4060]/50 hover:border-[#ff4060] text-[#ff4060]'
                : 'bg-[#c8ff00] hover:bg-[#d8ff33] border border-[#c8ff00] text-[#020d06] shadow-[0_0_15px_rgba(200,255,0,0.4)]'
            }`}
            title={isMuted ? "Click to Unmute Audio" : "Click to Mute Audio"}
            aria-label={isMuted ? "Unmute audio" : "Mute audio"}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 animate-pulse" />
            ) : (
              <Volume2 className="w-4 h-4 stroke-[2.5]" />
            )}
          </button>
        </div>

        {/* Fallback Display if video cannot load */}
        {hasError && (
          <div className="absolute inset-0 z-15 flex flex-col items-center justify-center p-6 bg-[#020d06]/95 backdrop-blur-md text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#071510] border border-[#c8ff00]/40 flex items-center justify-center text-[#c8ff00] mb-3 shadow-[0_0_20px_rgba(200,255,0,0.2)]">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h4 className="font-['Orbitron'] text-sm sm:text-base font-bold text-[#f0fff4] uppercase tracking-wider mb-1">
              STREAM OFFLINE
            </h4>
            <p className="font-['JetBrains_Mono'] text-xs text-[#3d7a52] max-w-md mb-4">
              Unable to load current video stream.
            </p>
            <button
              type="button"
              onClick={handleNextVideo}
              className="px-4 py-2 rounded-xl bg-[#c8ff00] text-[#020d06] font-['Orbitron'] font-bold text-xs uppercase cursor-pointer"
            >
              NEXT STREAM
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
