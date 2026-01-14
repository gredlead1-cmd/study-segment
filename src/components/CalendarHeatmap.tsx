import { useEffect, useState, useMemo } from 'react';
import { getAllSegments } from '@/lib/db';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Calendar } from 'lucide-react';

interface CalendarHeatmapProps {
  refreshTrigger?: number;
  selectedDate?: Date | null;
  onDateSelect?: (date: Date | null) => void;
}

const formatDuration = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
};

const getLocalDateKey = (timestamp: number): string => {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const formatDateDisplay = (date: Date): string => {
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const getIntensityClass = (time: number, maxTime: number): string => {
  if (time === 0) return 'bg-muted/40';
  const ratio = time / maxTime;
  if (ratio < 0.25) return 'bg-primary/30';
  if (ratio < 0.5) return 'bg-primary/50';
  if (ratio < 0.75) return 'bg-primary/70';
  return 'bg-primary';
};

export const CalendarHeatmap = ({ refreshTrigger, selectedDate, onDateSelect }: CalendarHeatmapProps) => {
  const [dayDataMap, setDayDataMap] = useState<Map<string, number>>(new Map());
  const [maxTime, setMaxTime] = useState(0);

  // Generate weeks data - last 20 weeks for compact fit (~5 months)
  const { weeks, monthLabels } = useMemo(() => {
    const weeksArray: Date[][] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Start from 20 weeks ago, on a Sunday
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - (20 * 7) - startDate.getDay());
    
    let currentDate = new Date(startDate);
    let currentWeek: Date[] = [];
    
    // Generate until end of current week
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
    
    while (currentDate <= endDate) {
      currentWeek.push(new Date(currentDate));
      
      if (currentDate.getDay() === 6) {
        weeksArray.push(currentWeek);
        currentWeek = [];
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    if (currentWeek.length > 0) {
      weeksArray.push(currentWeek);
    }

    // Generate month labels with positions
    const labels: { month: string; colStart: number }[] = [];
    let lastMonth = -1;
    
    weeksArray.forEach((week, weekIndex) => {
      const firstDay = week[0];
      if (firstDay && firstDay.getMonth() !== lastMonth) {
        lastMonth = firstDay.getMonth();
        labels.push({
          month: firstDay.toLocaleDateString(undefined, { month: 'short' }),
          colStart: weekIndex,
        });
      }
    });
    
    return { weeks: weeksArray, monthLabels: labels };
  }, []);

  // Calculate weekly totals
  const weeklyTotals = useMemo(() => {
    return weeks.map(week => {
      let total = 0;
      week.forEach(day => {
        const dateKey = getLocalDateKey(day.getTime());
        total += dayDataMap.get(dateKey) || 0;
      });
      return total;
    });
  }, [weeks, dayDataMap]);

  const formatWeeklyDuration = (ms: number): string => {
    if (ms === 0) return '-';
    const totalMinutes = Math.floor(ms / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0) {
      return `${hours}h${minutes > 0 ? ` ${minutes}m` : ''}`;
    }
    return `${minutes}m`;
  };

  useEffect(() => {
    const loadData = async () => {
      const allSegments = await getAllSegments();
      
      // Aggregate by local date
      const dateMap = new Map<string, number>();
      
      allSegments
        .filter(seg => seg.endTs)
        .forEach(seg => {
          const dateKey = getLocalDateKey(seg.startTs);
          const duration = (seg.endTs || 0) - seg.startTs;
          const current = dateMap.get(dateKey) || 0;
          dateMap.set(dateKey, current + duration);
        });
      
      // Find max time
      let max = 0;
      dateMap.forEach(time => {
        if (time > max) max = time;
      });
      
      setDayDataMap(dateMap);
      setMaxTime(max || 1); // Avoid division by zero
    };

    loadData();
  }, [refreshTrigger]);

  const handleDayClick = (date: Date) => {
    if (!onDateSelect) return;
    
    const dateKey = getLocalDateKey(date.getTime());
    const selectedKey = selectedDate ? getLocalDateKey(selectedDate.getTime()) : null;
    
    if (dateKey === selectedKey) {
      onDateSelect(null);
    } else {
      onDateSelect(date);
    }
  };

  const isSelected = (date: Date): boolean => {
    if (!selectedDate) return false;
    return getLocalDateKey(date.getTime()) === getLocalDateKey(selectedDate.getTime());
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return getLocalDateKey(date.getTime()) === getLocalDateKey(today.getTime());
  };

  const isFuture = (date: Date): boolean => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return date > today;
  };

  const CELL_SIZE = 12;
  const GAP = 2;

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="h-5 w-5 text-muted-foreground" />
        <h2 className="font-semibold text-foreground">Study Activity</h2>
        {selectedDate && (
          <button
            onClick={() => onDateSelect?.(null)}
            className="ml-auto text-xs text-primary hover:underline"
          >
            Clear filter
          </button>
        )}
      </div>

      <div className="overflow-x-auto pb-2">
        <TooltipProvider delayDuration={100}>
          <div style={{ minWidth: weeks.length * (CELL_SIZE + GAP) + 24 }}>
            {/* Month labels row */}
            <div className="flex mb-2 ml-6" style={{ gap: GAP }}>
              {weeks.map((_, weekIndex) => {
                const label = monthLabels.find(l => l.colStart === weekIndex);
                return (
                  <div 
                    key={weekIndex} 
                    className="text-xs text-muted-foreground"
                    style={{ width: CELL_SIZE, flexShrink: 0 }}
                  >
                    {label?.month || ''}
                  </div>
                );
              })}
            </div>

            {/* Grid */}
            <div className="flex">
              {/* Day labels */}
              <div 
                className="flex flex-col text-xs text-muted-foreground mr-1"
                style={{ gap: GAP }}
              >
                <div style={{ height: CELL_SIZE }} className="flex items-center justify-end pr-1">S</div>
                <div style={{ height: CELL_SIZE }} className="flex items-center justify-end pr-1">M</div>
                <div style={{ height: CELL_SIZE }} className="flex items-center justify-end pr-1">T</div>
                <div style={{ height: CELL_SIZE }} className="flex items-center justify-end pr-1">W</div>
                <div style={{ height: CELL_SIZE }} className="flex items-center justify-end pr-1">T</div>
                <div style={{ height: CELL_SIZE }} className="flex items-center justify-end pr-1">F</div>
                <div style={{ height: CELL_SIZE }} className="flex items-center justify-end pr-1">S</div>
              </div>

              {/* Weeks */}
              <div className="flex" style={{ gap: GAP }}>
                {weeks.map((week, weekIndex) => (
                  <div key={weekIndex} className="flex flex-col" style={{ gap: GAP }}>
                    {week.map((day, dayIndex) => {
                      const dateKey = getLocalDateKey(day.getTime());
                      const time = dayDataMap.get(dateKey) || 0;
                      const future = isFuture(day);
                      
                      return (
                        <Tooltip key={dayIndex}>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => !future && handleDayClick(day)}
                              disabled={future}
                              style={{ width: CELL_SIZE, height: CELL_SIZE }}
                              className={`
                                rounded-sm transition-all flex-shrink-0
                                ${future ? 'bg-transparent' : getIntensityClass(time, maxTime)}
                                ${isSelected(day) ? 'ring-2 ring-primary ring-offset-1 ring-offset-background' : ''}
                                ${isToday(day) ? 'ring-1 ring-foreground/50' : ''}
                                ${!future ? 'hover:ring-1 hover:ring-foreground/40 cursor-pointer' : 'cursor-default'}
                              `}
                            />
                          </TooltipTrigger>
                          {!future && (
                            <TooltipContent side="top" className="text-xs">
                              <p className="font-medium">{formatDateDisplay(day)}</p>
                              <p className="text-muted-foreground">
                                {time > 0 ? formatDuration(time) : 'No study time'}
                              </p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Weekly Summary Row */}
            <div className="flex mt-3 pt-3 border-t border-border/30">
              <div className="w-6 mr-1 text-xs text-muted-foreground flex items-center justify-end pr-1">
                Σ
              </div>
              <div className="flex" style={{ gap: GAP }}>
                {weeklyTotals.map((total, weekIndex) => (
                  <Tooltip key={weekIndex}>
                    <TooltipTrigger asChild>
                      <div
                        style={{ width: CELL_SIZE }}
                        className="text-[8px] text-center text-muted-foreground truncate"
                      >
                        {formatWeeklyDuration(total)}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="text-xs">
                      <p className="font-medium">Week of {formatDateDisplay(weeks[weekIndex][0])}</p>
                      <p className="text-muted-foreground">
                        {total > 0 ? formatDuration(total) : 'No study time'}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-end gap-1.5 mt-4 text-xs text-muted-foreground">
              <span>Less</span>
              <div style={{ width: CELL_SIZE, height: CELL_SIZE }} className="rounded-sm bg-muted/40" />
              <div style={{ width: CELL_SIZE, height: CELL_SIZE }} className="rounded-sm bg-primary/30" />
              <div style={{ width: CELL_SIZE, height: CELL_SIZE }} className="rounded-sm bg-primary/50" />
              <div style={{ width: CELL_SIZE, height: CELL_SIZE }} className="rounded-sm bg-primary/70" />
              <div style={{ width: CELL_SIZE, height: CELL_SIZE }} className="rounded-sm bg-primary" />
              <span>More</span>
            </div>
          </div>
        </TooltipProvider>
      </div>
    </div>
  );
};
