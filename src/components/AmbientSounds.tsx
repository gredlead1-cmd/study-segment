import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, CloudRain, Coffee, Radio, Wind, Music, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface Sound {
  id: string;
  name: string;
  icon: React.ElementType;
  url: string;
  color: string;
}

// Using free ambient sound URLs (royalty-free)
const sounds: Sound[] = [
  {
    id: 'rain',
    name: 'Rain',
    icon: CloudRain,
    url: 'https://cdn.pixabay.com/audio/2022/05/13/audio_257112181d.mp3',
    color: 'text-blue-400',
  },
  {
    id: 'lofi',
    name: 'Lo-Fi',
    icon: Music,
    url: 'https://cdn.pixabay.com/audio/2022/10/25/audio_946bc3eb4c.mp3',
    color: 'text-purple-400',
  },
  {
    id: 'cafe',
    name: 'Café',
    icon: Coffee,
    url: 'https://cdn.pixabay.com/audio/2022/03/10/audio_4dedf5bf84.mp3',
    color: 'text-amber-400',
  },
  {
    id: 'whitenoise',
    name: 'White Noise',
    icon: Radio,
    url: 'https://cdn.pixabay.com/audio/2022/03/12/audio_b4f3e96a89.mp3',
    color: 'text-gray-400',
  },
  {
    id: 'wind',
    name: 'Wind',
    icon: Wind,
    url: 'https://cdn.pixabay.com/audio/2022/01/20/audio_7c57702844.mp3',
    color: 'text-teal-400',
  },
];

interface AmbientSoundsProps {
  className?: string;
}

export const AmbientSounds = ({ className }: AmbientSoundsProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeSound, setActiveSound] = useState<string | null>(null);
  const [volume, setVolume] = useState(0.5);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const toggleSound = async (soundId: string) => {
    const sound = sounds.find(s => s.id === soundId);
    if (!sound) return;

    if (activeSound === soundId) {
      // Stop current sound
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setActiveSound(null);
    } else {
      // Stop previous sound if any
      if (audioRef.current) {
        audioRef.current.pause();
      }

      setIsLoading(true);
      try {
        const audio = new Audio(sound.url);
        audio.loop = true;
        audio.volume = volume;
        audioRef.current = audio;
        await audio.play();
        setActiveSound(soundId);
      } catch (error) {
        console.error('Failed to play sound:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const stopAll = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setActiveSound(null);
  };

  return (
    <div className={cn("glass-card rounded-xl", className)}>
      {/* Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3 flex items-center justify-between hover:bg-muted/30 transition-colors rounded-xl"
      >
        <div className="flex items-center gap-2">
          {activeSound ? (
            <Volume2 className="h-4 w-4 text-primary animate-pulse" />
          ) : (
            <VolumeX className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="text-sm font-medium text-foreground">
            Ambient Sounds
          </span>
          {activeSound && (
            <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              {sounds.find(s => s.id === activeSound)?.name}
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-3 pt-0 space-y-3">
              {/* Sound Buttons */}
              <div className="flex flex-wrap gap-2">
                {sounds.map((sound) => (
                  <Button
                    key={sound.id}
                    variant={activeSound === sound.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleSound(sound.id)}
                    disabled={isLoading}
                    className={cn(
                      "gap-1.5 text-xs h-8",
                      activeSound === sound.id && "shadow-timer-sm"
                    )}
                  >
                    <sound.icon className={cn(
                      "h-3.5 w-3.5",
                      activeSound === sound.id ? "text-primary-foreground" : sound.color
                    )} />
                    {sound.name}
                  </Button>
                ))}
              </div>

              {/* Volume Control */}
              <div className="flex items-center gap-3">
                <VolumeX className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <Slider
                  value={[volume]}
                  onValueChange={handleVolumeChange}
                  max={1}
                  step={0.01}
                  className="flex-1"
                />
                <Volume2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              </div>

              {/* Stop All Button */}
              {activeSound && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={stopAll}
                  className="w-full text-xs text-muted-foreground hover:text-foreground"
                >
                  Stop Sound
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
