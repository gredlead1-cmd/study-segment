import { useState, useEffect, useCallback, useRef } from 'react';
import {
  initDB,
  createSession,
  endSession,
  openSegment,
  closeSegment,
  getSegmentsBySession,
  getAllSegments,
  getUnclosedSession,
  getOpenSegment,
  Segment,
} from '@/lib/db';

export type TimerState = 'idle' | 'running' | 'paused';

interface UseStudyTimerReturn {
  state: TimerState;
  sessionId: string | null;
  currentTopicId: string | null;
  currentSubtopicId: string | null;
  todayTime: number;
  allTimeTotal: number;
  topicTime: number;
  subtopicTime: number;
  historyRefreshTrigger: number;
  startSession: () => Promise<void>;
  pauseSession: () => Promise<void>;
  resumeSession: () => Promise<void>;
  endCurrentSession: () => Promise<void>;
  setTopic: (topicId: string | null) => Promise<void>;
  setSubtopic: (subtopicId: string | null) => Promise<void>;
  resumeWithContext: (topicId: string | null, subtopicId: string | null) => Promise<void>;
  refreshData: () => void;
}

// Get start of today in milliseconds (local timezone)
const getStartOfToday = (): number => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
};

// Compute times from segments with high precision
const computeTimesFromSegments = (
  segments: Segment[], 
  now: number,
  currentTopicId: string | null,
  currentSubtopicId: string | null,
  sessionSegments: Segment[]
) => {
  const startOfToday = getStartOfToday();
  
  let allTime = 0;
  let todayTime = 0;
  
  for (const seg of segments) {
    const endTs = seg.endTs || now;
    const duration = endTs - seg.startTs;
    allTime += duration;
    
    // Calculate today's time (handle segments that span midnight)
    if (endTs > startOfToday) {
      const effectiveStart = Math.max(seg.startTs, startOfToday);
      todayTime += endTs - effectiveStart;
    }
  }
  
  // Calculate topic/subtopic time from session segments only
  let topicTime = 0;
  let subtopicTime = 0;
  
  for (const seg of sessionSegments) {
    const endTs = seg.endTs || now;
    const duration = endTs - seg.startTs;
    
    if (seg.topicId === currentTopicId && currentTopicId !== null) {
      topicTime += duration;
    }
    if (seg.subtopicId === currentSubtopicId && currentSubtopicId !== null) {
      subtopicTime += duration;
    }
  }
  
  return { allTime, todayTime, topicTime, subtopicTime };
};

