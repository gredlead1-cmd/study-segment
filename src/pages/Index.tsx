import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStudyTimer } from '@/hooks/useStudyTimer';
import { usePomodoro } from '@/hooks/usePomodoro';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useSoundAlerts } from '@/hooks/useSoundAlerts';
import { TimerControls } from '@/components/TimerControls';
import { TopicSelector } from '@/components/TopicSelector';
import { SubtopicSelector } from '@/components/SubtopicSelector';
import { StatusIndicator } from '@/components/StatusIndicator';
import { HistoryPanel } from '@/components/HistoryPanel';
import { AnalyticsPanel } from '@/components/AnalyticsPanel';
import { CalendarHeatmap } from '@/components/CalendarHeatmap';
import { TopicStatsPanel } from '@/components/TopicStatsPanel';
import { GoalsPanel } from '@/components/GoalsPanel';
import { FocusMode, FocusModeButton } from '@/components/FocusMode';
import { PomodoroSettingsDialog, PomodoroIndicator } from '@/components/PomodoroSettings';
import { SessionNotesPanel } from '@/components/SessionNotesPanel';
import { ExportButton } from '@/components/ExportPanel';
import { KeyboardShortcutsInfo } from '@/components/KeyboardShortcutsInfo';
import { SoundSettings } from '@/components/SoundSettings';
import { AnimeBackground } from '@/components/AnimeBackground';
import { PremiumTimerDisplay } from '@/components/PremiumTimerDisplay';
import { TimerDisplay } from '@/components/TimerDisplay';
import { TimerPresets } from '@/components/TimerPresets';
import { AmbientSounds } from '@/components/AmbientSounds';
import { BreakActivities } from '@/components/BreakActivities';
import { AchievementsPanel } from '@/components/AchievementsPanel';
import { WeeklyReports } from '@/components/WeeklyReports';
import { WellnessReminders } from '@/components/WellnessReminders';
import InstallPrompt from '@/components/InstallPrompt';
import { Clock, Flame, Timer, Hourglass } from 'lucide-react';
import { getAllSegments, getAllTopics, getSubtopicsByTopic } from '@/lib/db';
import { calculateStreak } from '@/lib/goals';
import { checkAndUnlockAchievements, saveProgress, loadProgress, AchievementProgress } from '@/lib/achievements';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
const formatDuration = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor(totalSeconds % 3600 / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};
const Index = () => {
  const [selectedAnalyticsDate, setSelectedAnalyticsDate] = useState<Date | null>(null);
  const [focusModeOpen, setFocusModeOpen] = useState(false);
  const [streak, setStreak] = useState(0);
  const [topicName, setTopicName] = useState<string | undefined>();
  const [subtopicName, setSubtopicName] = useState<string | undefined>();
  const [pomodoroEnabled, setPomodoroEnabled] = useState(false);
  const {
    state,
    currentTopicId,
    currentSubtopicId,
    todayTime,
    allTimeTotal,
    topicTime,
    subtopicTime,
    historyRefreshTrigger,
    startSession,
    pauseSession,
    resumeSession,
    endCurrentSession,
    setTopic,
    setSubtopic,
    resumeWithContext,
    refreshData
  } = useStudyTimer();

  // Sound alerts
  const {
    playSound,
    soundEnabled,
    setSoundEnabled,
    volume,
    setVolume
  } = useSoundAlerts();

  // Pomodoro with sound callbacks
  const handleWorkComplete = useCallback(() => {
    playSound('workComplete');
  }, [playSound]);
  const handleBreakComplete = useCallback(() => {
    playSound('breakComplete');
  }, [playSound]);
  const pomodoro = usePomodoro(handleWorkComplete, handleBreakComplete);

  // Load streak
  useEffect(() => {
    const loadStreak = async () => {
      const segments = await getAllSegments();
      const dayMap = new Map<string, number>();
      segments.filter(s => s.endTs).forEach(seg => {
        const date = new Date(seg.startTs);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        dayMap.set(key, (dayMap.get(key) || 0) + ((seg.endTs || 0) - seg.startTs));
      });
      setStreak(calculateStreak(dayMap));
    };
    loadStreak();
  }, [historyRefreshTrigger]);

  // Load topic/subtopic names
  useEffect(() => {
    const loadNames = async () => {
      if (currentTopicId) {
        const topics = await getAllTopics();
        const topic = topics.find(t => t.id === currentTopicId);
        setTopicName(topic?.name);
        if (currentSubtopicId) {
          const subtopics = await getSubtopicsByTopic(currentTopicId);
          const subtopic = subtopics.find(s => s.id === currentSubtopicId);
          setSubtopicName(subtopic?.name);
        } else {
          setSubtopicName(undefined);
        }
      } else {
        setTopicName(undefined);
        setSubtopicName(undefined);
      }
    };
    loadNames();
  }, [currentTopicId, currentSubtopicId]);

  // Determine which timer mode to use
  const isPomodoro = pomodoroEnabled;

  // Get the correct timer state for Pomodoro mode
  const getPomodoroTimerState = (): 'idle' | 'running' | 'paused' => {
    if (!pomodoro.isActive) return 'idle';
    return pomodoro.isPaused ? 'paused' : 'running';
  };
  const timerState = isPomodoro ? getPomodoroTimerState() : state;
  const handleStart = useCallback(() => {
    if (isPomodoro) {
      pomodoro.start();
    }
    playSound('start');
    startSession();
  }, [isPomodoro, pomodoro, playSound, startSession]);
  const handlePause = useCallback(() => {
    if (isPomodoro) {
      pomodoro.pause();
    }
    pauseSession();
  }, [isPomodoro, pomodoro, pauseSession]);
  const handleResume = useCallback(() => {
    if (isPomodoro) {
      pomodoro.resume();
    }
    resumeSession();
  }, [isPomodoro, pomodoro, resumeSession]);
  const handleEnd = useCallback(() => {
    if (isPomodoro) {
      pomodoro.stop();
    }
    playSound('stop');
    endCurrentSession();
  }, [isPomodoro, pomodoro, playSound, endCurrentSession]);
  const handleSkip = useCallback(() => {
    pomodoro.skip();
  }, [pomodoro]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onStart: handleStart,
    onPause: handlePause,
    onResume: handleResume,
    onEnd: handleEnd,
    onSkip: isPomodoro && pomodoro.currentMode === 'break' ? handleSkip : undefined,
    timerState,
    enabled: !focusModeOpen
  });
  return <div className="min-h-screen bg-background flex flex-col relative">
      {/* Anime Background */}
      <AnimeBackground />

      {/* PWA Install Prompt */}
      <InstallPrompt />

      {/* Focus Mode Overlay */}
      <FocusMode isOpen={focusModeOpen} onClose={() => setFocusModeOpen(false)} timerState={state} todayTime={isPomodoro ? pomodoro.timeRemaining : todayTime} topicName={topicName} subtopicName={subtopicName} onStart={handleStart} onPause={handlePause} onResume={handleResume} onEnd={handleEnd} />

      {/* Header */}
      <header className="border-b border-border/50 px-6 py-4 flex-shrink-0 relative z-10 bg-background/80 backdrop-blur-xl">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <motion.div className="flex items-center gap-3" initial={{
          opacity: 0,
          x: -20
        }} animate={{
          opacity: 1,
          x: 0
        }}>
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-timer-sm">
              <Clock className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground tracking-tight">Bipin Watch</h1>
              <p className="text-xs text-muted-foreground">Premium Study Timer</p>
            </div>
          </motion.div>

          <div className="flex items-center gap-2">
            {/* Streak indicator */}
            {streak > 0 && <motion.div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20" initial={{
            opacity: 0,
            scale: 0.9
          }} animate={{
            opacity: 1,
            scale: 1
          }}>
                <Flame className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-primary">{streak}</span>
                <span className="text-xs text-muted-foreground hidden sm:inline">day streak</span>
              </motion.div>}
            
            <ExportButton />
            <WeeklyReports refreshTrigger={historyRefreshTrigger} />
            <AchievementsPanel refreshTrigger={historyRefreshTrigger} />
            <WellnessReminders isTimerRunning={state === 'running'} />
            <KeyboardShortcutsInfo />
            <SoundSettings soundEnabled={soundEnabled} volume={volume} onSoundEnabledChange={setSoundEnabled} onVolumeChange={setVolume} />
            <FocusModeButton onClick={() => setFocusModeOpen(true)} />
            <StatusIndicator state={state} pomodoroMode={isPomodoro && pomodoro.isActive ? pomodoro.currentMode : null} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden px-6 py-6 relative z-10">
        <div className="h-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Timer */}
          <div className="lg:col-span-2 flex flex-col gap-6 min-h-0 overflow-y-auto">
            {/* Timer Card */}
            <motion.div className="glass-card rounded-3xl p-8" initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }}>
              {/* Timer Mode Toggle */}
              <div className="flex items-center justify-center gap-2 mb-8">
                <Button variant={!pomodoroEnabled ? "default" : "outline"} size="sm" onClick={() => setPomodoroEnabled(false)} className={cn("gap-2 transition-all", !pomodoroEnabled && "shadow-timer-sm")}>
                  <Hourglass className="h-4 w-4" />
                  Stopwatch
                </Button>
                <Button variant={pomodoroEnabled ? "default" : "outline"} size="sm" onClick={() => setPomodoroEnabled(true)} className={cn("gap-2 transition-all", pomodoroEnabled && "shadow-timer-sm")}>
                  <Timer className="h-4 w-4" />
                  Pomodoro
                </Button>
                {pomodoroEnabled && <PomodoroSettingsDialog settings={pomodoro.settings} onSettingsChange={pomodoro.updateSettings} />}
              </div>

              {/* Pomodoro Indicator */}
              {pomodoroEnabled && pomodoro.isActive && <div className="flex justify-center mb-6">
                  <PomodoroIndicator currentSession={pomodoro.currentSession} sessionsBeforeLongBreak={pomodoro.settings.sessionsBeforeLongBreak} mode={pomodoro.currentMode} isBreakLong={pomodoro.state.isBreakLong} />
                </div>}

              {/* Premium Timer Display */}
              <div className="flex justify-center mb-8">
                <AnimatePresence mode="wait">
                  {pomodoroEnabled ? <motion.div key="pomodoro" initial={{
                  opacity: 0,
                  scale: 0.95
                }} animate={{
                  opacity: 1,
                  scale: 1
                }} exit={{
                  opacity: 0,
                  scale: 0.95
                }}>
                      <PremiumTimerDisplay milliseconds={pomodoro.timeRemaining} isActive={pomodoro.isActive} isPaused={pomodoro.isPaused} mode={pomodoro.currentMode} progress={pomodoro.progress} label={pomodoro.isActive ? pomodoro.currentMode === 'work' ? 'Work Session' : 'Break Time' : 'Ready to focus'} />
                    </motion.div> : <motion.div key="stopwatch" initial={{
                  opacity: 0,
                  scale: 0.95
                }} animate={{
                  opacity: 1,
                  scale: 1
                }} exit={{
                  opacity: 0,
                  scale: 0.95
                }}>
                      <PremiumTimerDisplay milliseconds={todayTime} isActive={state !== 'idle'} isPaused={state === 'paused'} mode="stopwatch" label={state === 'idle' ? "Today's Study Time" : undefined} />
                    </motion.div>}
                </AnimatePresence>
              </div>

              {/* All-time stat for stopwatch */}
              {!pomodoroEnabled && state === 'idle' && allTimeTotal > 0 && <p className="text-sm text-muted-foreground text-center mb-4">
                  All-time: <span className="font-mono text-foreground">{formatDuration(allTimeTotal)}</span>
                </p>}
              
              {/* Controls */}
              <div className="mb-8">
                <TimerControls state={pomodoroEnabled ? getPomodoroTimerState() : state} onStart={handleStart} onPause={handlePause} onResume={handleResume} onEnd={handleEnd} onSkip={pomodoroEnabled ? handleSkip : undefined} isPomodoroBreak={pomodoroEnabled && pomodoro.currentMode === 'break'} />
              </div>

              {/* Topic & Subtopic Selectors */}
              <div className="pt-6 border-t border-border/50 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <TopicSelector selectedId={currentTopicId} onSelect={setTopic} disabled={state === 'idle'} />
                  <SubtopicSelector topicId={currentTopicId} selectedId={currentSubtopicId} onSelect={setSubtopic} disabled={state === 'idle'} />
                </div>

                {state !== 'idle' && (currentTopicId || currentSubtopicId) && <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
                    {currentTopicId && <TimerDisplay milliseconds={topicTime} label="Topic" size="sm" variant="muted" />}
                    {currentSubtopicId && <TimerDisplay milliseconds={subtopicTime} label="Sub-topic" size="sm" variant="muted" />}
                  </div>}
              </div>

              {/* Break Activities */}
              <div className="pt-6 border-t border-border/50">
                <BreakActivities isBreak={pomodoroEnabled && pomodoro.currentMode === 'break'} />
              </div>

              {/* Keyboard hint */}
              <p className="text-muted-foreground text-sm text-center mt-6">
                Press <kbd className="px-1.5 py-0.5 text-xs rounded bg-muted border border-border font-mono">Space</kbd> to {state === 'idle' ? 'start' : state === 'running' ? 'pause' : 'resume'}
              </p>
            </motion.div>
            
            {/* Goals & Analytics Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <GoalsPanel refreshTrigger={historyRefreshTrigger} currentTodayTime={todayTime} />
              <AnalyticsPanel refreshTrigger={historyRefreshTrigger} selectedDate={selectedAnalyticsDate} />
            </div>

            {/* Topic Stats & Ambient Sounds */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <TopicStatsPanel refreshTrigger={historyRefreshTrigger} />
              <AmbientSounds />
            </div>
          </div>

          {/* Right Column - History, Calendar & Notes */}
          <div className="flex flex-col gap-6 min-h-0">
            {/* Session Notes & Tasks */}
            <div className="h-[320px]">
              <SessionNotesPanel />
            </div>
            
            <div className="flex-1 min-h-0">
              <HistoryPanel refreshTrigger={historyRefreshTrigger} onResumeEntry={resumeWithContext} onDataChange={refreshData} />
            </div>
            
            <CalendarHeatmap refreshTrigger={historyRefreshTrigger} selectedDate={selectedAnalyticsDate} onDateSelect={setSelectedAnalyticsDate} />
          </div>
        </div>
      </main>
    </div>;
};
export default Index;