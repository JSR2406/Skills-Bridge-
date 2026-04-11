'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { db } from '@/lib/firebase/config';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Save, UserCircle, Link as LinkIcon, AlertCircle } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

export default function SettingsPage() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    avatarUrl: '',
    college: '',
    branch: '',
    semester: '',
    github: '',
    linkedin: '',
    portfolio: ''
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        bio: profile.bio || '',
        avatarUrl: profile.avatarUrl || '',
        college: profile.college || '',
        branch: profile.branch || '',
        semester: profile.semester ? profile.semester.toString() : '',
        github: profile.socialLinks?.github || '',
        linkedin: profile.socialLinks?.linkedin || '',
        portfolio: profile.socialLinks?.portfolio || ''
      });
    }
  }, [profile]);

  const handleSave = async () => {
    if (!user || !profile) return;
    setLoading(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        name: formData.name,
        bio: formData.bio,
        avatarUrl: formData.avatarUrl,
        college: formData.college,
        branch: formData.branch,
        semester: parseInt(formData.semester) || 1,
        'socialLinks.github': formData.github,
        'socialLinks.linkedin': formData.linkedin,
        'socialLinks.portfolio': formData.portfolio,
        updatedAt: serverTimestamp()
      });
      toast.success('Profile updated successfully!');
      
      // We can force reload or wait for onSnapshot from useAuth to automatically update the local state.
      // useAuth automatically listens via onSnapshot to the user doc, so it updates instantly!
    } catch (error: any) {
      toast.error('Failed to update profile: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!profile) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-20">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground mb-2 font-['Plus_Jakarta_Sans']">Settings & Profile</h1>
        <p className="text-muted-foreground">Manage your personal information, links, and how others see you on SkillBridge.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column (Main Config) */}
        <div className="md:col-span-2 space-y-6">
          <Card className="bg-surface-card border-border shadow-md relative overflow-hidden">
             <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/5 blur-[80px] pointer-events-none rounded-full" />
             <CardHeader>
               <CardTitle className="flex items-center gap-2"><UserCircle className="w-5 h-5 text-brand-400" /> Basic Details</CardTitle>
               <CardDescription>Your public identity and bio.</CardDescription>
             </CardHeader>
             <CardContent className="space-y-4">
               <div>
                  <Label>Display Name</Label>
                  <Input 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                    placeholder="Your actual name"
                    className="mt-1.5 bg-background border-border/50"
                  />
               </div>
               <div>
                  <Label>Avatar URL</Label>
                  <Input 
                    value={formData.avatarUrl} 
                    onChange={e => setFormData({...formData, avatarUrl: e.target.value})} 
                    placeholder="https://imgur.com/..."
                    className="mt-1.5 bg-background border-border/50"
                  />
                  <p className="text-xs text-muted-foreground mt-1.5">Paste a direct image link (e.g. from GitHub, Imgur). Square works best.</p>
               </div>
               <div>
                  <Label>Bio / Tagline</Label>
                  <Textarea 
                    value={formData.bio} 
                    onChange={e => setFormData({...formData, bio: e.target.value})} 
                    placeholder="A short description about yourself, your goals, or what you're learning..."
                    className="mt-1.5 bg-background border-border/50 resize-none h-24"
                  />
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                 <div>
                    <Label>College</Label>
                    <Input 
                      value={formData.college} 
                      onChange={e => setFormData({...formData, college: e.target.value})} 
                      className="mt-1.5 bg-background border-border/50"
                    />
                 </div>
                 <div>
                    <Label>Branch</Label>
                    <Input 
                      value={formData.branch} 
                      onChange={e => setFormData({...formData, branch: e.target.value})} 
                      className="mt-1.5 bg-background border-border/50"
                    />
                 </div>
                 <div>
                    <Label>Semester</Label>
                    <Input 
                      type="number"
                      min="1"
                      max="10"
                      value={formData.semester} 
                      onChange={e => setFormData({...formData, semester: e.target.value})} 
                      className="mt-1.5 bg-background border-border/50"
                    />
                 </div>
               </div>
             </CardContent>
          </Card>

          <Card className="bg-surface-card border-border shadow-md">
             <CardHeader>
               <CardTitle className="flex items-center gap-2"><LinkIcon className="w-5 h-5 text-indigo-400" /> Social Links</CardTitle>
               <CardDescription>Connect your external profiles so mentors and peers can find you.</CardDescription>
             </CardHeader>
             <CardContent className="space-y-4">
               <div>
                  <Label>GitHub URL</Label>
                  <Input 
                    value={formData.github} 
                    onChange={e => setFormData({...formData, github: e.target.value})} 
                    placeholder="https://github.com/username"
                    className="mt-1.5 bg-background border-border/50 font-mono text-sm"
                  />
               </div>
               <div>
                  <Label>LinkedIn URL</Label>
                  <Input 
                    value={formData.linkedin} 
                    onChange={e => setFormData({...formData, linkedin: e.target.value})} 
                    placeholder="https://linkedin.com/in/username"
                    className="mt-1.5 bg-background border-border/50 font-mono text-sm"
                  />
               </div>
               <div>
                  <Label>Portfolio URL</Label>
                  <Input 
                    value={formData.portfolio} 
                    onChange={e => setFormData({...formData, portfolio: e.target.value})} 
                    placeholder="https://yourwebsite.com"
                    className="mt-1.5 bg-background border-border/50 font-mono text-sm"
                  />
               </div>
             </CardContent>
          </Card>
          
          <div className="flex items-center justify-end">
            <Button onClick={handleSave} disabled={loading} size="lg" className="w-full md:w-auto bg-brand-500 hover:bg-brand-600 text-brand-950 font-bold px-8 shadow-[0_0_20px_rgba(79,219,200,0.3)] hover:shadow-[0_0_24px_rgba(79,219,200,0.5)] transition-all">
              {loading ? 'Saving...' : (
                <>
                  <Save className="w-4 h-4 mr-2" /> Save Changes
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Right Column (Info / Readonly) */}
        <div className="space-y-6">
          <Card className="bg-surface border-border shadow-sm">
             <CardContent className="p-6">
               <div className="flex flex-col items-center text-center">
                 <div className="w-24 h-24 rounded-full border-4 border-surface-elevated overflow-hidden bg-surface-card flex items-center justify-center mb-4">
                   {formData.avatarUrl ? (
                     <img src={formData.avatarUrl} alt="Preview" className="w-full h-full object-cover" />
                   ) : (
                     <UserCircle className="w-12 h-12 text-muted-foreground" />
                   )}
                 </div>
                 <h3 className="font-bold text-foreground text-lg">{formData.name || 'Your Name'}</h3>
                 <p className="text-xs font-semibold text-brand-500 uppercase tracking-wider mt-1">{profile.role}</p>
                 <p className="text-sm text-muted-foreground mt-3">{formData.bio || 'Your bio will appear here.'}</p>
               </div>
             </CardContent>
          </Card>

          <Card className="bg-[rgba(255,68,68,0.05)] border-[rgba(255,68,68,0.2)]">
             <CardHeader className="pb-3">
               <CardTitle className="text-red-400 flex items-center gap-2 text-sm"><AlertCircle className="w-4 h-4" /> Danger Zone</CardTitle>
             </CardHeader>
             <CardContent>
               <p className="text-xs text-muted-foreground mb-4">
                 Deleting your account is permanent. All your data, doubts, and reputation points will be removed entirely from SkillBridge.
               </p>
               <Button variant="destructive" size="sm" className="w-full bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/30">
                 Request Account Deletion
               </Button>
             </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
