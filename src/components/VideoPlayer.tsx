import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, SkipBack, SkipForward, RotateCcw } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  title?: string;
  onPlay?: () => void;
  onPlayingChange?: (isPlaying: boolean) => void;
  savedProgress?: number;
  onSaveProgress?: (progress: number, duration: number) => void;
  onClearProgress?: () => void;
}

export function VideoPlayer({
  src,
  poster,
  title,
  onPlay,
  onPlayingChange,
  savedProgress = 0,
  onSaveProgress,
  onClearProgress,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [hasShownResumeDialog, setHasShownResumeDialog] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();
  const saveProgressTimeoutRef = useRef<NodeJS.Timeout>();

  // Check for saved progress on mount
  useEffect(() => {
    if (savedProgress > 0 && !hasShownResumeDialog) {
      setShowResumeDialog(true);
      setHasShownResumeDialog(true);
    }
  }, [savedProgress, hasShownResumeDialog]);

  // Save progress periodically
  const saveCurrentProgress = useCallback(() => {
    const video = videoRef.current;
    if (!video || !onSaveProgress) return;
    
    onSaveProgress(video.currentTime, video.duration);
  }, [onSaveProgress]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      
      // Save progress every 10 seconds
      if (saveProgressTimeoutRef.current) {
        clearTimeout(saveProgressTimeoutRef.current);
      }
      saveProgressTimeoutRef.current = setTimeout(saveCurrentProgress, 10000);
    };
    
    const handleLoadedMetadata = () => setDuration(video.duration || 0);
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    
    const handlePlay = () => {
      setIsPlaying(true);
      onPlayingChange?.(true);
    };
    
    const handlePause = () => {
      setIsPlaying(false);
      onPlayingChange?.(false);
      // Save progress when paused
      saveCurrentProgress();
    };
    
    const handleEnded = () => {
      setIsPlaying(false);
      setShowControls(true);
      onPlayingChange?.(false);
      // Clear progress when video ends
      onClearProgress?.();
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      
      // Save progress when unmounting
      if (video.currentTime > 0) {
        saveCurrentProgress();
      }
    };
  }, [onPlayingChange, saveCurrentProgress, onClearProgress]);

  // Save progress when page is about to unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveCurrentProgress();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveCurrentProgress]);

  const handleResume = () => {
    const video = videoRef.current;
    if (video && savedProgress > 0) {
      video.currentTime = savedProgress;
    }
    setShowResumeDialog(false);
    togglePlay();
  };

  const handleStartOver = () => {
    const video = videoRef.current;
    if (video) {
      video.currentTime = 0;
    }
    onClearProgress?.();
    setShowResumeDialog(false);
    togglePlay();
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused || video.ended) {
      video.play().then(() => {
        onPlay?.();
      }).catch(error => {
        console.error('Video play error:', error);
        setIsPlaying(false);
      });
    } else {
      video.pause();
    }
  };

  const handlePlayClick = () => {
    // If there's saved progress and dialog hasn't been shown yet, show it
    if (savedProgress > 0 && !hasShownResumeDialog) {
      setShowResumeDialog(true);
      setHasShownResumeDialog(true);
      return;
    }
    togglePlay();
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  };

  const handleSeek = (value: number[]) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = value[0];
    setCurrentTime(value[0]);
  };

  const handleVolumeChange = (value: number[]) => {
    const video = videoRef.current;
    if (!video) return;
    const newVolume = value[0];
    video.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const skip = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(duration, video.currentTime + seconds));
  };

  const formatTime = (time: number) => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const resetControlsTimeout = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 5000);
  };

  const handleInteraction = () => {
    resetControlsTimeout();
  };

  return (
    <>
      <div
        ref={containerRef}
        className="relative w-full aspect-video bg-background rounded-none sm:rounded-lg overflow-hidden group isolate"
        onMouseMove={handleInteraction}
        onTouchStart={handleInteraction}
        onMouseLeave={() => isPlaying && setShowControls(false)}
      >
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          className="w-full h-full object-contain"
          preload="metadata"
          playsInline
          onClick={handlePlayClick}
        />

        {/* Play Button Overlay */}
        {!isPlaying && (
          <div
            className="absolute inset-0 flex items-center justify-center bg-background/30 cursor-pointer"
            onClick={handlePlayClick}
          >
            <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-primary/90 flex items-center justify-center hover:scale-110 transition-transform">
              <Play className="w-6 h-6 sm:w-8 sm:h-8 text-primary-foreground ml-1" fill="currentColor" />
            </div>
          </div>
        )}

        {/* Controls */}
        <div
          className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/90 to-transparent p-3 sm:p-4 pb-[max(12px,env(safe-area-inset-bottom))] transition-opacity duration-300 z-50 ${
            showControls ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* Progress Bar */}
          <div className="mb-3 sm:mb-4">
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={1}
              onValueChange={handleSeek}
              className="cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between gap-1">
            {/* Left Controls - Play button only on mobile */}
            <div className="flex items-center gap-1 min-w-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePlayClick}
                className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0"
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 sm:w-6 sm:h-6" />
                ) : (
                  <Play className="w-4 h-4 sm:w-6 sm:h-6" fill="currentColor" />
                )}
              </Button>

              {/* Skip buttons - hidden on mobile */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => skip(-10)}
                className="h-8 w-8 sm:h-10 sm:w-10 hidden sm:flex"
              >
                <SkipBack className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => skip(10)}
                className="h-8 w-8 sm:h-10 sm:w-10 hidden sm:flex"
              >
                <SkipForward className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </div>

            {/* Center - Time display (compact on mobile) */}
            <div className="flex-1 min-w-0 flex items-start justify-start">
              <span className="text-[10px] sm:text-sm text-muted-foreground whitespace-nowrap">
                {formatTime(currentTime)}
                <span className="hidden sm:inline"> / {formatTime(duration)}</span>
              </span>
            </div>

            {/* Right Controls - Fullscreen ALWAYS visible */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {title && (
                <span className="hidden lg:inline text-sm font-medium mr-2 max-w-xs truncate">
                  {title}
                </span>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleFullscreen}
                className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 bg-primary/20 hover:bg-primary/40"
              >
                {isFullscreen ? (
                  <Minimize className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  <Maximize className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Resume Dialog */}
      <AlertDialog open={showResumeDialog} onOpenChange={setShowResumeDialog}>
        <AlertDialogContent className="glass-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Tiếp tục xem?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn đã xem đến {formatTime(savedProgress)}. Bạn muốn tiếp tục xem hay bắt đầu lại từ đầu?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel onClick={handleStartOver} className="gap-2">
              <RotateCcw className="w-4 h-4" />
              Bắt đầu lại
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleResume} className="gap-2 bg-primary">
              <Play className="w-4 h-4" fill="currentColor" />
              Tiếp tục ({formatTime(savedProgress)})
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
