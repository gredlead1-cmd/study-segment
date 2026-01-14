import { useEffect, useState } from 'react';
import { getAllSegments, getAllTopics, Segment, deleteSessions } from '@/lib/db';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, Clock, ChevronDown, ChevronRight, Play, CheckSquare, Trash2, Square, CheckCheck } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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

interface HistoryPanelProps {
  refreshTrigger?: number;
  onResumeEntry?: (topicId: string | null, subtopicId: string | null) => void;
  onDataChange?: () => void;
}

interface TopicTotal {
  topicId: string | null;
  topicName: string | null;
  subtopics: Map<string | null, {
    subtopicId: string | null;
    subtopicName: string | null;
    totalTime: number;
  }>;
  totalTime: number;
}

interface SessionData {
  sessionId: string;
  startTime: Date;
  topicTotals: TopicTotal[];
  totalTime: number;
}

interface DateGroup {
  dateKey: string;
  dateLabel: string;
  sessions: SessionData[];
}

const formatDuration = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
};

const formatTime = (ts: number): string => {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const getDateKey = (date: Date): string => {
  return date.toDateString();
};

const formatDateLabel = (date: Date): string => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }
  return date.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
};

export const HistoryPanel = ({ refreshTrigger, onResumeEntry, onDataChange }: HistoryPanelProps) => {
  const [dateGroups, setDateGroups] = useState<DateGroup[]>([]);
  const [openSessions, setOpenSessions] = useState<Set<string>>(new Set());
  const [selectedSessions, setSelectedSessions] = useState<Set<string>>(new Set());
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const allSessionIds = dateGroups.flatMap(g => g.sessions.map(s => s.sessionId));

  useEffect(() => {
    const loadHistory = async () => {
      const allSegments = await getAllSegments();
      const allTopics = await getAllTopics();
      
      // Build topic name lookup
      const topicMap = new Map<string, string>();
      allTopics.forEach(t => topicMap.set(t.id, t.name));

      // Load subtopics for all topics
      const subtopicMap = new Map<string, string>();
      const { getSubtopicsByTopic } = await import('@/lib/db');
      for (const topic of allTopics) {
        const subs = await getSubtopicsByTopic(topic.id);
        subs.forEach(s => subtopicMap.set(s.id, s.name));
      }

      // Group segments by session
      const sessionMap = new Map<string, Segment[]>();
      allSegments.forEach(seg => {
        const existing = sessionMap.get(seg.sessionId) || [];
        existing.push(seg);
        sessionMap.set(seg.sessionId, existing);
      });

      // Convert to session data
      const sessionList: SessionData[] = [];
      
      sessionMap.forEach((segments, sessionId) => {
        // Sort segments by start time
        segments.sort((a, b) => a.startTs - b.startTs);
        
        const firstSegment = segments[0];
        let sessionTotal = 0;
        
        // Aggregate by topic/subtopic
        const topicMap2 = new Map<string | null, TopicTotal>();
        
        segments
          .filter(seg => seg.endTs)
          .forEach(seg => {
            const duration = (seg.endTs || 0) - seg.startTs;
            sessionTotal += duration;
            
            // Get or create topic entry
            if (!topicMap2.has(seg.topicId)) {
              topicMap2.set(seg.topicId, {
                topicId: seg.topicId,
                topicName: seg.topicId ? topicMap.get(seg.topicId) || 'Unknown' : null,
                subtopics: new Map(),
                totalTime: 0,
              });
            }
            const topicEntry = topicMap2.get(seg.topicId)!;
            topicEntry.totalTime += duration;
            
            // Get or create subtopic entry
            if (!topicEntry.subtopics.has(seg.subtopicId)) {
              topicEntry.subtopics.set(seg.subtopicId, {
                subtopicId: seg.subtopicId,
                subtopicName: seg.subtopicId ? subtopicMap.get(seg.subtopicId) || 'Unknown' : null,
                totalTime: 0,
              });
            }
            topicEntry.subtopics.get(seg.subtopicId)!.totalTime += duration;
          });

        if (sessionTotal > 0) {
          sessionList.push({
            sessionId,
            startTime: new Date(firstSegment.startTs),
            topicTotals: Array.from(topicMap2.values()),
            totalTime: sessionTotal,
          });
        }
      });

      // Sort sessions by date (newest first)
      sessionList.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
      
      // Group sessions by date
      const groupMap = new Map<string, DateGroup>();
      sessionList.forEach(session => {
        const dateKey = getDateKey(session.startTime);
        if (!groupMap.has(dateKey)) {
          groupMap.set(dateKey, {
            dateKey,
            dateLabel: formatDateLabel(session.startTime),
            sessions: [],
          });
        }
        groupMap.get(dateKey)!.sessions.push(session);
      });
      
      // Sort sessions within each group by newest first
      groupMap.forEach(group => {
        group.sessions.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
      });
      
      // Convert to array and sort groups by newest date first
      const groups = Array.from(groupMap.values());
      groups.sort((a, b) => {
        const aTime = a.sessions[0]?.startTime.getTime() || 0;
        const bTime = b.sessions[0]?.startTime.getTime() || 0;
        return bTime - aTime;
      });
      setDateGroups(groups);
      
      // Auto-expand first session
      if (sessionList.length > 0 && openSessions.size === 0) {
        setOpenSessions(new Set([sessionList[0].sessionId]));
      }
    };

    loadHistory();
  }, [refreshTrigger]);

  const toggleSession = (sessionId: string) => {
    if (isSelectMode) return; // Don't toggle when in select mode
    setOpenSessions(prev => {
      const next = new Set(prev);
      if (next.has(sessionId)) {
        next.delete(sessionId);
      } else {
        next.add(sessionId);
      }
      return next;
    });
  };



  const handleSelectAll = () => {
    if (selectedSessions.size === allSessionIds.length) {
      setSelectedSessions(new Set());
    } else {
      setSelectedSessions(new Set(allSessionIds));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedSessions.size === 0) return;
    
    setIsDeleting(true);
    try {
      await deleteSessions(Array.from(selectedSessions));
      setSelectedSessions(new Set());
      setIsSelectMode(false);
      setShowDeleteDialog(false);
      onDataChange?.();
    } catch (error) {
      console.error('Failed to delete sessions:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const exitSelectMode = () => {
    setIsSelectMode(false);
    setSelectedSessions(new Set());
  };

  if (dateGroups.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-6 h-full flex flex-col">
        <div className="flex items-center gap-2 mb-4">
          <History className="h-5 w-5 text-muted-foreground" />
          <h2 className="font-semibold text-foreground">History</h2>
        </div>
        <p className="text-sm text-muted-foreground text-center py-8">
          No study sessions recorded yet
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="glass-card rounded-2xl p-6 h-full flex flex-col">
        <div className="flex items-center gap-2 mb-4 flex-shrink-0">
          <History className="h-5 w-5 text-muted-foreground" />
          <h2 className="font-semibold text-foreground">History</h2>
          
          {/* Action buttons */}
          <div className="ml-auto flex items-center gap-1">
            {isSelectMode ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                  className="h-7 px-2 text-xs"
                >
                  <CheckCheck className="h-3.5 w-3.5 mr-1" />
                  {selectedSessions.size === allSessionIds.length ? 'Deselect' : 'Select All'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={selectedSessions.size === 0}
                  className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  Delete ({selectedSessions.size})
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={exitSelectMode}
                  className="h-7 px-2 text-xs"
                >
                  Cancel
                </Button>
              </>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSelectMode(true)}
                className="h-7 px-2 text-xs"
              >
                <CheckSquare className="h-3.5 w-3.5 mr-1" />
                Select
              </Button>
            )}
          </div>
        </div>
        
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6">
            {dateGroups.map((group) => (
              <div key={group.dateKey} className="space-y-2">
                {/* Date Header */}
                <h3 className="text-sm font-semibold text-foreground px-1">
                  {group.dateLabel}
                </h3>
                
                {/* Sessions for this date */}
                <div className="space-y-2">
                  {group.sessions.map((session) => (
                    <Collapsible
                      key={session.sessionId}
                      open={!isSelectMode && openSessions.has(session.sessionId)}
                      onOpenChange={() => !isSelectMode && toggleSession(session.sessionId)}
                    >
                      {isSelectMode ? (
                        <div 
                          className={`flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors cursor-pointer ${
                            selectedSessions.has(session.sessionId) ? 'ring-2 ring-primary bg-primary/10' : ''
                          }`}
                          onClick={() => {
                            setSelectedSessions(prev => {
                              const next = new Set(prev);
                              if (next.has(session.sessionId)) {
                                next.delete(session.sessionId);
                              } else {
                                next.add(session.sessionId);
                              }
                              return next;
                            });
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={selectedSessions.has(session.sessionId)}
                              className="h-4 w-4 pointer-events-none"
                            />
                            <span className="font-medium text-sm">
                              {formatTime(session.startTime.getTime())}
                            </span>
                            <span className="text-xs text-muted-foreground/60">
                              ({session.topicTotals.length} topic{session.topicTotals.length !== 1 ? 's' : ''})
                            </span>
                          </div>
                          <span className="text-sm font-mono text-primary">
                            {formatDuration(session.totalTime)}
                          </span>
                        </div>
                      ) : (
                        <CollapsibleTrigger className="w-full">
                          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                            <div className="flex items-center gap-2">
                              {openSessions.has(session.sessionId) ? (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              )}
                              <span className="font-medium text-sm">
                                {formatTime(session.startTime.getTime())}
                              </span>
                              <span className="text-xs text-muted-foreground/60">
                                ({session.topicTotals.length} topic{session.topicTotals.length !== 1 ? 's' : ''})
                              </span>
                            </div>
                            <span className="text-sm font-mono text-primary">
                              {formatDuration(session.totalTime)}
                            </span>
                          </div>
                        </CollapsibleTrigger>
                      )}
                      
                      <CollapsibleContent>
                        <div className="ml-6 mt-2 space-y-3">
                          {session.topicTotals.map((topic) => (
                            <div key={topic.topicId || 'no-topic'} className="space-y-1">
                              {/* Topic header */}
                              <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-background/50">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-3.5 w-3.5 text-primary" />
                                  <span className="font-medium text-foreground">
                                    {topic.topicName || 'No Topic'}
                                  </span>
                                </div>
                                <span className="text-sm font-mono text-primary">
                                  {formatDuration(topic.totalTime)}
                                </span>
                              </div>
                              
                              {/* Subtopic rows - show all including "General" for null subtopics */}
                              <div className="ml-4 space-y-1">
                                {Array.from(topic.subtopics.values()).map((subtopic) => (
                                  <button
                                    key={subtopic.subtopicId || 'general'}
                                    onClick={() => onResumeEntry?.(topic.topicId, subtopic.subtopicId)}
                                    className="w-full flex items-center justify-between py-1.5 px-3 text-sm rounded-lg hover:bg-primary/10 transition-colors cursor-pointer text-left group"
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="text-muted-foreground">
                                        {subtopic.subtopicName || 'General'}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-mono text-muted-foreground">
                                        {formatDuration(subtopic.totalTime)}
                                      </span>
                                      <Play className="h-3 w-3 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedSessions.size} session{selectedSessions.size !== 1 ? 's' : ''}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected study sessions and all their time tracking data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSelected}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
