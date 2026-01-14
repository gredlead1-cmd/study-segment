import { Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface SoundSettingsProps {
  soundEnabled: boolean;
  volume: number;
  onSoundEnabledChange: (enabled: boolean) => void;
  onVolumeChange: (volume: number) => void;
}

export function SoundSettings({
  soundEnabled,
  volume,
  onSoundEnabledChange,
  onVolumeChange,
}: SoundSettingsProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          {soundEnabled ? (
            <Volume2 className="h-4 w-4" />
          ) : (
            <VolumeX className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Sound Alerts</span>
            <Button
              variant={soundEnabled ? 'default' : 'outline'}
              size="sm"
              onClick={() => onSoundEnabledChange(!soundEnabled)}
            >
              {soundEnabled ? 'On' : 'Off'}
            </Button>
          </div>
          
          {soundEnabled && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Volume</span>
                <span className="text-muted-foreground">{Math.round(volume * 100)}%</span>
              </div>
              <Slider
                value={[volume]}
                onValueChange={([v]) => onVolumeChange(v)}
                max={1}
                step={0.1}
                className="w-full"
              />
            </div>
          )}
          
          <p className="text-xs text-muted-foreground">
            Plays audio when timers complete
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
