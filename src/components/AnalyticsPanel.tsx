import { useEffect, useState } from 'react';
import { getAllSegments, getAllTopics } from '@/lib/db';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { BarChart3 } from 'lucide-react';

interface AnalyticsPanelProps {
  refreshTrigger?: number;
  selectedDate?: Date | null;
}

interface TopicData {
  name: string;
  value: number;
  percentage: number;
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(262, 83%, 58%)',
  'hsl(199, 89%, 48%)',
  'hsl(43, 96%, 56%)',
];

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

const getTodayKey = (): string => {
  return getLocalDateKey(Date.now());
};

const formatDateLabel = (date: Date): string => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (getLocalDateKey(date.getTime()) === getLocalDateKey(today.getTime())) {
    return "Today's Analytics";
  }
  if (getLocalDateKey(date.getTime()) === getLocalDateKey(yesterday.getTime())) {
    return "Yesterday's Analytics";
  }
  return date.toLocaleDateString(undefined, { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  }) + ' Analytics';
};

export const AnalyticsPanel = ({ refreshTrigger, selectedDate }: AnalyticsPanelProps) => {
  const [topicData, setTopicData] = useState<TopicData[]>([]);
  const [totalTime, setTotalTime] = useState(0);
  const [allTimeTotal, setAllTimeTotal] = useState(0);
  const [dateLabel, setDateLabel] = useState("Today's Analytics");

  useEffect(() => {
    const loadAnalytics = async () => {
      const allSegments = await getAllSegments();
      const allTopics = await getAllTopics();

      // Calculate all-time total
      let allTime = 0;
      allSegments
        .filter(seg => seg.endTs)
        .forEach(seg => {
          allTime += (seg.endTs || 0) - seg.startTs;
        });
      setAllTimeTotal(allTime);

      // Determine which date to filter by
      const targetDateKey = selectedDate 
        ? getLocalDateKey(selectedDate.getTime()) 
        : getTodayKey();
      
      setDateLabel(selectedDate ? formatDateLabel(selectedDate) : "Today's Analytics");

      // Build topic name lookup
      const topicMap = new Map<string, string>();
      allTopics.forEach(t => topicMap.set(t.id, t.name));

      // Filter segments for target date and aggregate by topic
      const topicTotals = new Map<string | null, number>();

      allSegments
        .filter(seg => getLocalDateKey(seg.startTs) === targetDateKey && seg.endTs)
        .forEach(seg => {
          const duration = (seg.endTs || 0) - seg.startTs;
          const current = topicTotals.get(seg.topicId) || 0;
          topicTotals.set(seg.topicId, current + duration);
        });

      // Calculate total time
      let total = 0;
      topicTotals.forEach(time => {
        total += time;
      });
      setTotalTime(total);

      // Convert to chart data, excluding zero-duration
      const chartData: TopicData[] = [];
      topicTotals.forEach((time, topicId) => {
        if (time > 0) {
          chartData.push({
            name: topicId ? topicMap.get(topicId) || 'Unknown' : 'No Topic',
            value: time,
            percentage: total > 0 ? (time / total) * 100 : 0,
          });
        }
      });

      // Sort by time descending
      chartData.sort((a, b) => b.value - a.value);
      setTopicData(chartData);
    };

    loadAnalytics();
  }, [refreshTrigger, selectedDate]);

  const renderLegend = () => {
    return (
      <div className="space-y-2 mt-4">
        {topicData.map((entry, index) => (
          <div key={entry.name} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-foreground">{entry.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-muted-foreground">
                {formatDuration(entry.value)}
              </span>
              <span className="text-xs text-muted-foreground">
                ({entry.percentage.toFixed(1)}%)
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (topicData.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-5 w-5 text-muted-foreground" />
          <h2 className="font-semibold text-foreground">{dateLabel}</h2>
        </div>
        <p className="text-sm text-muted-foreground text-center py-4">
          No study time recorded {selectedDate ? 'on this day' : 'today'}
        </p>
        {allTimeTotal > 0 && (
          <div className="mt-4 pt-4 border-t border-border/50 text-center">
            <p className="text-xs text-muted-foreground">All-Time Total</p>
            <p className="text-lg font-mono font-semibold text-primary">{formatDuration(allTimeTotal)}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="h-5 w-5 text-muted-foreground" />
        <h2 className="font-semibold text-foreground">{dateLabel}</h2>
        <span className="ml-auto text-sm font-mono text-primary">
          {formatDuration(totalTime)} total
        </span>
      </div>

      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={topicData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
            >
              {topicData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload as TopicData;
                  return (
                    <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg">
                      <p className="font-medium text-foreground">{data.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDuration(data.value)} ({data.percentage.toFixed(1)}%)
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {renderLegend()}

      {/* All-Time Total */}
      {allTimeTotal > 0 && (
        <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">All-Time Total</span>
          <span className="font-mono font-semibold text-primary">{formatDuration(allTimeTotal)}</span>
        </div>
      )}
    </div>
  );
};
