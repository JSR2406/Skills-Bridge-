'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AddTaskModal } from './AddTaskModal';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { createTask, fetchTasks } from '../api';
import { toast } from 'sonner';
import { CalendarPlus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickAddTaskButtonProps {
  title: string;
  description?: string;
  type: any;
  subject?: string;
  relatedDoubtId?: string;
  relatedTestId?: string;
  relatedSessionId?: string;
  buttonText?: string;
  variant?: "outline" | "ghost" | "default" | "secondary";
  className?: string;
}

export function QuickAddTaskButton({ 
  title, 
  description, 
  type, 
  subject,
  relatedDoubtId,
  relatedTestId,
  relatedSessionId,
  buttonText = "Add to Planner",
  variant = "outline",
  className
}: QuickAddTaskButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();

  const handleAdd = async (data: any) => {
    if (!user) return;
    try {
      await createTask({ ...data, userId: user.uid });
      toast.success('Task added to your study planner');
    } catch (err) {
      toast.error('Failed to add task');
    }
  };

  return (
    <>
      <Button 
        variant={variant}
        size="sm"
        onClick={() => setIsOpen(true)}
        className={cn("gap-2", className)}
      >
        <CalendarPlus className="w-4 h-4" />
        {buttonText}
      </Button>

      <AddTaskModal 
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onAdd={handleAdd}
        initialData={{
          title,
          description,
          type,
          subject,
          relatedDoubtId,
          relatedTestId,
          relatedSessionId
        }}
      />
    </>
  );
}
