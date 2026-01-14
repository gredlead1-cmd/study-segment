import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, TrendingDown, Clock, Calendar, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getAllSegments } from '@/lib/db';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface WeeklyReportsProps {
  refreshTrigger?: number;
}

interface DayData {
  day: string;
  shortDay: string;
  hours: number;
  ms: number;
}

interface HourData {
  hour: string;
  minutes: number;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--primary) / 0.8)', 'hsl(var(--primary) / 0.6)', 'hsl(var(--primary) / 0.4)'];

export const WeeklyReports = ({ refreshTrigger }: WeeklyReportsProps) => {
  const [weekData, setWeekData] = useState<DayData[]>([]);
  const [hourlyData, setHourlyData] = useState<HourData[]>([]);
  const [prevWeekTotal, setPrevWeekTotal] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const loadData = async () => {
      const segments = await getAllSegments();
      const now = new Date();
      
      // Get start of current week (Sunday)
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      // Get start of previous week
      const startOfPrevWeek = new Date(startOfWeek);
      startOfPrevWeek.setDate(startOfPrevWeek.getDate() - 7);

      // Initialize day data
      const days: DayData[] = [];
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const fullDayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      
      for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(date.getDate() + i);
        days.push({
          day: fullDayNames[i],
          shortDay: dayNames[i],
          hours: 0,
          ms: 0,
        });
      }

      // Initialize hourly data
      const hours: HourData[] = [];
      for (let i = 0; i < 24; i++) {
        hours.push({
          hour: i === 0 ? '12am' : i < 12 ? `${i}am` : i === 12 ? '12pm' : `${i - 12}pm`,
          minutes: 0,
        });
      }

      let prevWeekMs = 0;

      // Process segments
      segments
        .filter(seg => seg.endTs)
        .forEach(seg => {
          const segDate = new Date(seg.startTs);
          const duration = (seg.endTs || 0) - seg.startTs;

          // Current week data
          if (segDate >= startOfWeek) {
            const dayIndex = segDate.getDay();
            days[dayIndex].ms += duration;
            days[dayIndex].hours = days[dayIndex].ms / 3600000;

            // Hourly distribution
            const hour = segDate.getHours();
            hours[hour].minutes += duration / 60000;
          }
          // Previous week total
          else if (segDate >= startOfPrevWeek && segDate < startOfWeek) {
            prevWeekMs += duration;
          }
        });

      setWeekData(days);
      setHourlyData(hours);
      setPrevWeekTotal(prevWeekMs);
    };

    loadData();
  }, [refreshTrigger, isOpen]);

  const stats = useMemo(() => {
    const totalMs = weekData.reduce((sum, day) => sum + day.ms, 0);
    const avgMs = totalMs / 7;
    const maxDay = weekData.reduce((max, day) => day.ms > max.ms ? day : max, weekData[0] || { day: '', ms: 0 });
    const peakHour = hourlyData.reduce((max, h) => h.minutes > max.minutes ? h : max, hourlyData[0] || { hour: '', minutes: 0 });
    
    const change = prevWeekTotal > 0 
      ? ((totalMs - prevWeekTotal) / prevWeekTotal) * 100 
      : totalMs > 0 ? 100 : 0;

    return {
      totalHours: totalMs / 3600000,
      avgHours: avgMs / 3600000,
      maxDay: maxDay?.day || 'N/A',
      maxDayHours: (maxDay?.ms || 0) / 3600000,
      peakHour: peakHour?.hour || 'N/A',
      weekChange: change,
    };
  }, [weekData, hourlyData, prevWeekTotal]);

  const formatHours = (hours: number) => {
    if (hours < 1) {
      return `${Math.round(hours * 60)}m`;
    }
    return `${hours.toFixed(1)}h`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          <span className="hidden sm:inline">Weekly Report</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Weekly Study Report
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Total This Week</p>
                <p className="text-xl font-bold text-foreground">{formatHours(stats.totalHours)}</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Daily Average</p>
                <p className="text-xl font-bold text-foreground">{formatHours(stats.avgHours)}</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Best Day</p>
                <p className="text-xl font-bold text-foreground">{stats.maxDay}</p>
                <p className="text-xs text-muted-foreground">{formatHours(stats.maxDayHours)}</p>
              </div>
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">vs Last Week</p>
                <div className="flex items-center gap-1">
                  {stats.weekChange > 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : stats.weekChange < 0 ? (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  ) : (
                    <Minus className="h-4 w-4 text-muted-foreground" />
                  )}
                  <p className={`text-xl font-bold ${
                    stats.weekChange > 0 ? 'text-green-500' : 
                    stats.weekChange < 0 ? 'text-red-500' : 'text-muted-foreground'
                  }`}>
                    {stats.weekChange > 0 ? '+' : ''}{stats.weekChange.toFixed(0)}%
                  </p>
                </div>
              </div>
            </div>

            {/* Daily Chart */}
            <div className="bg-muted/20 rounded-lg p-4">
              <h3 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Daily Study Time
              </h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weekData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                    <XAxis 
                      dataKey="shortDay" 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    />
                    <YAxis 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      tickFormatter={(v) => `${v}h`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => [`${value.toFixed(1)}h`, 'Study Time']}
                    />
                    <Bar dataKey="hours" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Peak Hours Chart */}
            <div className="bg-muted/20 rounded-lg p-4">
              <h3 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Peak Study Hours
                <span className="text-xs text-muted-foreground ml-2">
                  Most active: {stats.peakHour}
                </span>
              </h3>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={hourlyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                    <XAxis 
                      dataKey="hour" 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                      interval={2}
                    />
                    <YAxis 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      tickFormatter={(v) => `${Math.round(v)}m`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => [`${Math.round(value)} min`, 'Study Time']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="minutes" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Insights */}
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <h3 className="text-sm font-medium text-foreground mb-2">📊 Weekly Insights</h3>
              <ul className="text-sm text-muted-foreground space-y-1.5">
                {stats.totalHours > 0 ? (
                  <>
                    <li>• You studied a total of <span className="text-foreground font-medium">{formatHours(stats.totalHours)}</span> this week</li>
                    <li>• Your most productive day was <span className="text-foreground font-medium">{stats.maxDay}</span> with {formatHours(stats.maxDayHours)}</li>
                    <li>• Peak focus time: <span className="text-foreground font-medium">{stats.peakHour}</span></li>
                    {stats.weekChange !== 0 && (
                      <li>
                        • {stats.weekChange > 0 ? '📈' : '📉'} You studied {Math.abs(stats.weekChange).toFixed(0)}% {stats.weekChange > 0 ? 'more' : 'less'} than last week
                      </li>
                    )}
                  </>
                ) : (
                  <li>Start studying to see your weekly insights!</li>
                )}
              </ul>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
