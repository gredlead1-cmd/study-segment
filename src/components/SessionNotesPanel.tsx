import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Check, Trash2, StickyNote, ListTodo, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  StudyTask,
  SessionNote,
  loadTasks,
  addTask,
  toggleTask,
  deleteTask,
  clearCompletedTasks,
  loadNotes,
  addNote,
  deleteNote,
} from '@/lib/notes';
import { cn } from '@/lib/utils';

export function SessionNotesPanel() {
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [notes, setNotes] = useState<SessionNote[]>([]);
  const [newTaskText, setNewTaskText] = useState('');
  const [newNoteText, setNewNoteText] = useState('');

  // Load data on mount
  useEffect(() => {
    setTasks(loadTasks());
    setNotes(loadNotes());
  }, []);

  const handleAddTask = () => {
    if (!newTaskText.trim()) return;
    const task = addTask(newTaskText.trim());
    setTasks([task, ...tasks]);
    setNewTaskText('');
  };

  const handleToggleTask = (id: string) => {
    toggleTask(id);
    setTasks(loadTasks());
  };

  const handleDeleteTask = (id: string) => {
    deleteTask(id);
    setTasks(loadTasks());
  };

  const handleClearCompleted = () => {
    clearCompletedTasks();
    setTasks(loadTasks());
  };

  const handleAddNote = () => {
    if (!newNoteText.trim()) return;
    const note = addNote(newNoteText.trim());
    setNotes([note, ...notes]);
    setNewNoteText('');
  };

  const handleDeleteNote = (id: string) => {
    deleteNote(id);
    setNotes(loadNotes());
  };

  const completedCount = tasks.filter(t => t.completed).length;
  const pendingCount = tasks.length - completedCount;

  const formatNoteDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <motion.div
      className="glass-card rounded-2xl p-5 h-full flex flex-col"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Tabs defaultValue="tasks" className="flex flex-col h-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="tasks" className="gap-2">
            <ListTodo className="h-4 w-4" />
            Tasks
            {pendingCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-primary/20 text-primary">
                {pendingCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="notes" className="gap-2">
            <StickyNote className="h-4 w-4" />
            Notes
          </TabsTrigger>
        </TabsList>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="flex-1 flex flex-col min-h-0 mt-0">
          {/* Add Task Input */}
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="Add a study task..."
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
              className="flex-1"
            />
            <Button size="icon" onClick={handleAddTask} disabled={!newTaskText.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Task List */}
          <ScrollArea className="flex-1">
            <div className="space-y-2 pr-2">
              <AnimatePresence mode="popLayout">
                {tasks.map((task) => (
                  <motion.div
                    key={task.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-background/50 group",
                      task.completed && "opacity-60"
                    )}
                  >
                    <Checkbox
                      checked={task.completed}
                      onCheckedChange={() => handleToggleTask(task.id)}
                      className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <span className={cn(
                      "flex-1 text-sm",
                      task.completed && "line-through text-muted-foreground"
                    )}>
                      {task.text}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleDeleteTask(task.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </motion.div>
                ))}
              </AnimatePresence>

              {tasks.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <ListTodo className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No tasks yet</p>
                  <p className="text-xs">Add what you plan to study</p>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Clear Completed */}
          {completedCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearCompleted}
              className="mt-3 w-full text-muted-foreground"
            >
              <Check className="h-4 w-4 mr-2" />
              Clear {completedCount} completed
            </Button>
          )}
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes" className="flex-1 flex flex-col min-h-0 mt-0">
          {/* Add Note Input */}
          <div className="mb-4">
            <Textarea
              placeholder="Quick note... (press Enter to add)"
              value={newNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleAddNote();
                }
              }}
              className="min-h-[60px] resize-none"
            />
            <Button
              size="sm"
              onClick={handleAddNote}
              disabled={!newNoteText.trim()}
              className="mt-2 w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Note
            </Button>
          </div>

          {/* Notes List */}
          <ScrollArea className="flex-1">
            <div className="space-y-3 pr-2">
              <AnimatePresence mode="popLayout">
                {notes.map((note) => (
                  <motion.div
                    key={note.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="p-3 rounded-lg border border-border/50 bg-background/50 group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm whitespace-pre-wrap flex-1">{note.text}</p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                        onClick={() => handleDeleteNote(note.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatNoteDate(note.createdAt)}
                    </p>
                  </motion.div>
                ))}
              </AnimatePresence>

              {notes.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <StickyNote className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No notes yet</p>
                  <p className="text-xs">Jot down ideas during study</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
