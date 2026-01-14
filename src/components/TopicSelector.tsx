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
import { getAllTopics, createTopic, Topic } from '@/lib/db';

interface TopicSelectorProps {
  selectedId: string | null;
  onSelect: (topicId: string | null) => void;
  disabled?: boolean;
}

export const TopicSelector = ({ selectedId, onSelect, disabled }: TopicSelectorProps) => {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    loadTopics();
  }, []);

  const loadTopics = async () => {
    const allTopics = await getAllTopics();
    setTopics(allTopics);
  };

  const handleAddTopic = async () => {
    if (newName.trim()) {
      const topic = await createTopic(newName.trim());
      setTopics([...topics, topic]);
      onSelect(topic.id);
      setNewName('');
      setIsAdding(false);
    }
  };

  const selectedTopic = topics.find(t => t.id === selectedId);

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
        Topic
      </span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild disabled={disabled}>
          <Button 
            variant="outline" 
            className="w-full justify-between bg-card border-border hover:bg-accent"
          >
            <span className={selectedTopic ? 'text-foreground' : 'text-muted-foreground'}>
              {selectedTopic?.name || 'Select topic...'}
            </span>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 bg-card border-border">
          <DropdownMenuItem 
            onClick={() => onSelect(null)}
            className="text-muted-foreground"
          >
            No topic
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {topics.map((topic) => (
            <DropdownMenuItem
              key={topic.id}
              onClick={() => onSelect(topic.id)}
              className={selectedId === topic.id ? 'bg-accent' : ''}
            >
              {topic.name}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          {isAdding ? (
            <div className="p-2 flex gap-2">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Topic name..."
                className="h-8 bg-background"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddTopic();
                  if (e.key === 'Escape') setIsAdding(false);
                }}
              />
              <Button size="sm" onClick={handleAddTopic} className="h-8">
                Add
              </Button>
            </div>
          ) : (
            <DropdownMenuItem onClick={() => setIsAdding(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add new topic
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
