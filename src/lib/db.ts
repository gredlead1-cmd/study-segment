// IndexedDB wrapper for segment-based time tracking

const DB_NAME = 'studywatch';
const DB_VERSION = 1;

export interface Session {
  id: string;
  startTs: number;
  endTs: number | null;
}

export interface Topic {
  id: string;
  name: string;
  createdAt: number;
}

export interface Subtopic {
  id: string;
  topicId: string;
  name: string;
  createdAt: number;
}

export interface Segment {
  id: string;
  sessionId: string;
  topicId: string | null;
  subtopicId: string | null;
  startTs: number;
  endTs: number | null;
}

export interface Note {
  id: string;
  sessionId: string;
  topicId: string | null;
  subtopicId: string | null;
  atTs: number;
  text: string;
}

let dbInstance: IDBDatabase | null = null;

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Sessions store
      if (!db.objectStoreNames.contains('sessions')) {
        db.createObjectStore('sessions', { keyPath: 'id' });
      }

      // Topics store
      if (!db.objectStoreNames.contains('topics')) {
        db.createObjectStore('topics', { keyPath: 'id' });
      }

      // Subtopics store
      if (!db.objectStoreNames.contains('subtopics')) {
        const subtopicStore = db.createObjectStore('subtopics', { keyPath: 'id' });
        subtopicStore.createIndex('topicId', 'topicId', { unique: false });
      }

      // Segments store
      if (!db.objectStoreNames.contains('segments')) {
        const segmentStore = db.createObjectStore('segments', { keyPath: 'id' });
        segmentStore.createIndex('sessionId', 'sessionId', { unique: false });
        segmentStore.createIndex('topicId', 'topicId', { unique: false });
      }

      // Notes store
      if (!db.objectStoreNames.contains('notes')) {
        const noteStore = db.createObjectStore('notes', { keyPath: 'id' });
        noteStore.createIndex('sessionId', 'sessionId', { unique: false });
      }
    };
  });
};

// Generic helpers
const getStore = async (storeName: string, mode: IDBTransactionMode = 'readonly') => {
  const db = await initDB();
  return db.transaction(storeName, mode).objectStore(storeName);
};

const generateId = () => crypto.randomUUID();

// Session helpers
export const createSession = async (): Promise<Session> => {
  const session: Session = {
    id: generateId(),
    startTs: Date.now(),
    endTs: null,
  };
  const store = await getStore('sessions', 'readwrite');
  return new Promise((resolve, reject) => {
    const request = store.add(session);
    request.onsuccess = () => resolve(session);
    request.onerror = () => reject(request.error);
  });
};

export const getUnclosedSession = async (): Promise<Session | null> => {
  const store = await getStore('sessions', 'readonly');
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => {
      const sessions = request.result as Session[];
      const unclosed = sessions.find(s => !s.endTs);
      resolve(unclosed || null);
    };
    request.onerror = () => reject(request.error);
  });
};

export const getOpenSegment = async (sessionId: string): Promise<Segment | null> => {
  const segments = await getSegmentsBySession(sessionId);
  const open = segments.find(s => !s.endTs);
  return open || null;
};

export const endSession = async (id: string): Promise<void> => {
  const store = await getStore('sessions', 'readwrite');
  return new Promise((resolve, reject) => {
    const getRequest = store.get(id);
    getRequest.onsuccess = () => {
      const session = getRequest.result;
      if (session) {
        session.endTs = Date.now();
        const putRequest = store.put(session);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      } else {
        resolve();
      }
    };
    getRequest.onerror = () => reject(getRequest.error);
  });
};

// Topic helpers
export const createTopic = async (name: string): Promise<Topic> => {
  const topic: Topic = {
    id: generateId(),
    name,
    createdAt: Date.now(),
  };
  const store = await getStore('topics', 'readwrite');
  return new Promise((resolve, reject) => {
    const request = store.add(topic);
    request.onsuccess = () => resolve(topic);
    request.onerror = () => reject(request.error);
  });
};

export const getAllTopics = async (): Promise<Topic[]> => {
  const store = await getStore('topics');
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// Subtopic helpers
export const createSubtopic = async (topicId: string, name: string): Promise<Subtopic> => {
  const subtopic: Subtopic = {
    id: generateId(),
    topicId,
    name,
    createdAt: Date.now(),
  };
  const store = await getStore('subtopics', 'readwrite');
  return new Promise((resolve, reject) => {
    const request = store.add(subtopic);
    request.onsuccess = () => resolve(subtopic);
    request.onerror = () => reject(request.error);
  });
};

export const getSubtopicsByTopic = async (topicId: string): Promise<Subtopic[]> => {
  const store = await getStore('subtopics');
  const index = store.index('topicId');
  return new Promise((resolve, reject) => {
    const request = index.getAll(topicId);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// Segment helpers - CRITICAL for accurate time tracking
export const openSegment = async (
  sessionId: string,
  topicId: string | null,
  subtopicId: string | null
): Promise<Segment> => {
  const segment: Segment = {
    id: generateId(),
    sessionId,
    topicId,
    subtopicId,
    startTs: Date.now(),
    endTs: null,
  };
  const store = await getStore('segments', 'readwrite');
  return new Promise((resolve, reject) => {
    const request = store.add(segment);
    request.onsuccess = () => resolve(segment);
    request.onerror = () => reject(request.error);
  });
};

export const closeSegment = async (id: string): Promise<void> => {
  const store = await getStore('segments', 'readwrite');
  return new Promise((resolve, reject) => {
    const getRequest = store.get(id);
    getRequest.onsuccess = () => {
      const segment = getRequest.result;
      if (segment && !segment.endTs) {
        segment.endTs = Date.now();
        const putRequest = store.put(segment);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      } else {
        resolve();
      }
    };
    getRequest.onerror = () => reject(getRequest.error);
  });
};

export const getSegmentsBySession = async (sessionId: string): Promise<Segment[]> => {
  const store = await getStore('segments');
  const index = store.index('sessionId');
  return new Promise((resolve, reject) => {
    const request = index.getAll(sessionId);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const getAllSegments = async (): Promise<Segment[]> => {
  const store = await getStore('segments');
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// Calculate total time from segments
export const calculateTotalTime = (segments: Segment[]): number => {
  const now = Date.now();
  return segments.reduce((total, segment) => {
    const endTs = segment.endTs || now;
    return total + (endTs - segment.startTs);
  }, 0);
};

export const calculateTimeByTopic = (segments: Segment[]): Map<string, number> => {
  const now = Date.now();
  const timeByTopic = new Map<string, number>();
  
  segments.forEach((segment) => {
    if (segment.topicId) {
      const endTs = segment.endTs || now;
      const duration = endTs - segment.startTs;
      const current = timeByTopic.get(segment.topicId) || 0;
      timeByTopic.set(segment.topicId, current + duration);
    }
  });
  
  return timeByTopic;
};

// Delete a session and all its segments
export const deleteSession = async (sessionId: string): Promise<void> => {
  // Delete all segments for this session
  const segments = await getSegmentsBySession(sessionId);
  const segmentStore = await getStore('segments', 'readwrite');
  
  await Promise.all(
    segments.map(seg => 
      new Promise<void>((resolve, reject) => {
        const request = segmentStore.delete(seg.id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      })
    )
  );
  
  // Delete the session
  const sessionStore = await getStore('sessions', 'readwrite');
  return new Promise((resolve, reject) => {
    const request = sessionStore.delete(sessionId);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// Delete multiple sessions
export const deleteSessions = async (sessionIds: string[]): Promise<void> => {
  for (const sessionId of sessionIds) {
    await deleteSession(sessionId);
  }
};
