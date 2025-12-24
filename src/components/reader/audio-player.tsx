'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Repeat,
  RepeatOne,
  Shuffle,
  Heart,
  Bookmark,
  Settings,
  Maximize2,
  Minimize2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { calculateAudioProgress } from '@/lib/utils/reading-progress'

interface AudioChapter {
  id: string
  title: string
  duration: number
  url: string
}

interface AudioPlayerProps {
  bookId: string
  chapters: AudioChapter[]
  initialChapterIndex?: number
  initialTime?: number
  onProgress?: (chapterIndex: number, currentTime: number, duration: number) => void
  onComplete?: () => void
  onChapterChange?: (chapterIndex: number) => void
  className?: string
}

export function AudioPlayer({
  bookId,
  chapters,
  initialChapterIndex = 0,
  initialTime = 0,
  onProgress,
  onComplete,
  onChapterChange,
  className
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentChapterIndex, setCurrentChapterIndex] = useState(initialChapterIndex)
  const [currentTime, setCurrentTime] = useState(initialTime)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [repeatMode, setRepeatMode] = useState<'none' | 'one' | 'all'>('none')
  const [isShuffle, setIsShuffle] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  const currentChapter = chapters[currentChapterIndex]
  const progress = calculateAudioProgress(currentTime, duration)

  // Auto-save progress every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (isPlaying && currentChapter && duration > 0) {
        onProgress?.(currentChapterIndex, currentTime, duration)
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [isPlaying, currentChapterIndex, currentTime, duration, onProgress])

  // Format time to mm:ss
  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }, [])

  // Load and play audio
  const loadChapter = useCallback(async (chapterIndex: number) => {
    if (chapterIndex < 0 || chapterIndex >= chapters.length) return

    setIsLoading(true)
    try {
      if (audioRef.current) {
        audioRef.current.src = chapters[chapterIndex].url
        audioRef.current.load()
      }
      setCurrentChapterIndex(chapterIndex)
      setCurrentTime(0)
      onChapterChange?.(chapterIndex)
    } catch (error) {
      console.error('Error loading chapter:', error)
    } finally {
      setIsLoading(false)
    }
  }, [chapters, onChapterChange])

  // Toggle play/pause
  const togglePlayPause = useCallback(async () => {
    if (!audioRef.current || !currentChapter) return

    try {
      if (isPlaying) {
        audioRef.current.pause()
        setIsPlaying(false)
      } else {
        await audioRef.current.play()
        setIsPlaying(true)
      }
    } catch (error) {
      console.error('Error playing audio:', error)
    }
  }, [isPlaying, currentChapter])

  // Skip to time
  const seekTo = useCallback((time: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time[0]
      setCurrentTime(time[0])
    }
  }, [])

  // Skip backward/forward
  const skip = useCallback((seconds: number) => {
    if (audioRef.current) {
      const newTime = Math.max(0, Math.min(duration, currentTime + seconds))
      audioRef.current.currentTime = newTime
      setCurrentTime(newTime)
    }
  }, [currentTime, duration])

  // Previous/Next chapter
  const previousChapter = useCallback(() => {
    if (currentTime > 3) {
      // If more than 3 seconds into current chapter, restart it
      seekTo([0])
    } else {
      // Otherwise go to previous chapter
      const prevIndex = currentChapterIndex - 1
      if (prevIndex >= 0) {
        loadChapter(prevIndex)
      }
    }
  }, [currentTime, currentChapterIndex, seekTo, loadChapter])

  const nextChapter = useCallback(() => {
    let nextIndex: number

    if (isShuffle) {
      // Random chapter
      do {
        nextIndex = Math.floor(Math.random() * chapters.length)
      } while (nextIndex === currentChapterIndex && chapters.length > 1)
    } else {
      // Next chapter
      nextIndex = currentChapterIndex + 1
    }

    if (nextIndex < chapters.length) {
      loadChapter(nextIndex)
    } else if (repeatMode === 'all') {
      loadChapter(0)
    } else {
      // End of book
      setIsPlaying(false)
      onComplete?.()
    }
  }, [currentChapterIndex, chapters, isShuffle, repeatMode, loadChapter, onComplete])

  // Volume controls
  const handleVolumeChange = useCallback((newVolume: number[]) => {
    const vol = newVolume[0]
    setVolume(vol)
    if (audioRef.current) {
      audioRef.current.volume = vol
    }
    setIsMuted(vol === 0)
  }, [])

  const toggleMute = useCallback(() => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume
        setIsMuted(false)
      } else {
        audioRef.current.volume = 0
        setIsMuted(true)
      }
    }
  }, [isMuted, volume])

  // Playback rate
  const changePlaybackRate = useCallback((rate: number) => {
    setPlaybackRate(rate)
    if (audioRef.current) {
      audioRef.current.playbackRate = rate
    }
  }, [])

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(!isFullscreen)
  }, [isFullscreen])

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleLoadedMetadata = () => {
      setDuration(audio.duration)
      if (initialTime > 0) {
        audio.currentTime = initialTime
        setCurrentTime(initialTime)
      }
    }

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
    }

    const handleEnded = () => {
      if (repeatMode === 'one') {
        audio.currentTime = 0
        audio.play()
      } else {
        nextChapter()
      }
    }

    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [repeatMode, nextChapter, initialTime])

  // Load initial chapter
  useEffect(() => {
    if (chapters.length > 0) {
      loadChapter(initialChapterIndex)
    }
  }, [chapters, initialChapterIndex, loadChapter])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement) return

      switch (event.key) {
        case ' ':
          event.preventDefault()
          togglePlayPause()
          break
        case 'ArrowLeft':
          event.preventDefault()
          skip(-10)
          break
        case 'ArrowRight':
          event.preventDefault()
          skip(30)
          break
        case 'ArrowUp':
          event.preventDefault()
          handleVolumeChange([Math.min(1, volume + 0.1)])
          break
        case 'ArrowDown':
          event.preventDefault()
          handleVolumeChange([Math.max(0, volume - 0.1)])
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [togglePlayPause, skip, handleVolumeChange, volume])

  return (
    <div className={cn("flex flex-col", className)}>
      <audio ref={audioRef} preload="metadata" />

      {/* Main Player */}
      <Card className="w-full">
        <CardContent className="p-6">
          {/* Chapter Info */}
          <div className="mb-6">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1 line-clamp-2">
                  {currentChapter?.title || 'Unknown Chapter'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Chapter {currentChapterIndex + 1} of {chapters.length}
                </p>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsFavorite(!isFavorite)}
                  className={isFavorite ? "text-red-500" : ""}
                >
                  <Heart className={cn("h-4 w-4", isFavorite && "fill-current")} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsBookmarked(!isBookmarked)}
                  className={isBookmarked ? "text-primary" : ""}
                >
                  <Bookmark className={cn("h-4 w-4", isBookmarked && "fill-current")} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSettings(!showSettings)}
                >
                  <Settings className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleFullscreen}
                >
                  {isFullscreen ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <Slider
                value={[currentTime]}
                onValueChange={seekTo}
                max={duration}
                step={1}
                className="w-full"
                disabled={isLoading}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRepeatMode(
                repeatMode === 'none' ? 'all' : repeatMode === 'all' ? 'one' : 'none'
              )}
              className={repeatMode !== 'none' ? 'text-primary' : ''}
            >
              {repeatMode === 'one' ? (
                <RepeatOne className="h-4 w-4" />
              ) : (
                <Repeat className="h-4 w-4" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsShuffle(!isShuffle)}
              className={isShuffle ? 'text-primary' : ''}
            >
              <Shuffle className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={previousChapter}
              disabled={currentChapterIndex === 0 && currentTime <= 3}
            >
              <SkipBack className="h-4 w-4" />
            </Button>

            <Button
              onClick={togglePlayPause}
              disabled={isLoading || !currentChapter}
              size="lg"
              className="w-12 h-12 rounded-full"
            >
              {isLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4 ml-1" />
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={nextChapter}
              disabled={currentChapterIndex === chapters.length - 1 && repeatMode !== 'all'}
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>

          {/* Volume and Speed */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMute}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>
              <div className="w-24">
                <Slider
                  value={[isMuted ? 0 : volume]}
                  onValueChange={handleVolumeChange}
                  max={1}
                  step={0.1}
                  className="w-full"
                />
              </div>
            </div>

            <Badge variant="secondary">
              {playbackRate}x
            </Badge>
          </div>

          {/* Settings Panel */}
          {showSettings && (
            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-3">Playback Speed</h4>
              <div className="flex gap-2">
                {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                  <Button
                    key={rate}
                    variant={playbackRate === rate ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => changePlaybackRate(rate)}
                  >
                    {rate}x
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Chapter List (Fullscreen) */}
          {isFullscreen && (
            <div className="mt-6 border-t pt-6">
              <h4 className="font-medium mb-3">Chapters</h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {chapters.map((chapter, index) => (
                  <Button
                    key={chapter.id}
                    variant={index === currentChapterIndex ? 'default' : 'ghost'}
                    className="w-full justify-start"
                    onClick={() => loadChapter(index)}
                  >
                    <div className="text-left">
                      <div className="font-medium">{chapter.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatTime(chapter.duration)}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}