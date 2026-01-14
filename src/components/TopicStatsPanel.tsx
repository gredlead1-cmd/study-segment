import { useEffect, useState } from 'react';
import { getAllSegments, getAllTopics, Segment, Topic } from '@/lib/db';
import { BookOpen } from 'lucide-react';

interface TopicStatsProps {
  refreshTrigger?: number;
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

export const TopicStatsPanel = ({ refreshTrigger }: TopicStatsProps) => {
  const [topicStats, setTopicStats] = useState<{ name: string; time: number }[]>([]);
  const [totalTime, setTotalTime] = useState(0);

  useEffect(() => {
    const loadStats = async () => {
      const [segments, topics] = await Promise.all([
        getAllSegments(),
        getAllTopics()
      ]);

      const topicMap = new Map<string, Topic>();
      topics.forEach(t => topicMap.set(t.id, t));

      const timeByTopic = new Map<string, number>();
      let total = 0;

      segments.forEach((seg: Segment) => {
        const duration = (seg.endTs ?? Date.now()) - seg.startTs;
        total += duration;
        const topicId = seg.topicId || 'no-topic';
        timeByTopic.set(topicId, (timeByTopic.get(topicId) || 0) + duration);
      });

      const stats = Array.from(timeByTopic.entries())
        .map(([id, time]) => ({
          name: id === 'no-topic' ? 'No Topic' : (topicMap.get(id)?.name || 'Unknown'),
          time
        }))
        .sort((a, b) => b.time - a.time);

      setTopicStats(stats);
      setTotalTime(total);
    };

    loadStats();
  }, [refreshTrigger]);

  return (
    <div className="glass-card rounded-2xl p-4 flex-shrink-0">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-medium text-foreground">All-Time by Topic</h3>
        </div>
        <span className="text-xs text-primary font-medium">
          {formatDuration(totalTime)} total
        </span>
      </div>

      {topicStats.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">
          No study time recorded yet
        </p>
      ) : (
        <div className="space-y-2">
          {topicStats.map((stat) => {
            const percentage = totalTime > 0 ? (stat.time / totalTime) * 100 : 0;
            return (
              <div key={stat.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-foreground truncate">{stat.name}</span>
                  <span className="text-muted-foreground ml-2 flex-shrink-0">
                    {formatDuration(stat.time)}
                  </span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
