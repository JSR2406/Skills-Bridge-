'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ArrowRight, ArrowLeft, Check, GraduationCap, Users, BookOpen, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const SUBJECTS = [
  'Engineering Mathematics', 'Data Structures', 'Algorithms', 'Web Development', 
  'Machine Learning', 'DBMS', 'Operating Systems', 'Computer Networks', 'Physics', 'Chemistry'
];

export default function OnboardingPage() {
  const { user, profile, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    college: '',
    branch: '',
    semester: '1',
    role: 'student' as 'student' | 'mentor',
    subjects: [] as string[],
    bio: ''
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

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const toggleSubject = (sub: string) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.includes(sub) 
        ? prev.subjects.filter(s => s !== sub)
        : [...prev.subjects, sub]
    }));
  };

  const handleSubmit = async () => {
    if (!user) return;
    
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
        bio: formData.bio,
        subjects: formData.subjects,
        socialLinks: {},
        reputation: 0,
        badges: [],
        streakDays: 0,
        answersCount: 0,
        acceptedAnswersCount: 0,
        tasksCompletedCount: 0,
        testAttemptsCount: 0,
        mentorApproved: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      toast.success('Welcome to SkillBridge!');
      router.push('/feed');
    } catch (error: any) {
      console.error('Error creating profile:', error);
      toast.error(error.message || 'Failed to create profile.');
      setIsSubmitting(false);
    }
  };

  const stepVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
      </div>
      
      <div className="w-full max-w-xl z-10">
        {/* Progress Bar */}
        <div className="mb-8 flex justify-between items-center px-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex items-center flex-1 last:flex-none">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-500 ${step >= i ? 'bg-brand-500 text-white' : 'bg-surface-elevated text-text-secondary'}`}>
                {step > i ? <Check className="w-5 h-5" /> : i}
              </div>
              {i < 4 && (
                <div className={`h-1 flex-1 mx-2 transition-colors duration-500 ${step > i ? 'bg-brand-500' : 'bg-surface-elevated'}`} />
              )}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            variants={stepVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            <Card className="bg-surface-card border-border shadow-2xl">
              <CardHeader className="text-center">
                {step === 1 && (
                  <>
                    <CardTitle className="text-3xl font-bold flex items-center justify-center gap-2">
                      <Sparkles className="text-brand-500" /> Choose Your Path
                    </CardTitle>
                    <CardDescription>How do you plan to use SkillBridge?</CardDescription>
                  </>
                )}
                {step === 2 && (
                  <>
                    <CardTitle className="text-3xl font-bold flex items-center justify-center gap-2">
                      <GraduationCap className="text-brand-500" /> Education Details
                    </CardTitle>
                    <CardDescription>Help us find documents and peers from your college.</CardDescription>
                  </>
                )}
                {step === 3 && (
                  <>
                    <CardTitle className="text-3xl font-bold flex items-center justify-center gap-2">
                      <BookOpen className="text-brand-500" /> Your Interests
                    </CardTitle>
                    <CardDescription>Select subjects you want to master.</CardDescription>
                  </>
                )}
                {step === 4 && (
                  <>
                    <CardTitle className="text-3xl font-bold flex items-center justify-center gap-2">
                      <Users className="text-brand-500" /> Final Touches
                    </CardTitle>
                    <CardDescription>Tell the community a bit about yourself.</CardDescription>
                  </>
                )}
              </CardHeader>
              
              <CardContent className="min-h-[300px] py-6">
                {step === 1 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      onClick={() => setFormData({...formData, role: 'student'})}
                      className={`p-6 rounded-2xl border-2 transition-all text-left ${formData.role === 'student' ? 'border-brand-500 bg-brand-500/5' : 'border-border hover:border-brand-500/50'}`}
                    >
                      <div className="w-12 h-12 bg-brand-500/20 rounded-xl flex items-center justify-center mb-4">
                        <GraduationCap className="w-6 h-6 text-brand-500" />
                      </div>
                      <h3 className="text-lg font-bold mb-1">Student</h3>
                      <p className="text-sm text-text-secondary">Ask doubts, take tests, and learn from peers.</p>
                    </button>
                    <button
                      onClick={() => setFormData({...formData, role: 'mentor'})}
                      className={`p-6 rounded-2xl border-2 transition-all text-left ${formData.role === 'mentor' ? 'border-brand-500 bg-brand-500/5' : 'border-border hover:border-brand-500/50'}`}
                    >
                      <div className="w-12 h-12 bg-brand-500/20 rounded-xl flex items-center justify-center mb-4">
                        <Users className="w-6 h-6 text-brand-500" />
                      </div>
                      <h3 className="text-lg font-bold mb-1">Mentor</h3>
                      <p className="text-sm text-text-secondary">Share knowledge, answer doubts, and guide others.</p>
                    </button>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-4 max-w-sm mx-auto">
                    <div className="space-y-2">
                      <Label>College/University</Label>
                      <Input 
                        placeholder="e.g. IIT Delhi" 
                        value={formData.college}
                        onChange={e => setFormData({...formData, college: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Branch/Major</Label>
                      <Input 
                        placeholder="e.g. Computer Science" 
                        value={formData.branch}
                        onChange={e => setFormData({...formData, branch: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Semester</Label>
                      <Select value={formData.semester} onValueChange={v => setFormData({...formData, semester: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {[1,2,3,4,5,6,7,8].map(s => <SelectItem key={s} value={s.toString()}>Semester {s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="flex flex-wrap gap-2 justify-center">
                    {SUBJECTS.map(sub => (
                      <button
                        key={sub}
                        onClick={() => toggleSubject(sub)}
                        className={`px-4 py-2 rounded-full border transition-all ${formData.subjects.includes(sub) ? 'bg-brand-500 text-white border-brand-500 shadow-lg shadow-brand-500/20' : 'bg-surface-elevated text-text-secondary border-border hover:border-brand-500/50'}`}
                      >
                        {sub}
                      </button>
                    ))}
                  </div>
                )}

                {step === 4 && (
                  <div className="space-y-4 max-w-sm mx-auto">
                    <div className="space-y-2">
                      <Label>Professional Bio</Label>
                      <textarea
                        className="w-full h-32 bg-surface-elevated border-border rounded-xl p-4 resize-none transition-all focus:ring-2 focus:ring-brand-500/50 outline-none"
                        placeholder="Share your goals or expertise..."
                        value={formData.bio}
                        onChange={e => setFormData({...formData, bio: e.target.value})}
                      />
                    </div>
                  </div>
                )}
              </CardContent>

              <div className="p-6 border-t border-border flex justify-between gap-4">
                <Button 
                  variant="ghost" 
                  onClick={prevStep} 
                  disabled={step === 1 || isSubmitting}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </Button>
                
                {step < 4 ? (
                  <Button 
                    onClick={nextStep}
                    disabled={(step === 2 && !formData.college) || (step === 3 && formData.subjects.length === 0)}
                    className="bg-brand-500 hover:bg-brand-600 text-white flex items-center gap-2"
                  >
                    Next <ArrowRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button 
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="bg-brand-500 hover:bg-brand-600 text-white px-8"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                    Finish Setup
                  </Button>
                )}
              </div>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
