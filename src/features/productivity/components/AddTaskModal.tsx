'use client';

import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TaskType, TaskPriority } from '../types';
import { Timestamp } from 'firebase/firestore';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: any) => void;
  initialData?: any;
}

export function AddTaskModal({ isOpen, onClose, onAdd, initialData }: AddTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<TaskType>('study');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [subject, setSubject] = useState('');
  const [dueTime, setDueTime] = useState('');

  // Since useState initial value only runs once, we use useEffect to reset on open
  useEffect(() => {
    if (isOpen) {
      setTitle(initialData?.title || '');
      setDescription(initialData?.description || '');
      setType(initialData?.type || 'study');
      setPriority(initialData?.priority || 'medium');
      setSubject(initialData?.subject || '');
      setDueTime('');
    }
  }, [isOpen, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    onAdd({
      title,
      description,
      type,
      priority,
      subject,
      status: 'pending',
      dueDateTime: dueTime ? new Date(dueTime) : new Date(Date.now() + 86400000), // Default 1 day
      relatedDoubtId: initialData?.relatedDoubtId || null,
      relatedTestId: initialData?.relatedTestId || null,
      relatedSessionId: initialData?.relatedSessionId || null,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-surface-dark border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold mb-4">Create Study Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Task Title</Label>
            <Input 
              id="title" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Solve 10 questions of Calculus"
              required
              className="bg-surface border-border focus:border-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v: any) => setType(v)}>
                <SelectTrigger className="bg-surface border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="study">Study</SelectItem>
                  <SelectItem value="revision">Revision</SelectItem>
                  <SelectItem value="follow-up">Follow-up</SelectItem>
                  <SelectItem value="exam-prep">Exam Prep</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
                <SelectTrigger className="bg-surface border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject (Optional)</Label>
              <Input 
                id="subject" 
                value={subject} 
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Physics, CS, etc."
                className="bg-surface border-border"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="due">Due Date & Time</Label>
              <Input 
                id="due" 
                type="datetime-local"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="bg-surface border-border"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="desc">Description</Label>
            <Textarea 
              id="desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What specifically needs to be done?"
              className="bg-surface border-border min-h-[80px]"
            />
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="bg-brand-500 hover:bg-brand-600 text-surface font-bold">
              Add Task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
