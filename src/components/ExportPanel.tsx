import { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, FileJson, FileSpreadsheet, Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getAllSegments, getAllTopics, getSubtopicsByTopic } from '@/lib/db';
import { loadTasks, loadNotes } from '@/lib/notes';

type ExportFormat = 'csv' | 'json';
type ExportRange = 'today' | 'week' | 'month' | 'all';

const formatDuration = (ms: number): string => {
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
};

const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toISOString();
};

const formatDateSimple = (timestamp: number): string => {
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const getStartOfRange = (range: ExportRange): number => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (range) {
    case 'today':
      return today.getTime();
    case 'week':
      return today.getTime() - 7 * 24 * 60 * 60 * 1000;
    case 'month':
      return today.getTime() - 30 * 24 * 60 * 60 * 1000;
    case 'all':
    default:
      return 0;
  }
};

export function ExportButton() {
  const [format, setFormat] = useState<ExportFormat>('csv');
  const [range, setRange] = useState<ExportRange>('all');
  const [isExporting, setIsExporting] = useState(false);
  const [open, setOpen] = useState(false);

  const exportData = async () => {
    setIsExporting(true);
    
    try {
      const segments = await getAllSegments();
      const topics = await getAllTopics();
      const startTime = getStartOfRange(range);
      
      // Filter segments by date range
      const filteredSegments = segments.filter(s => s.startTs >= startTime);
      
      // Build topic/subtopic lookup
      const topicMap = new Map(topics.map(t => [t.id, t.name]));
      const subtopicMap = new Map<string, string>();
      
      for (const topic of topics) {
        const subtopics = await getSubtopicsByTopic(topic.id);
        subtopics.forEach(s => subtopicMap.set(s.id, s.name));
      }
      
      // Transform segments for export
      const exportSegments = filteredSegments
        .filter(s => s.endTs !== null)
        .map(s => ({
          date: formatDateSimple(s.startTs),
          startTime: formatDate(s.startTs),
          endTime: formatDate(s.endTs!),
          duration: formatDuration(s.endTs! - s.startTs),
          durationMinutes: Math.round((s.endTs! - s.startTs) / 60000),
          topic: s.topicId ? topicMap.get(s.topicId) || 'Unknown' : 'No Topic',
          subtopic: s.subtopicId ? subtopicMap.get(s.subtopicId) || 'Unknown' : 'No Subtopic',
        }));
      
      // Calculate summary stats
      const totalMs = filteredSegments
        .filter(s => s.endTs)
        .reduce((sum, s) => sum + (s.endTs! - s.startTs), 0);
      
      const summary = {
        exportDate: new Date().toISOString(),
        range,
        totalSessions: exportSegments.length,
        totalStudyTime: formatDuration(totalMs),
        totalMinutes: Math.round(totalMs / 60000),
      };
      
      // Load tasks and notes
      const tasks = loadTasks();
      const notes = loadNotes();
      
      let content: string;
      let filename: string;
      let mimeType: string;
      
      if (format === 'json') {
        const jsonData = {
          summary,
          sessions: exportSegments,
          tasks: tasks.map(t => ({
            text: t.text,
            completed: t.completed,
            createdAt: formatDate(t.createdAt),
          })),
          notes: notes.map(n => ({
            text: n.text,
            date: n.sessionDate,
            createdAt: formatDate(n.createdAt),
          })),
        };
        content = JSON.stringify(jsonData, null, 2);
        filename = `studywatch-export-${range}-${new Date().toISOString().split('T')[0]}.json`;
        mimeType = 'application/json';
      } else {
        // CSV format - sessions only
        const headers = ['Date', 'Start Time', 'End Time', 'Duration', 'Minutes', 'Topic', 'Subtopic'];
        const rows = exportSegments.map(s => [
          s.date,
          s.startTime,
          s.endTime,
          s.duration,
          s.durationMinutes.toString(),
          s.topic,
          s.subtopic,
        ]);
        
        // Add summary row
        rows.push([]);
        rows.push(['Summary']);
        rows.push(['Total Sessions', summary.totalSessions.toString()]);
        rows.push(['Total Study Time', summary.totalStudyTime]);
        rows.push(['Export Date', summary.exportDate]);
        
        content = [headers, ...rows].map(row => row.join(',')).join('\n');
        filename = `studywatch-export-${range}-${new Date().toISOString().split('T')[0]}.csv`;
        mimeType = 'text/csv';
      }
      
      // Download file
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setOpen(false);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Study Data
          </DialogTitle>
          <DialogDescription>
            Download your study history as a file
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Format Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Format</label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={format === 'csv' ? 'default' : 'outline'}
                onClick={() => setFormat('csv')}
                className="gap-2"
              >
                <FileSpreadsheet className="h-4 w-4" />
                CSV
              </Button>
              <Button
                variant={format === 'json' ? 'default' : 'outline'}
                onClick={() => setFormat('json')}
                className="gap-2"
              >
                <FileJson className="h-4 w-4" />
                JSON
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {format === 'csv' 
                ? 'Works with Excel, Google Sheets' 
                : 'Includes sessions, tasks, and notes'}
            </p>
          </div>
          
          {/* Date Range Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Date Range</label>
            <Select value={range} onValueChange={(v) => setRange(v as ExportRange)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">
                  <span className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Today
                  </span>
                </SelectItem>
                <SelectItem value="week">
                  <span className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Last 7 days
                  </span>
                </SelectItem>
                <SelectItem value="month">
                  <span className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Last 30 days
                  </span>
                </SelectItem>
                <SelectItem value="all">
                  <span className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    All time
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Button onClick={exportData} disabled={isExporting} className="w-full gap-2">
          {isExporting ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Download className="h-4 w-4" />
              </motion.div>
              Exporting...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Download {format.toUpperCase()}
            </>
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
