// Session notes and tasks management

export interface StudyTask {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}

export interface SessionNote {
  id: string;
  text: string;
  createdAt: number;
  sessionDate: string; // YYYY-MM-DD format
}

const TASKS_STORAGE_KEY = 'studywatch-tasks';
const NOTES_STORAGE_KEY = 'studywatch-notes';

// Generate unique ID
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};

// Get today's date string
const getTodayString = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

// Tasks (to-do list)
export const loadTasks = (): StudyTask[] => {
  const stored = localStorage.getItem(TASKS_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }
  return [];
};

export const saveTasks = (tasks: StudyTask[]): void => {
  localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
};

export const addTask = (text: string): StudyTask => {
  const tasks = loadTasks();
  const newTask: StudyTask = {
    id: generateId(),
    text,
    completed: false,
    createdAt: Date.now(),
  };
  tasks.unshift(newTask);
  saveTasks(tasks);
  return newTask;
};

export const toggleTask = (id: string): void => {
  const tasks = loadTasks();
  const task = tasks.find(t => t.id === id);
  if (task) {
    task.completed = !task.completed;
    saveTasks(tasks);
  }
};

export const deleteTask = (id: string): void => {
  const tasks = loadTasks().filter(t => t.id !== id);
  saveTasks(tasks);
};

export const clearCompletedTasks = (): void => {
  const tasks = loadTasks().filter(t => !t.completed);
  saveTasks(tasks);
};

// Notes
export const loadNotes = (): SessionNote[] => {
  const stored = localStorage.getItem(NOTES_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }
  return [];
};

export const saveNotes = (notes: SessionNote[]): void => {
  localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
};

export const addNote = (text: string): SessionNote => {
  const notes = loadNotes();
  const newNote: SessionNote = {
    id: generateId(),
    text,
    createdAt: Date.now(),
    sessionDate: getTodayString(),
  };
  notes.unshift(newNote);
  saveNotes(notes);
  return newNote;
};

export const deleteNote = (id: string): void => {
  const notes = loadNotes().filter(n => n.id !== id);
  saveNotes(notes);
};

export const getNotesByDate = (date: string): SessionNote[] => {
  return loadNotes().filter(n => n.sessionDate === date);
};

export const getTodayNotes = (): SessionNote[] => {
  return getNotesByDate(getTodayString());
};
