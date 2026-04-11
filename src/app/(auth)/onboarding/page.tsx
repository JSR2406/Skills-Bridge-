'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function OnboardingPage() {
  const { user, profile, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    college: '',
    branch: '',
    semester: '1',
    role: 'student' as 'student' | 'mentor'
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/login');
    } else if (!loading && profile) {
      router.replace('/feed');
    }
  }, [loading, isAuthenticated, profile, router]);

  if (loading || !isAuthenticated || profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    if (!formData.college) {
      toast.error('Please enter your college name');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email || '',
        name: user.displayName || 'SkillBridge User',
        avatarUrl: user.photoURL || '',
        role: formData.role,
        college: formData.college,
        branch: formData.branch,
        semester: parseInt(formData.semester),
        bio: '',
        subjects: [],
        socialLinks: {},
        reputation: 0,
        badges: [],
        streakDays: 0,
        answersCount: 0,
        acceptedAnswersCount: 0,
        mentorApproved: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      toast.success('Profile created successfully!');
      // AuthProvider will detect the new document and update profile, sending us to feed
      
      // Let's do an explicit push in case the listener takes a moment
      router.push('/feed');
    } catch (error: any) {
      console.error('Error creating profile:', error);
      toast.error(error.message || 'Failed to create profile. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-500/10 rounded-full blur-[120px] pointer-events-none" />
      
      <Card className="w-full max-w-md bg-surface-card border-border shadow-2xl z-10 animate-fade-in">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Complete Your Profile</CardTitle>
          <CardDescription className="text-center">
            Tell us a bit about yourself to get started on SkillBridge.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="college">College/University</Label>
              <Input 
                id="college" 
                placeholder="e.g. Stanford University" 
                value={formData.college}
                onChange={(e) => setFormData({...formData, college: e.target.value})}
                className="bg-surface-elevated"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="branch">Branch / Major</Label>
              <Input 
                id="branch" 
                placeholder="e.g. Computer Science" 
                value={formData.branch}
                onChange={(e) => setFormData({...formData, branch: e.target.value})}
                className="bg-surface-elevated"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="semester">Current Semester</Label>
              <Select 
                value={formData.semester} 
                onValueChange={(val: string | null) => { if (val) setFormData({...formData, semester: val}) }}
              >
                <SelectTrigger className="bg-surface-elevated">
                  <SelectValue placeholder="Select Semester" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                    <SelectItem key={sem} value={sem.toString()}>Semester {sem}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="role">I am joining primarily as a...</Label>
              <Select 
                value={formData.role} 
                onValueChange={(val: string | null) => { if (val) setFormData({...formData, role: val as 'student' | 'mentor'}) }}
              >
                <SelectTrigger className="bg-surface-elevated">
                  <SelectValue placeholder="Select Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student (Learn & Ask)</SelectItem>
                  <SelectItem value="mentor">Mentor (Teach & Earn)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" className="w-full mt-6 bg-brand-500 hover:bg-brand-600 text-white font-medium" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Complete Setup
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