export function useStudyTimer(): UseStudyTimerReturn {
  const [state, setState] = useState<TimerState>('idle');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentTopicId, setCurrentTopicId] = useState<string | null>(null);
  const [currentSubtopicId, setCurrentSubtopicId] = useState<string | null>(null);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [allSegments, setAllSegments] = useState<Segment[]>([]);
  const [todayTime, setTodayTime] = useState(0);
  const [allTimeTotal, setAllTimeTotal] = useState(0);
  const [topicTime, setTopicTime] = useState(0);
  const [subtopicTime, setSubtopicTime] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const [historyRefreshTrigger, setHistoryRefreshTrigger] = useState(0);
  
  const currentSegmentIdRef = useRef<string | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(Date.now());
  const isRunningRef = useRef(false);

  // Stable refs for current state (avoids stale closures)
  const allSegmentsRef = useRef(allSegments);
  const segmentsRef = useRef(segments);
  const topicIdRef = useRef(currentTopicId);
  const subtopicIdRef = useRef(currentSubtopicId);
  
  // Keep refs in sync
  useEffect(() => { allSegmentsRef.current = allSegments; }, [allSegments]);
  useEffect(() => { segmentsRef.current = segments; }, [segments]);
  useEffect(() => { topicIdRef.current = currentTopicId; }, [currentTopicId]);
  useEffect(() => { subtopicIdRef.current = currentSubtopicId; }, [currentSubtopicId]);

  // High-precision timer loop using requestAnimationFrame
  const tick = useCallback(() => {
    if (!isRunningRef.current) return;
    
    const now = Date.now();
    
    // Calculate all times in one pass
    const times = computeTimesFromSegments(
      allSegmentsRef.current,
      now,
      topicIdRef.current,
      subtopicIdRef.current,
      segmentsRef.current
    );
    
    // Batch state updates
    setAllTimeTotal(times.allTime);
    setTodayTime(times.todayTime);
    setTopicTime(times.topicTime);
    setSubtopicTime(times.subtopicTime);
    
    lastUpdateRef.current = now;
    animationFrameRef.current = requestAnimationFrame(tick);
  }, []);

  // Handle visibility change (tab switching)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab became hidden - pause animation but keep tracking
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
      } else {
        // Tab became visible - resume animation if running
        if (isRunningRef.current && !animationFrameRef.current) {
          lastUpdateRef.current = Date.now();
          animationFrameRef.current = requestAnimationFrame(tick);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [tick]);

  // Initialize DB and recover any unclosed session on mount
  useEffect(() => {
    const initAndRecover = async () => {
      await initDB();
      
      const historicalSegments = await getAllSegments();
      setAllSegments(historicalSegments);
      allSegmentsRef.current = historicalSegments;
      
      const now = Date.now();
      const times = computeTimesFromSegments(historicalSegments, now, null, null, []);
      setAllTimeTotal(times.allTime);
      setTodayTime(times.todayTime);
      
      // Check for unclosed session from previous app run
      const unclosedSession = await getUnclosedSession();
      if (unclosedSession) {
        setSessionId(unclosedSession.id);
        
        const sessionSegments = await getSegmentsBySession(unclosedSession.id);
        setSegments(sessionSegments);
        segmentsRef.current = sessionSegments;
        
        const openSeg = await getOpenSegment(unclosedSession.id);
        if (openSeg) {
          currentSegmentIdRef.current = openSeg.id;
          setCurrentTopicId(openSeg.topicId);
          setCurrentSubtopicId(openSeg.subtopicId);
          topicIdRef.current = openSeg.topicId;
          subtopicIdRef.current = openSeg.subtopicId;
          setState('running');
          isRunningRef.current = true;
          animationFrameRef.current = requestAnimationFrame(tick);
        } else {
          const lastSegment = sessionSegments[sessionSegments.length - 1];
          if (lastSegment) {
            setCurrentTopicId(lastSegment.topicId);
            setCurrentSubtopicId(lastSegment.subtopicId);
            topicIdRef.current = lastSegment.topicId;
            subtopicIdRef.current = lastSegment.subtopicId;
          }
          setState('paused');
        }
      }
      
      setIsInitialized(true);
    };
    
    initAndRecover();
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [tick]);

  const refreshSegments = useCallback(async () => {
    if (sessionId) {
      const segs = await getSegmentsBySession(sessionId);
      setSegments(segs);
      segmentsRef.current = segs;
    }
    const allSegs = await getAllSegments();
    setAllSegments(allSegs);
    allSegmentsRef.current = allSegs;
    setHistoryRefreshTrigger(prev => prev + 1);
  }, [sessionId]);

  const startSession = useCallback(async () => {
    const session = await createSession();
    setSessionId(session.id);
    
    const segment = await openSegment(session.id, null, null);
    currentSegmentIdRef.current = segment.id;
    setSegments([segment]);
    segmentsRef.current = [segment];
    
    setAllSegments(prev => {
      const updated = [...prev, segment];
      allSegmentsRef.current = updated;
      return updated;
    });
    
    setState('running');
    isRunningRef.current = true;
    lastUpdateRef.current = Date.now();
    animationFrameRef.current = requestAnimationFrame(tick);
  }, [tick]);

  const pauseSession = useCallback(async () => {
    // Stop the animation loop first
    isRunningRef.current = false;
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    if (currentSegmentIdRef.current) {
      await closeSegment(currentSegmentIdRef.current);
      currentSegmentIdRef.current = null;
      await refreshSegments();
    }
    setState('paused');
  }, [refreshSegments]);

  const resumeSession = useCallback(async () => {
    if (sessionId) {
      const segment = await openSegment(sessionId, currentTopicId, currentSubtopicId);
      currentSegmentIdRef.current = segment.id;
      await refreshSegments();
    }
    setState('running');
    isRunningRef.current = true;
    lastUpdateRef.current = Date.now();
    animationFrameRef.current = requestAnimationFrame(tick);
  }, [sessionId, currentTopicId, currentSubtopicId, refreshSegments, tick]);

  const endCurrentSession = useCallback(async () => {
    // Stop the animation loop
    isRunningRef.current = false;
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    if (currentSegmentIdRef.current) {
      await closeSegment(currentSegmentIdRef.current);
      currentSegmentIdRef.current = null;
    }
    if (sessionId) {
      await endSession(sessionId);
    }
    
    const allSegs = await getAllSegments();
    setAllSegments(allSegs);
    allSegmentsRef.current = allSegs;
    
    const now = Date.now();
    const times = computeTimesFromSegments(allSegs, now, null, null, []);
    setAllTimeTotal(times.allTime);
    setTodayTime(times.todayTime);
    
    setSessionId(null);
    setCurrentTopicId(null);
    setCurrentSubtopicId(null);
    topicIdRef.current = null;
    subtopicIdRef.current = null;
    setSegments([]);
    segmentsRef.current = [];
    setTopicTime(0);
    setSubtopicTime(0);
    setState('idle');
    setHistoryRefreshTrigger(prev => prev + 1);
  }, [sessionId]);

  const setTopic = useCallback(async (topicId: string | null) => {
    if (state === 'running' && sessionId) {
      if (currentSegmentIdRef.current) {
        await closeSegment(currentSegmentIdRef.current);
      }
      
      const segment = await openSegment(sessionId, topicId, null);
      currentSegmentIdRef.current = segment.id;
      await refreshSegments();
    }
    
    setCurrentTopicId(topicId);
    setCurrentSubtopicId(null);
    topicIdRef.current = topicId;
    subtopicIdRef.current = null;
  }, [state, sessionId, refreshSegments]);

  const setSubtopic = useCallback(async (subtopicId: string | null) => {
    if (state === 'running' && sessionId) {
      if (currentSegmentIdRef.current) {
        await closeSegment(currentSegmentIdRef.current);
      }
      
      const segment = await openSegment(sessionId, currentTopicId, subtopicId);
      currentSegmentIdRef.current = segment.id;
      await refreshSegments();
    }
    
    setCurrentSubtopicId(subtopicId);
    subtopicIdRef.current = subtopicId;
  }, [state, sessionId, currentTopicId, refreshSegments]);

  const resumeWithContext = useCallback(async (topicId: string | null, subtopicId: string | null) => {
    if (state === 'idle') {
      const session = await createSession();
      setSessionId(session.id);
      
      const segment = await openSegment(session.id, topicId, subtopicId);
      currentSegmentIdRef.current = segment.id;
      setSegments([segment]);
      segmentsRef.current = [segment];
      setAllSegments(prev => {
        const updated = [...prev, segment];
        allSegmentsRef.current = updated;
        return updated;
      });
      
      setCurrentTopicId(topicId);
      setCurrentSubtopicId(subtopicId);
      topicIdRef.current = topicId;
      subtopicIdRef.current = subtopicId;
      setState('running');
      isRunningRef.current = true;
      lastUpdateRef.current = Date.now();
      animationFrameRef.current = requestAnimationFrame(tick);
      setHistoryRefreshTrigger(prev => prev + 1);
    } else if (state === 'paused' && sessionId) {
      const segment = await openSegment(sessionId, topicId, subtopicId);
      currentSegmentIdRef.current = segment.id;
      
      setCurrentTopicId(topicId);
      setCurrentSubtopicId(subtopicId);
      topicIdRef.current = topicId;
      subtopicIdRef.current = subtopicId;
      await refreshSegments();
      setState('running');
      isRunningRef.current = true;
      lastUpdateRef.current = Date.now();
      animationFrameRef.current = requestAnimationFrame(tick);
    } else if (state === 'running' && sessionId) {
      if (currentSegmentIdRef.current) {
        await closeSegment(currentSegmentIdRef.current);
      }
      
      const segment = await openSegment(sessionId, topicId, subtopicId);
      currentSegmentIdRef.current = segment.id;
      
      setCurrentTopicId(topicId);
      setCurrentSubtopicId(subtopicId);
      topicIdRef.current = topicId;
      subtopicIdRef.current = subtopicId;
      await refreshSegments();
    }
  }, [state, sessionId, refreshSegments, tick]);

  const refreshData = useCallback(() => {
    setHistoryRefreshTrigger(prev => prev + 1);
  }, []);

  return {
    state,
    sessionId,
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
    refreshData,
  };
}
