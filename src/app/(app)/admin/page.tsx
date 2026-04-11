'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { getAllUsers, updateUserRole, getAllDoubts, deleteDoubt } from '@/features/admin/api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { ShieldAlert, Users, MessageSquareQuote, Shield, ShieldCheck, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminDashboard() {
  const { profile, loading } = useAuth();
  const router = useRouter();

  const [users, setUsers] = useState<any[]>([]);
  const [doubts, setDoubts] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (profile?.role !== 'admin') {
      router.push('/feed');
      return;
    }

    async function loadData() {
      setFetching(true);
      try {
        const [u, d] = await Promise.all([
          getAllUsers(),
          getAllDoubts()
        ]);
        setUsers(u);
        setDoubts(d);
      } catch (err: any) {
        toast.error("Failed to load admin data: " + err.message);
      } finally {
        setFetching(false);
      }
    }
    loadData();
  }, [profile, loading, router]);

  const handleRoleChange = async (userId: string, newRole: 'student' | 'mentor' | 'admin') => {
    try {
      await updateUserRole(userId, newRole);
      toast.success(`Role updated to ${newRole}`);
      setUsers(prev => prev.map(u => u.uid === userId ? { ...u, role: newRole } : u));
    } catch (err: any) {
      toast.error('Could not update role: ' + err.message);
    }
  };

  const handleDeleteDoubt = async (doubtId: string) => {
    if (!confirm('Are you sure you want to permanently delete this doubt?')) return;
    
    try {
      await deleteDoubt(doubtId);
      toast.success('Doubt deleted successfully');
      setDoubts(prev => prev.filter(d => d.id !== doubtId));
    } catch (err: any) {
      toast.error('Could not delete doubt: ' + err.message);
    }
  };

  if (loading || fetching) return <LoadingSkeleton />;
  if (profile?.role !== 'admin') return null;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3 text-red-500 font-['Plus_Jakarta_Sans']">
            <ShieldAlert className="w-8 h-8" />
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">Manage platform content and users.</p>
        </div>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full max-w-[400px] grid-cols-2 bg-surface-elevated border border-border">
          <TabsTrigger value="users" className="data-[state=active]:bg-brand-500/20 data-[state=active]:text-brand-400">
            <Users className="w-4 h-4 mr-2" /> Users
          </TabsTrigger>
          <TabsTrigger value="content" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400">
            <MessageSquareQuote className="w-4 h-4 mr-2" /> Content Mod
          </TabsTrigger>
        </TabsList>
        
        {/* USERS TAB */}
        <TabsContent value="users" className="mt-6 space-y-4">
          <Card className="bg-surface-card border-border shadow-sm">
            <CardHeader>
               <CardTitle>User Management</CardTitle>
               <CardDescription>Total Users: {users.length}</CardDescription>
            </CardHeader>
            <CardContent>
               <div className="rounded-md border border-border overflow-hidden">
                 <div className="grid grid-cols-12 p-3 bg-surface text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <div className="col-span-4">User</div>
                    <div className="col-span-3">Email</div>
                    <div className="col-span-2">Reputation</div>
                    <div className="col-span-3 text-right">Role</div>
                 </div>
                 <div className="divide-y divide-border">
                   {users.map(u => (
                     <div key={u.uid} className="grid grid-cols-12 p-3 items-center hover:bg-surface/50 transition-colors">
                       <div className="col-span-4 flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-surface-elevated flex items-center justify-center overflow-hidden shrink-0">
                           {u.avatarUrl ? <img src={u.avatarUrl} alt="Avatar" className="w-full h-full object-cover" /> : <span className="font-bold">{u.name?.charAt(0)}</span>}
                         </div>
                         <div className="truncate">
                           <p className="text-sm font-semibold text-foreground truncate">{u.name}</p>
                           <p className="text-[10px] text-muted-foreground truncate">{u.college || 'No college set'}</p>
                         </div>
                       </div>
                       <div className="col-span-3 text-sm text-foreground truncate pl-2">{u.email}</div>
                       <div className="col-span-2 text-sm font-bold text-brand-400 pl-2">{u.reputation || 0} pts</div>
                       <div className="col-span-3 flex justify-end">
                         <Select defaultValue={u.role || 'student'} onValueChange={(val: any) => handleRoleChange(u.uid, val)}>
                           <SelectTrigger className="w-[110px] h-8 text-xs bg-surface border-border">
                             <SelectValue />
                           </SelectTrigger>
                           <SelectContent>
                             <SelectItem value="student">Student</SelectItem>
                             <SelectItem value="mentor">Mentor</SelectItem>
                             <SelectItem value="admin">Admin</SelectItem>
                           </SelectContent>
                         </Select>
                       </div>
                     </div>
                   ))}
                 </div>
               </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CONTENT TAB */}
        <TabsContent value="content" className="mt-6 space-y-4">
          <Card className="bg-surface-card border-border shadow-sm">
            <CardHeader>
               <CardTitle>Content Moderation</CardTitle>
               <CardDescription>Review and clean up inappropriate doubts.</CardDescription>
            </CardHeader>
            <CardContent>
               <div className="space-y-4">
                 {doubts.length === 0 ? (
                   <p className="text-muted-foreground text-center py-4">No content found.</p>
                 ) : (
                   doubts.map(d => (
                     <div key={d.id} className="flex flex-col sm:flex-row justify-between gap-4 p-4 rounded-xl border border-border bg-surface hover:bg-surface-elevated transition-colors">
                        <div>
                          <h4 className="font-bold text-foreground">{d.title}</h4>
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{d.content}</p>
                          <div className="flex gap-2 mt-2">
                             <Badge variant="outline" className="text-[10px]">Author: {d.authorName}</Badge>
                             <Badge variant="outline" className="text-[10px] bg-surface-elevated">Answers: {d.answersCount || 0}</Badge>
                          </div>
                        </div>
                        <div className="flex shrink-0">
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            onClick={() => handleDeleteDoubt(d.id)}
                            className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20"
                          >
                             <Trash2 className="w-4 h-4 mr-2" /> Delete
                          </Button>
                        </div>
                     </div>
                   ))
                 )}
               </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
