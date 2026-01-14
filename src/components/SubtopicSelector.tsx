import { useState, useEffect } from 'react';
import { Plus, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { getSubtopicsByTopic, createSubtopic, Subtopic } from '@/lib/db';

interface SubtopicSelectorProps {
  topicId: string | null;
  selectedId: string | null;
  onSelect: (subtopicId: string | null) => void;
  disabled?: boolean;
}

export const SubtopicSelector = ({ 
  topicId, 
  selectedId, 
  onSelect, 
  disabled 
}: SubtopicSelectorProps) => {
  const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    if (topicId) {
      loadSubtopics();
    } else {
      setSubtopics([]);
    }
  }, [topicId]);

  const loadSubtopics = async () => {
    if (topicId) {
      const subs = await getSubtopicsByTopic(topicId);
      setSubtopics(subs);
    }
  };

  const handleAddSubtopic = async () => {
    if (newName.trim() && topicId) {
      const subtopic = await createSubtopic(topicId, newName.trim());
      setSubtopics([...subtopics, subtopic]);
      onSelect(subtopic.id);
      setNewName('');
      setIsAdding(false);
    }
  };

  const selectedSubtopic = subtopics.find(s => s.id === selectedId);
  const isDisabled = disabled || !topicId;

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
        Sub-topic
      </span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild disabled={isDisabled}>
          <Button 
            variant="outline" 
            className="w-full justify-between bg-card border-border hover:bg-accent"
          >
            <span className={selectedSubtopic ? 'text-foreground' : 'text-muted-foreground'}>
              {!topicId 
                ? 'Select topic first...' 
                : selectedSubtopic?.name || 'Select sub-topic...'}
            </span>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 bg-card border-border">
          <DropdownMenuItem 
            onClick={() => onSelect(null)}
            className="text-muted-foreground"
          >
            No sub-topic
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {subtopics.map((subtopic) => (
            <DropdownMenuItem
              key={subtopic.id}
              onClick={() => onSelect(subtopic.id)}
              className={selectedId === subtopic.id ? 'bg-accent' : ''}
            >
              {subtopic.name}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          {isAdding ? (
            <div className="p-2 flex gap-2">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Sub-topic name..."
                className="h-8 bg-background"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddSubtopic();
                  if (e.key === 'Escape') setIsAdding(false);
                }}
              />
              <Button size="sm" onClick={handleAddSubtopic} className="h-8">
                Add
              </Button>
            </div>
          ) : (
            <DropdownMenuItem onClick={() => setIsAdding(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add new sub-topic
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
