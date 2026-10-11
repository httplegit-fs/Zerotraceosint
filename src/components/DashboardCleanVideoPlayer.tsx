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
  // Cloudinary Videos Playlist (fetched from backend API with localStorage fallback)
  const [videos, setVideos] = useState<CloudinaryVideoItem[]>(() => {
    try {
      const saved = localStorage.getItem('cloudinary_stream_videos');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return DEFAULT_CLOUDINARY_VIDEOS;
  });

  // Current video index
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  // Default page open = UNMUTED (isMuted: false)
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const bgVideoRef = useRef<HTMLVideoElement | null>(null);

  // Fetch latest video streams from server API
  const fetchStreams = async () => {
    try {
      const res = await fetch('/api/video-streams');
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.videos) && data.videos.length > 0) {
          setVideos(data.videos);
          try {
            localStorage.setItem('cloudinary_stream_videos', JSON.stringify(data.videos));
          } catch (e) {}
        }
      }
    } catch (err) {
      // Graceful fallback to initial local state
    }
  };

  useEffect(() => {
    fetchStreams();

    const handleUpdate = () => {
      fetchStreams();
    };
    window.addEventListener('video-streams-updated', handleUpdate);
    const interval = setInterval(fetchStreams, 15000);

    return () => {
      window.removeEventListener('video-streams-updated', handleUpdate);
      clearInterval(interval);
    };
  }, []);

  // Safe active video calculation
  const safeIndex = currentIndex >= videos.length ? 0 : currentIndex;
  const activeVideo = videos[safeIndex] || videos[0] || DEFAULT_CLOUDINARY_VIDEOS[0];


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

    try {
      video.load();
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setAutoplayBlocked(false);
          })
          .catch(() => {
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
    } catch {
      // Ignore synchronous load errors
    }

    if (bgVideoRef.current) {
      bgVideoRef.current.muted = true;
      try {
        bgVideoRef.current.load();
        bgVideoRef.current.play().catch(() => {});
      } catch {}
    }
  }, [currentIndex, activeVideo.url]);

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
    setHasError(false);
    setCurrentIndex((prev) => (prev + 1) % videos.length);
  };

  // Previous Video Handler
  const handlePrevVideo = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setHasError(false);
    setCurrentIndex((prev) => (prev - 1 + videos.length) % videos.length);
  };

  return (
    <div className="cyber-edge-beam-card rounded-2xl relative shadow-2xl overflow-hidden group select-none border-2 border-[#1a5c35] bg-[#020d06]">
      {/* Cyber HUD Corner Accents */}
      <span className="hud-corner hud-tl" />
      <span className="hud-corner hud-tr" />
      <span className="hud-corner hud-bl" />
      <span className="hud-corner hud-br" />

      {/* Main Video Viewport */}
      <div 
        className="relative w-full h-[260px] sm:h-[350px] md:h-[420px] lg:h-[480px] flex items-center justify-center overflow-hidden cursor-pointer bg-[#010804]"
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

        {/* Side Overlay Arrow Buttons on Far Edges */}
        <button
          type="button"
          onClick={handlePrevVideo}
          className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full liquid-glass-pill text-[#00ffd5] flex items-center justify-center transition-all duration-200 cursor-pointer shadow-xl opacity-85 hover:opacity-100 active:scale-95 touch-manipulation group/prev"
          title="Previous Stream Video"
          aria-label="Previous stream"
        >
          <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 group-hover/prev:-translate-x-0.5 transition-transform" />
        </button>

        <button
          type="button"
          onClick={handleNextVideo}
          className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-11 sm:h-11 rounded-full liquid-glass-pill text-[#00ffd5] flex items-center justify-center transition-all duration-200 cursor-pointer shadow-xl opacity-85 hover:opacity-100 active:scale-95 touch-manipulation group/next"
          title="Next Stream Video"
          aria-label="Next stream"
        >
          <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 group-hover/next:translate-x-0.5 transition-transform" />
        </button>

        {/* Top Overlay Badges */}
        <div className="absolute top-3 inset-x-3 z-20 flex items-center justify-between gap-2 pointer-events-none">
          <div className="px-3 py-1.5 rounded-full liquid-glass-pill flex items-center gap-1.5 shadow-lg">
            <Radio className="w-3 h-3 text-[#00ffd5] animate-pulse" />
            <span className="font-['Orbitron'] text-[10px] sm:text-[11px] font-bold tracking-wider text-[#00ffd5]">
              LIVE STREAM {currentIndex + 1}/{videos.length}
            </span>
          </div>

          <div className="px-3 py-1.5 rounded-full liquid-glass-pill font-['Orbitron'] text-[10px] sm:text-[11px] font-bold text-[#c8ff00] tracking-wider uppercase shadow-lg">
            {activeVideo.title}
          </div>
        </div>

        {/* Bottom Control Strip Bar - Cleanly Separates Navigations (Left) & Sound Control (Right) */}
        <div className="absolute bottom-0 inset-x-0 z-20 p-2.5 sm:p-3 bg-gradient-to-t from-black/95 via-black/70 to-transparent flex items-center justify-between gap-2 pointer-events-auto">
          {/* LEFT SIDE: Stream Navigation Pills & Prev/Next Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <button
              type="button"
              onClick={handlePrevVideo}
              className="px-2.5 py-1.5 rounded-full liquid-glass-pill text-[#00ffd5] hover:text-[#c8ff00] font-['Orbitron'] text-[10px] font-bold uppercase transition-all flex items-center gap-1 cursor-pointer active:scale-95 touch-manipulation shrink-0"
              title="Previous Stream"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">PREV</span>
            </button>

            {/* Stream Selector Pills */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar touch-pan-x">
              {videos.map((vid, idx) => {
                const isActive = idx === currentIndex;
                return (
                  <button
                    key={vid.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setHasError(false);
                      setCurrentIndex(idx);
                    }}
                    className={`px-2.5 py-1 rounded-full font-['Orbitron'] text-[9px] sm:text-[10px] font-bold uppercase transition-all cursor-pointer whitespace-nowrap active:scale-95 touch-manipulation ${
                      isActive
                        ? 'bg-[#c8ff00] text-[#020d06] shadow-[0_0_12px_rgba(200,255,0,0.4)] border border-[#c8ff00]'
                        : 'bg-[#071510]/80 text-[#00ffd5] hover:text-[#f0fff4] border border-[#00ffd5]/30 hover:border-[#00ffd5]/60'
                    }`}
                  >
                    {vid.title}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleNextVideo}
              className="px-2.5 py-1.5 rounded-full liquid-glass-pill text-[#00ffd5] hover:text-[#c8ff00] font-['Orbitron'] text-[10px] font-bold uppercase transition-all flex items-center gap-1 cursor-pointer active:scale-95 touch-manipulation shrink-0"
              title="Next Stream"
            >
              <span className="hidden sm:inline">NEXT</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* RIGHT SIDE: Sound / Volume Mute Toggle Button */}
          <div className="flex items-center gap-2 shrink-0">
            {autoplayBlocked && (
              <div className="animate-pulse px-2 py-1 rounded-full liquid-glass-pill text-[#c8ff00] font-['JetBrains_Mono'] text-[9px] uppercase font-bold hidden sm:flex items-center gap-1">
                <span>TAP TO UNMUTE</span>
              </div>
            )}

            <button
              type="button"
              onClick={toggleMute}
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full liquid-glass-pill flex items-center justify-center transition-all duration-300 cursor-pointer shadow-lg active:scale-95 touch-manipulation ${
                isMuted ? 'text-[#ff4060] border-[#ff4060]/60 bg-[#25080e]/80' : 'text-[#c8ff00] border-[#c8ff00]/60 bg-[#072010]/80'
              }`}
              title={isMuted ? "Click to Unmute Audio" : "Click to Mute Audio"}
              aria-label={isMuted ? "Unmute audio" : "Mute audio"}
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 animate-pulse text-[#ff4060]" />
              ) : (
                <Volume2 className="w-4 h-4 stroke-[2.5] text-[#c8ff00]" />
              )}
            </button>
          </div>
        </div>

        {/* Fallback Display if video cannot load */}
        {hasError && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 bg-[#020d06]/95 backdrop-blur-md text-center">
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
