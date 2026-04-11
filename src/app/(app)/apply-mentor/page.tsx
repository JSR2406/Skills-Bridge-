'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { applyForMentor } from '@/features/mentors/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function MentorApplicationPage() {
  const { user, profile } = useAuth();
  const router = useRouter();

  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [subjects, setSubjects] = useState('');
  const [expertise, setExpertise] = useState('');
  const [fee, setFee] = useState('200');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) {
      toast.error('You must be logged in');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const parsedSubjects = subjects.split(',').map(s => s.trim()).filter(Boolean);
      const parsedExpertise = expertise.split(',').map(e => e.trim()).filter(Boolean);

      await applyForMentor(user.uid, {
        name: profile.name,
        avatarUrl: profile.avatarUrl || '',
        college: profile.college,
        headline,
        bio,
        subjects: parsedSubjects,
        expertise: parsedExpertise,
        fee: parseInt(fee, 10) || 0,
      });

      toast.success('Mentor application submitted successfully! Pending admin approval.');
      router.push('/feed');
    } catch (error: any) {
      console.error('Error applying for mentor:', error);
      toast.error('Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in pb-16">
      <div className="space-y-1 pb-4 border-b border-border">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Become a Mentor</h1>
        <p className="text-sm text-muted-foreground">
          Share your knowledge, help juniors, and earn while you learn.
        </p>
      </div>

      <Card className="bg-surface-card border-border shadow-sm">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle className="text-lg">Mentor Profile</CardTitle>
            <CardDescription>
              This information will be displayed publicly on your mentor profile.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="headline">Headline</Label>
              <Input 
                id="headline"
                placeholder="e.g. SDE Intern @ Google | Open Source Contributor"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                required
                className="bg-surface-elevated"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bio">About You</Label>
              <textarea 
                id="bio"
                placeholder="Detail your experience, achievements, and how you can help students..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                required
                rows={4}
                className="flex w-full rounded-md border border-input bg-surface-elevated px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subjects">Subjects (comma separated)</Label>
              <Input 
                id="subjects"
                placeholder="e.g. DSA, Web Dev, System Design"
                value={subjects}
                onChange={(e) => setSubjects(e.target.value)}
                required
                className="bg-surface-elevated"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expertise">Key Expertise (comma separated)</Label>
              <Input 
                id="expertise"
                placeholder="e.g. React, Node.js, C++"
                value={expertise}
                onChange={(e) => setExpertise(e.target.value)}
                required
                className="bg-surface-elevated"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fee">Session Fee (INR / 30 mins)</Label>
              <Input 
                id="fee"
                type="number"
                min="0"
                placeholder="200"
                value={fee}
                onChange={(e) => setFee(e.target.value)}
                required
                className="bg-surface-elevated"
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-3 pt-6 border-t border-border/50">
            <Button variant="ghost" type="button" onClick={() => router.back()} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-brand-500 hover:bg-brand-600 text-white min-w-[120px]">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Submit Application
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
