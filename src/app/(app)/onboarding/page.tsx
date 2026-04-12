'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { db } from '@/lib/firebase/config';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { GraduationCap, BookOpen, MapPin, Sparkles, Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export default function OnboardingPage() {
  const { user, profile, setProfile } = useAuth();
  const router = useRouter();

  const [college, setCollege] = useState(profile?.college || '');
  const [branch, setBranch] = useState(profile?.branch || '');
  const [semester, setSemester] = useState(profile?.semester?.toString() || '1');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setIsSubmitting(true);
      const userRef = doc(db, 'users', user.uid);
      
      const updates = {
        college,
        branch,
        semester: parseInt(semester, 10),
        updatedAt: serverTimestamp(),
      };

      await updateDoc(userRef, updates);
      
      // Update local state
      if (profile) {
        setProfile({ ...profile, ...updates });
      }

      toast.success('Profile completed! Welcome to SkillBridge.');
      router.push('/feed');
    } catch (error: any) {
      console.error('Error during onboarding:', error);
      toast.error('Failed to save profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 via-transparent to-indigo-500/5 pointer-events-none" />
      
      <Card className="w-full max-w-lg bg-surface-card/80 backdrop-blur-xl border-border/50 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-brand-500 via-indigo-500 to-brand-500 animate-shimmer" />
        
        <form onSubmit={handleSubmit}>
          <CardHeader className="space-y-4 pb-8">
            <div className="w-16 h-16 rounded-2xl bg-brand-500/10 flex items-center justify-center mb-2 border border-brand-500/20">
              <Sparkles className="w-8 h-8 text-brand-500" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-3xl font-black tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Complete Your Profile
              </CardTitle>
              <CardDescription className="text-base text-muted-foreground">
                Just a few more details to get you started on your learning journey.
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="grid gap-6">
              <div className="space-y-2">
                <Label htmlFor="college" className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <GraduationCap className="w-3.5 h-3.5" />
                  College / University
                </Label>
                <Input 
                  id="college" 
                  placeholder="e.g. Stanford University" 
                  value={college}
                  onChange={(e) => setCollege(e.target.value)}
                  required
                  className="h-12 bg-surface-elevated/50 border-border/50 focus:border-brand-500/50 transition-all rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="branch" className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <BookOpen className="w-3.5 h-3.5" />
                    Branch
                  </Label>
                  <Input 
                    id="branch" 
                    placeholder="e.g. Computer Science" 
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    required
                    className="h-12 bg-surface-elevated/50 border-border/50 focus:border-brand-500/50 transition-all rounded-xl"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="semester" className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5" />
                    Semester
                  </Label>
                  <select 
                    id="semester"
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    className="flex h-12 w-full rounded-xl border border-border/50 bg-surface-elevated/50 px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all focus:border-brand-500/50"
                  >
                    {[1,2,3,4,5,6,7,8].map(s => (
                      <option key={s} value={s}>Semester {s}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-brand-500/5 border border-brand-500/10 flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-brand-500" />
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                By providing your college details, you&apos;ll be able to connect with peers from your campus and find mentors who understand your curriculum.
              </p>
            </div>
          </CardContent>
          
          <CardFooter className="pt-4 pb-8">
            <Button 
              type="submit" 
              disabled={isSubmitting} 
              className="w-full h-14 bg-brand-500 hover:bg-brand-600 text-white font-bold text-base rounded-2xl transition-all shadow-xl shadow-brand-500/20 group"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <span className="flex items-center">
                  Finalize Profile
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
