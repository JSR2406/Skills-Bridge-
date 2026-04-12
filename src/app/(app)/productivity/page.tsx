'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { 
  fetchTasks, 
  createTask, 
  deleteTask, 
  toggleTaskStatus, 
  getProductivityContext,
  getLastAILog,
  saveAILog
} from '@/features/productivity/api';
import { awardPoints } from '@/features/reputation/api';
import { Task, AIStudyPlan, StudyBlock } from '@/features/productivity/types';
import { TaskCard } from '@/features/productivity/components/TaskCard';
import { AIStudyPlanView } from '@/features/productivity/components/AIStudyPlanView';
import { AddTaskModal } from '@/features/productivity/components/AddTaskModal';
import { generateProductivityPlan } from '@/lib/ai/productivityCoach';
import { Button } from '@/components/ui/button';
import { 
  Sparkles, 
  Plus, 
  Calendar, 
  Filter,
  CheckCircle,
  Clock,
  LayoutDashboard
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function ProductivityPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentPlan, setCurrentPlan] = useState<AIStudyPlan | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'done'>('pending');
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  async function loadData() {
    if (!user) return;
    try {
      setIsLoadingTasks(true);
      const [fetchedTasks, lastLog] = await Promise.all([
        fetchTasks(user.uid),
        getLastAILog(user.uid)
      ]);
      setTasks(fetchedTasks);
      if (lastLog) {
        setCurrentPlan(lastLog.suggestions);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load productivity data');
    } finally {
      setIsLoadingTasks(false);
    }
  }

  const handleGeneratePlan = async () => {
    if (!user) return;
    setIsGenerating(true);
    try {
      toast.info('Analyzing your learning progress...');
      const context = await getProductivityContext(user.uid);
      const plan = await generateProductivityPlan(context);
      setCurrentPlan(plan);
      
      // Save log
      await saveAILog({
        userId: user.uid,
        timeframe: 'today',
        inputSummary: `Plan generated from ${context.recentDoubts.length} doubts and ${context.recentTestAttempts.length} attempts`,
        suggestions: plan
      });
      
      toast.success('Your personalized study plan is ready!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate study plan');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddTask = async (data: any) => {
    if (!user) return;
    try {
      await createTask({ ...data, userId: user.uid });
      const updated = await fetchTasks(user.uid);
      setTasks(updated);
      toast.success('Task added to planner');
    } catch (err) {
      toast.error('Failed to add task');
    }
  };

  const [modalInitialData, setModalInitialData] = useState<any>(null);

  const handleCreateTaskFromBlock = (block: StudyBlock) => {
    setModalInitialData({
      title: block.title,
      description: block.description,
      type: 'study',
      subject: block.subject || '',
      relatedDoubtId: block.relatedDoubtId || null,
      relatedTestId: block.relatedTestId || null,
      relatedSessionId: block.relatedSessionId || null,
    });
    setIsModalOpen(true);
  };


  const handleToggleStatus = async (task: Task) => {
    try {
      const newStatus = task.status === 'done' ? 'pending' : 'done';
      await toggleTaskStatus(task.id, task.status);
      
      if (newStatus === 'done' && user) {
        await awardPoints(user.uid, 'task_completed', task.id, 'task');
        toast.success('Task completed! +10 reputation 🎉');
      }

      const updated = tasks.map(t => 
        t.id === task.id ? { ...t, status: newStatus } : t
      );
      setTasks(updated as Task[]);
    } catch (err) {
      toast.error('Failed to update task');
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await deleteTask(id);
      setTasks(tasks.filter(t => t.id !== id));
      toast.success('Task removed');
    } catch (err) {
      toast.error('Failed to delete task');
    }
  };

  const filteredTasks = tasks.filter(t => {
    if (filter === 'all') return true;
    return t.status === filter;
  });

  return (
    <div className="max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <LayoutDashboard className="w-8 h-8 text-brand-400" />
            Study Planner
          </h1>
          <p className="text-[#8899b8] mt-1 pr-6 max-w-xl">
            Optimized task management and AI-generated study blocks to keep your learning on track.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Button 
            onClick={handleGeneratePlan}
            disabled={isGenerating}
            className="w-full sm:w-auto bg-brand-500 hover:bg-brand-600 text-surface font-bold gap-2 px-6 shadow-[0_0_20px_rgba(79,219,200,0.2)]"
          >
            <Sparkles className={cn("w-4 h-4", isGenerating && "animate-spin")} />
            {isGenerating ? 'Analyzing...' : 'AI Generate Plan'}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto border-brand-500/20 hover:bg-brand-500/10 text-brand-400 gap-2 font-bold"
          >
            <Plus className="w-4 h-4" />
            Add Task
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:grid lg:grid-cols-5 gap-8">
        {/* Task List Column - Primary on mobile */}
        <div className="lg:col-span-3 space-y-6 order-1 lg:order-2">
          {/* Filters */}
          <div className="flex items-center gap-3 p-1 rounded-lg bg-surface/50 border border-border w-fit overflow-x-auto max-w-full no-scrollbar">
            {(['pending', 'done', 'all'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={cn(
                  "px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap",
                  filter === t 
                    ? "bg-brand-500 text-surface shadow-md" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t === 'pending' ? 'To Do' : t}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="space-y-4">
            {isLoadingTasks ? (
              [1, 2, 3].map(i => (
                <div key={i} className="h-28 bg-surface rounded-xl border border-border animate-pulse" />
              ))
            ) : filteredTasks.length > 0 ? (
              filteredTasks.map(task => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  onToggleStatus={handleToggleStatus}
                  onDelete={handleDeleteTask}
                />
              ))
            ) : (
              <div className="p-8 md:p-12 rounded-2xl border border-dashed border-border flex flex-col items-center justify-center text-center bg-surface/20">
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-muted/10 flex items-center justify-center mb-4">
                  <Calendar className="w-6 h-6 md:w-8 md:h-8 text-muted-foreground/30" />
                </div>
                <h3 className="text-base md:text-lg font-bold text-foreground">
                  {filter === 'done' ? 'No completed tasks' : 'All caught up!'}
                </h3>
                <p className="text-xs md:text-sm text-muted-foreground mt-2">
                  {filter === 'pending' ? 'Add some tasks to start your study session.' : ''}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* AI Suggestion Column - Below tasks on mobile */}
        <div className="lg:col-span-2 space-y-6 order-2 lg:order-1">
          {currentPlan ? (
            <AIStudyPlanView 
              plan={currentPlan} 
              onCreateTask={handleCreateTaskFromBlock}
              isLoading={isGenerating}
            />
          ) : (
            <div className="p-8 rounded-2xl border border-dashed border-border flex flex-col items-center justify-center text-center bg-surface/30">
              <div className="w-16 h-16 rounded-full bg-brand-500/10 flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 text-brand-400/50" />
              </div>
              <h3 className="text-lg font-bold text-foreground">No Study Plan Yet</h3>
              <p className="text-sm text-muted-foreground mt-2 max-w-[240px]">
                Click 'AI Generate Plan' to get personalized insights based on your activity.
              </p>
            </div>
          )}
        </div>
      </div>

      <AddTaskModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setModalInitialData(null);
        }} 
        onAdd={handleAddTask}
        initialData={modalInitialData}
      />

    </div>
  );
}
