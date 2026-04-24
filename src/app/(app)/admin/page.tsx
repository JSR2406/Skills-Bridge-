'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { getAllUsers, updateUserRole, getAllDoubts, deleteDoubt, getPlatformStats } from '@/features/admin/api';
import { getPendingMentorApplications, approveMentorApplication, rejectMentorApplication } from '@/features/mentors/api';
import { PendingMentorApplication } from '@/features/mentors/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { ShieldAlert, Users, MessageSquareQuote, Shield, ShieldCheck, Trash2, BarChart3, TrendingUp, Award, Zap, CheckCircle2, XCircle, GraduationCap, IndianRupee, Star } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminDashboard() {
  const { profile, loading } = useAuth();
  const router = useRouter();

  const [users, setUsers] = useState<any[]>([]);
  const [doubts, setDoubts] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [fetching, setFetching] = useState(true);
  const [pendingMentors, setPendingMentors] = useState<PendingMentorApplication[]>([]);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (profile?.role !== 'admin') {
      router.push('/feed');
      return;
    }

    async function loadData() {
      setFetching(true);
      try {
        const [u, d, s, p] = await Promise.all([
          getAllUsers(),
          getAllDoubts(),
          getPlatformStats(),
          getPendingMentorApplications(),
        ]);
        setUsers(u);
        setDoubts(d);
        setStats(s);
        setPendingMentors(p);
      } catch (err: any) {
        toast.error("Failed to load admin data: " + err.message);
      } finally {
        setFetching(false);
      }
    }
    loadData();
  }, [profile, loading, router]);

  const handleApprove = async (userId: string) => {
    try {
      setApprovingId(userId);
      await approveMentorApplication(userId);
      toast.success('Mentor approved and live!');
      setPendingMentors(prev => prev.filter(m => m.userId !== userId));
    } catch (err: any) {
      toast.error('Approval failed: ' + err.message);
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async (userId: string) => {
    if (!confirm('Reject and delete this mentor application? This cannot be undone.')) return;
    try {
      setApprovingId(userId);
      await rejectMentorApplication(userId);
      toast.success('Application rejected');
      setPendingMentors(prev => prev.filter(m => m.userId !== userId));
    } catch (err: any) {
      toast.error('Rejection failed: ' + err.message);
    } finally {
      setApprovingId(null);
    }
  };

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
    <div className="max-w-6xl mx-auto space-y-6 pb-20 animate-fade-in px-4">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3 text-foreground font-['Plus_Jakarta_Sans']">
            <div className="p-2 bg-red-500/10 rounded-lg">
              <ShieldAlert className="w-8 h-8 text-red-500" />
            </div>
            Admin Controls
          </h1>
          <p className="text-muted-foreground mt-2">Platform monitoring and management dashboard.</p>
        </div>
      </div>

      <Tabs defaultValue="analytics" className="w-full">
        <TabsList className="grid w-full max-w-[800px] grid-cols-4 bg-surface-elevated border border-border">
          <TabsTrigger value="analytics" className="data-[state=active]:bg-brand-500/20 data-[state=active]:text-brand-400">
            <BarChart3 className="w-4 h-4 mr-2" /> Analytics
          </TabsTrigger>
          <TabsTrigger value="users" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400">
            <Users className="w-4 h-4 mr-2" /> Users
          </TabsTrigger>
          <TabsTrigger value="content" className="data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-400">
            <MessageSquareQuote className="w-4 h-4 mr-2" /> Content
          </TabsTrigger>
          <TabsTrigger value="mentors" className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400 relative">
            <GraduationCap className="w-4 h-4 mr-2" /> Mentors
            {pendingMentors.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-black bg-red-500 text-white">
                {pendingMentors.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ANALYTICS TAB */}
        <TabsContent value="analytics" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-surface-card border-border shadow-sm overflow-hidden group">
              <div className="h-1 w-full bg-brand-500/50" />
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                    <h3 className="text-2xl font-bold text-foreground mt-1">{stats?.totalUsers || 0}</h3>
                  </div>
                  <Users className="w-5 h-5 text-brand-400 opacity-50 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="mt-4 flex items-center gap-2 text-xs text-brand-400 font-medium bg-brand-500/5 px-2 py-1 rounded w-fit">
                  <TrendingUp className="w-3 h-3" />
                  <span>+12% vs last week</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-surface-card border-border shadow-sm overflow-hidden group">
              <div className="h-1 w-full bg-purple-500/50" />
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Solved Doubts</p>
                    <h3 className="text-2xl font-bold text-foreground mt-1">{stats?.totalDoubts || 0}</h3>
                  </div>
                  <Zap className="w-5 h-5 text-purple-400 opacity-50 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="mt-4 flex items-center gap-2 text-xs text-purple-400 font-medium bg-purple-500/5 px-2 py-1 rounded w-fit">
                  <span className="font-bold">84%</span> AI Success Rate
                </div>
              </CardContent>
            </Card>

            <Card className="bg-surface-card border-border shadow-sm overflow-hidden group">
              <div className="h-1 w-full bg-green-500/50" />
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Mentors Active</p>
                    <h3 className="text-2xl font-bold text-foreground mt-1">{stats?.mentorsCount || 0}</h3>
                  </div>
                  <Award className="w-5 h-5 text-green-400 opacity-50 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="mt-4 flex items-center gap-2 text-xs text-green-400 font-medium bg-green-500/5 px-2 py-1 rounded w-fit">
                  Verified Experts
                </div>
              </CardContent>
            </Card>

            <Card className="bg-surface-card border-border shadow-sm overflow-hidden group">
              <div className="h-1 w-full bg-orange-500/50" />
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">App Engagement</p>
                    <h3 className="text-2xl font-bold text-foreground mt-1">{stats?.totalAttempts || 0}</h3>
                  </div>
                  <BarChart3 className="w-5 h-5 text-orange-400 opacity-50 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="mt-4 flex items-center gap-2 text-xs text-orange-400 font-medium bg-orange-500/5 px-2 py-1 rounded w-fit">
                  Practice Sessions
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             <Card className="bg-surface-card border-border shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">User Role Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                       <div className="flex justify-between text-sm">
                         <span className="text-muted-foreground">Students</span>
                         <span className="text-foreground font-bold">{stats?.studentsCount}</span>
                       </div>
                       <div className="w-full h-2 bg-surface rounded-full overflow-hidden border border-border/50">
                         <div className="h-full bg-brand-500" style={{ width: `${(stats?.studentsCount / stats?.totalUsers) * 100}%` }} />
                       </div>
                    </div>
                    <div className="space-y-2">
                       <div className="flex justify-between text-sm">
                         <span className="text-muted-foreground">Mentors</span>
                         <span className="text-foreground font-bold">{stats?.mentorsCount}</span>
                       </div>
                       <div className="w-full h-2 bg-surface rounded-full overflow-hidden border border-border/50">
                         <div className="h-full bg-green-500" style={{ width: `${(stats?.mentorsCount / stats?.totalUsers) * 100}%` }} />
                       </div>
                    </div>
                  </div>
                </CardContent>
             </Card>

             <Card className="bg-surface-card border-border shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Platform Health</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center py-10">
                   <div className="text-center">
                      <div className="relative inline-flex items-center justify-center p-6 rounded-full bg-brand-500/5 border-4 border-brand-500/20">
                         <ShieldCheck className="w-12 h-12 text-brand-500" />
                         <div className="absolute inset-0 rounded-full border-4 border-brand-500 border-t-transparent animate-spin-slow" />
                      </div>
                      <h4 className="mt-4 font-bold text-xl">All Systems Operational</h4>
                      <p className="text-sm text-muted-foreground">AI Engines, Real-time Chat & WebRTC</p>
                   </div>
                </CardContent>
             </Card>
          </div>
        </TabsContent>
        
        {/* USERS TAB */}
        <TabsContent value="users" className="mt-6 space-y-4">
          <Card className="bg-surface-card border-border shadow-sm">
            <CardHeader>
               <CardTitle>User Management</CardTitle>
               <CardDescription>Total Registered: {users.length}</CardDescription>
            </CardHeader>
            <CardContent>
// ... rest of the file stays same
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

        {/* MENTOR APPROVALS TAB */}
        <TabsContent value="mentors" className="mt-6 space-y-4">
          <Card className="bg-surface-card border-border">
            <CardHeader className="border-b border-border/50">
              <CardTitle className="flex items-center gap-2 text-lg">
                <GraduationCap className="w-5 h-5 text-green-400" />
                Pending Mentor Applications
                {pendingMentors.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-black bg-red-500/15 text-red-400 border border-red-500/20">
                    {pendingMentors.length} pending
                  </span>
                )}
              </CardTitle>
              <CardDescription>Review and approve or reject mentor applications below.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {pendingMentors.length === 0 ? (
                <div className="py-16 text-center">
                  <CheckCircle2 className="w-10 h-10 text-green-400/30 mx-auto mb-3" />
                  <p className="font-bold text-foreground">All caught up!</p>
                  <p className="text-sm text-muted-foreground mt-1">No pending mentor applications.</p>
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {pendingMentors.map(m => (
                    <div key={m.userId} className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-bold text-foreground">{m.name}</p>
                          <Badge variant="outline" className="text-[10px] border-green-500/30 text-green-400">
                            Pending Review
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{m.headline}</p>
                        <p className="text-xs text-muted-foreground">{m.college}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {(m.subjects || []).slice(0, 4).map(s => (
                            <span key={s} className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-surface-elevated text-muted-foreground border border-border">{s}</span>
                          ))}
                          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <IndianRupee className="w-3 h-3" />{m.fee}/session
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button
                          size="sm"
                          disabled={approvingId === m.userId}
                          onClick={() => handleApprove(m.userId)}
                          className="bg-green-500 hover:bg-green-600 text-white font-bold gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={approvingId === m.userId}
                          onClick={() => handleReject(m.userId)}
                          className="text-red-400 hover:bg-red-500/10 hover:text-red-400 font-bold gap-1.5"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
